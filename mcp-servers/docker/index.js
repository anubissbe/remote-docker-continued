#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import Docker from 'dockerode';
import { z } from 'zod';

// Initialize Docker client
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

// Tool schemas
const ListContainersSchema = z.object({
  all: z.boolean().optional().describe('Show all containers (default shows just running)'),
});

const ContainerActionSchema = z.object({
  containerId: z.string().describe('Container ID or name'),
});

const ExecCommandSchema = z.object({
  containerId: z.string().describe('Container ID or name'),
  command: z.array(z.string()).describe('Command to execute'),
});

const ListImagesSchema = z.object({
  all: z.boolean().optional().describe('Show all images'),
});

// Create MCP server
const server = new Server(
  {
    name: 'mcp-docker',
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
        name: 'list_containers',
        description: 'List Docker containers',
        inputSchema: {
          type: 'object',
          properties: {
            all: {
              type: 'boolean',
              description: 'Show all containers (default shows just running)',
            },
          },
        },
      },
      {
        name: 'start_container',
        description: 'Start a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'Container ID or name',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'stop_container',
        description: 'Stop a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'Container ID or name',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'restart_container',
        description: 'Restart a Docker container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'Container ID or name',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'exec_command',
        description: 'Execute a command in a running container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'Container ID or name',
            },
            command: {
              type: 'array',
              items: { type: 'string' },
              description: 'Command to execute',
            },
          },
          required: ['containerId', 'command'],
        },
      },
      {
        name: 'container_logs',
        description: 'Get logs from a container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'Container ID or name',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'list_images',
        description: 'List Docker images',
        inputSchema: {
          type: 'object',
          properties: {
            all: {
              type: 'boolean',
              description: 'Show all images',
            },
          },
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
      case 'list_containers': {
        const validated = ListContainersSchema.parse(args);
        const containers = await docker.listContainers({ all: validated.all });
        
        const formatted = containers.map(container => ({
          id: container.Id.substring(0, 12),
          name: container.Names[0]?.replace('/', ''),
          image: container.Image,
          status: container.Status,
          state: container.State,
        }));
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }
      
      case 'start_container': {
        const validated = ContainerActionSchema.parse(args);
        const container = docker.getContainer(validated.containerId);
        await container.start();
        
        return {
          content: [
            {
              type: 'text',
              text: `Container ${validated.containerId} started successfully`,
            },
          ],
        };
      }
      
      case 'stop_container': {
        const validated = ContainerActionSchema.parse(args);
        const container = docker.getContainer(validated.containerId);
        await container.stop();
        
        return {
          content: [
            {
              type: 'text',
              text: `Container ${validated.containerId} stopped successfully`,
            },
          ],
        };
      }
      
      case 'restart_container': {
        const validated = ContainerActionSchema.parse(args);
        const container = docker.getContainer(validated.containerId);
        await container.restart();
        
        return {
          content: [
            {
              type: 'text',
              text: `Container ${validated.containerId} restarted successfully`,
            },
          ],
        };
      }
      
      case 'exec_command': {
        const validated = ExecCommandSchema.parse(args);
        const container = docker.getContainer(validated.containerId);
        
        const exec = await container.exec({
          Cmd: validated.command,
          AttachStdout: true,
          AttachStderr: true,
        });
        
        const stream = await exec.start();
        
        return new Promise((resolve, reject) => {
          let output = '';
          
          stream.on('data', (chunk) => {
            // Docker multiplexes stdout/stderr, skip the header
            const data = chunk.toString('utf8');
            output += data.substring(8); // Skip 8-byte header
          });
          
          stream.on('end', () => {
            resolve({
              content: [
                {
                  type: 'text',
                  text: output,
                },
              ],
            });
          });
          
          stream.on('error', reject);
        });
      }
      
      case 'container_logs': {
        const validated = ContainerActionSchema.parse(args);
        const container = docker.getContainer(validated.containerId);
        
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          tail: 100,
          timestamps: true,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: logs.toString('utf8'),
            },
          ],
        };
      }
      
      case 'list_images': {
        const validated = ListImagesSchema.parse(args);
        const images = await docker.listImages({ all: validated.all });
        
        const formatted = images.map(image => ({
          id: image.Id.substring(7, 19), // Remove 'sha256:' prefix
          repository: image.RepoTags?.[0] || '<none>',
          size: `${Math.round(image.Size / 1024 / 1024)}MB`,
          created: new Date(image.Created * 1000).toISOString(),
        }));
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2),
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
  console.error('Docker MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});