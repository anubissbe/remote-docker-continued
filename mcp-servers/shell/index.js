#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import path from 'path';

const execAsync = promisify(exec);

// Configuration
const SHELL = process.env.SHELL || '/bin/bash';
const WORKING_DIR = process.env.WORKING_DIR || '/workspace';
const BLOCKED_COMMANDS = process.env.BLOCKED_COMMANDS?.split(',') || ['rm -rf /', 'dd', 'mkfs'];
const TIMEOUT = parseInt(process.env.COMMAND_TIMEOUT || '30000');

// Tool schemas
const ExecuteCommandSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  cwd: z.string().optional().describe('Working directory for command execution'),
});

const ExecuteScriptSchema = z.object({
  script: z.string().describe('Shell script to execute'),
  interpreter: z.string().optional().describe('Script interpreter (bash, sh, etc.)'),
});

// Check if command is blocked
function isCommandBlocked(command) {
  const lowerCommand = command.toLowerCase();
  return BLOCKED_COMMANDS.some(blocked => 
    lowerCommand.includes(blocked.toLowerCase())
  );
}

// Normalize working directory
function normalizeWorkingDir(cwd) {
  if (!cwd) return WORKING_DIR;
  
  const normalized = path.normalize(path.join(WORKING_DIR, cwd));
  if (!normalized.startsWith(WORKING_DIR)) {
    throw new McpError(ErrorCode.InvalidRequest, 'Working directory access denied');
  }
  return normalized;
}

// Create MCP server
const server = new Server(
  {
    name: 'mcp-shell',
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
  return {
    tools: [
      {
        name: 'execute_command',
        description: 'Execute a shell command',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Shell command to execute',
            },
            cwd: {
              type: 'string',
              description: 'Working directory for command execution',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'execute_script',
        description: 'Execute a shell script',
        inputSchema: {
          type: 'object',
          properties: {
            script: {
              type: 'string',
              description: 'Shell script to execute',
            },
            interpreter: {
              type: 'string',
              description: 'Script interpreter (bash, sh, etc.)',
            },
          },
          required: ['script'],
        },
      },
      {
        name: 'get_environment',
        description: 'Get current environment variables',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_working_directory',
        description: 'Get current working directory',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'execute_command': {
        const validated = ExecuteCommandSchema.parse(args);
        
        if (isCommandBlocked(validated.command)) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Command is blocked for security reasons'
          );
        }
        
        const cwd = normalizeWorkingDir(validated.cwd);
        
        try {
          const { stdout, stderr } = await execAsync(validated.command, {
            shell: SHELL,
            cwd,
            timeout: TIMEOUT,
            env: { ...process.env, PWD: cwd },
          });
          
          let output = stdout;
          if (stderr) {
            output += '\n--- STDERR ---\n' + stderr;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: output || 'Command completed with no output',
              },
            ],
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Command failed: ${error.message}\nOutput: ${error.stdout || ''}\nError: ${error.stderr || ''}`
          );
        }
      }
      
      case 'execute_script': {
        const validated = ExecuteScriptSchema.parse(args);
        const interpreter = validated.interpreter || 'bash';
        
        // Check if script contains blocked commands
        if (isCommandBlocked(validated.script)) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Script contains blocked commands'
          );
        }
        
        try {
          const { stdout, stderr } = await execAsync(validated.script, {
            shell: interpreter,
            cwd: WORKING_DIR,
            timeout: TIMEOUT,
            env: process.env,
          });
          
          let output = stdout;
          if (stderr) {
            output += '\n--- STDERR ---\n' + stderr;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: output || 'Script completed with no output',
              },
            ],
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Script failed: ${error.message}\nOutput: ${error.stdout || ''}\nError: ${error.stderr || ''}`
          );
        }
      }
      
      case 'get_environment': {
        const env = {};
        // Filter out sensitive environment variables
        const sensitiveKeys = ['PASSWORD', 'TOKEN', 'SECRET', 'KEY', 'PRIVATE'];
        
        for (const [key, value] of Object.entries(process.env)) {
          const isSensitive = sensitiveKeys.some(sensitive => 
            key.toUpperCase().includes(sensitive)
          );
          
          if (!isSensitive) {
            env[key] = value;
          } else {
            env[key] = '***REDACTED***';
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(env, null, 2),
            },
          ],
        };
      }
      
      case 'get_working_directory': {
        return {
          content: [
            {
              type: 'text',
              text: WORKING_DIR,
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
  console.error(`Shell MCP server running with shell: ${SHELL}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});