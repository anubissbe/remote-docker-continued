#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { z } from 'zod';

// Environment configuration
const FILESYSTEM_ROOT = process.env.FILESYSTEM_ROOT || '/workspace';
const ALLOWED_OPERATIONS = process.env.ALLOWED_OPERATIONS?.split(',') || ['read', 'write', 'list', 'search'];

// Ensure paths are within the allowed root
function normalizePath(requestedPath) {
  const normalized = path.normalize(path.join(FILESYSTEM_ROOT, requestedPath));
  if (!normalized.startsWith(FILESYSTEM_ROOT)) {
    throw new McpError(ErrorCode.InvalidRequest, 'Path access denied');
  }
  return normalized;
}

// Tool schemas
const ReadFileSchema = z.object({
  path: z.string().describe('Path to the file to read'),
});

const WriteFileSchema = z.object({
  path: z.string().describe('Path to the file to write'),
  content: z.string().describe('Content to write to the file'),
});

const ListDirectorySchema = z.object({
  path: z.string().describe('Path to the directory to list'),
});

const SearchFilesSchema = z.object({
  pattern: z.string().describe('Glob pattern to search for files'),
  path: z.string().optional().describe('Base path to search from'),
});

// Create MCP server
const server = new Server(
  {
    name: 'mcp-filesystem',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [];
  
  if (ALLOWED_OPERATIONS.includes('read')) {
    tools.push({
      name: 'read_file',
      description: 'Read the contents of a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to read',
          },
        },
        required: ['path'],
      },
    });
  }
  
  if (ALLOWED_OPERATIONS.includes('write')) {
    tools.push({
      name: 'write_file',
      description: 'Write content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to write',
          },
          content: {
            type: 'string',
            description: 'Content to write to the file',
          },
        },
        required: ['path', 'content'],
      },
    });
  }
  
  if (ALLOWED_OPERATIONS.includes('list')) {
    tools.push({
      name: 'list_directory',
      description: 'List files and directories in a given path',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the directory to list',
          },
        },
        required: ['path'],
      },
    });
  }
  
  if (ALLOWED_OPERATIONS.includes('search')) {
    tools.push({
      name: 'search_files',
      description: 'Search for files using glob patterns',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Glob pattern to search for files',
          },
          path: {
            type: 'string',
            description: 'Base path to search from',
          },
        },
        required: ['pattern'],
      },
    });
  }
  
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'read_file': {
        if (!ALLOWED_OPERATIONS.includes('read')) {
          throw new McpError(ErrorCode.InvalidRequest, 'Read operation not allowed');
        }
        
        const validated = ReadFileSchema.parse(args);
        const filePath = normalizePath(validated.path);
        
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        } catch (error) {
          if (error.code === 'ENOENT') {
            throw new McpError(ErrorCode.InvalidRequest, 'File not found');
          }
          throw error;
        }
      }
      
      case 'write_file': {
        if (!ALLOWED_OPERATIONS.includes('write')) {
          throw new McpError(ErrorCode.InvalidRequest, 'Write operation not allowed');
        }
        
        const validated = WriteFileSchema.parse(args);
        const filePath = normalizePath(validated.path);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Write file
        await fs.writeFile(filePath, validated.content, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: `File written successfully: ${validated.path}`,
            },
          ],
        };
      }
      
      case 'list_directory': {
        if (!ALLOWED_OPERATIONS.includes('list')) {
          throw new McpError(ErrorCode.InvalidRequest, 'List operation not allowed');
        }
        
        const validated = ListDirectorySchema.parse(args);
        const dirPath = normalizePath(validated.path);
        
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          const formatted = entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
          }));
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatted, null, 2),
              },
            ],
          };
        } catch (error) {
          if (error.code === 'ENOENT') {
            throw new McpError(ErrorCode.InvalidRequest, 'Directory not found');
          }
          throw error;
        }
      }
      
      case 'search_files': {
        if (!ALLOWED_OPERATIONS.includes('search')) {
          throw new McpError(ErrorCode.InvalidRequest, 'Search operation not allowed');
        }
        
        const validated = SearchFilesSchema.parse(args);
        const basePath = validated.path ? normalizePath(validated.path) : FILESYSTEM_ROOT;
        
        const matches = await glob(validated.pattern, {
          cwd: basePath,
          nodir: false,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(matches, null, 2),
            },
          ],
        };
      }
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Filesystem MCP server running with root: ${FILESYSTEM_ROOT}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});