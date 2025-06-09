# API Reference

This document describes the API endpoints provided by the Remote Docker Extension backend.

## Base URL

All API endpoints are available at the extension's backend URL when running.

## Endpoints

### Docker Operations

#### GET /api/containers
Get a list of all containers on the remote Docker host.

**Response:**
```json
[
  {
    "Id": "container-id",
    "Names": ["/container-name"],
    "Image": "image:tag",
    "State": "running",
    "Status": "Up 2 hours"
  }
]
```

#### GET /api/containers/:id/logs
Get logs for a specific container.

**Parameters:**
- `id` - Container ID or name

**Query Parameters:**
- `tail` - Number of lines to return (default: 100)
- `follow` - Stream logs (boolean)

#### GET /api/images
Get a list of all images on the remote Docker host.

**Response:**
```json
[
  {
    "Id": "image-id",
    "RepoTags": ["repository:tag"],
    "Size": 1234567,
    "Created": 1234567890
  }
]
```

#### GET /api/volumes
Get a list of all volumes on the remote Docker host.

**Response:**
```json
[
  {
    "Name": "volume-name",
    "Driver": "local",
    "Mountpoint": "/path/to/volume"
  }
]
```

#### GET /api/networks
Get a list of all networks on the remote Docker host.

**Response:**
```json
[
  {
    "Id": "network-id",
    "Name": "network-name",
    "Driver": "bridge",
    "Scope": "local"
  }
]
```

### Environment Management

#### GET /api/environments
Get a list of configured remote Docker environments.

**Response:**
```json
[
  {
    "name": "production",
    "host": "ssh://user@host",
    "active": true
  }
]
```

#### POST /api/environments
Add a new remote Docker environment.

**Request Body:**
```json
{
  "name": "production",
  "host": "ssh://user@host",
  "sshKey": "/path/to/key"
}
```

#### PUT /api/environments/:name/activate
Activate a specific environment.

**Parameters:**
- `name` - Environment name

#### DELETE /api/environments/:name
Remove an environment configuration.

**Parameters:**
- `name` - Environment name

### MCP Server Operations

#### GET /mcp/predefined
Get a list of pre-configured MCP server templates.

**Response:**
```json
[
  {
    "id": "filesystem-basic",
    "name": "Filesystem Access",
    "description": "Read and write files on the remote host",
    "type": "filesystem",
    "icon": "folder",
    "config": {
      "image": "anthropic/mcp-server-filesystem:latest",
      "env": {"MCP_MODE": "filesystem"},
      "filesystem": {
        "rootPath": "/home",
        "readOnly": false
      }
    }
  }
]
```

#### POST /mcp/servers
Create a new MCP server instance.

**Query Parameters:**
- `username` - SSH username for the remote host
- `hostname` - Remote host address

**Request Body:**
```json
{
  "name": "My Filesystem Server",
  "type": "filesystem",
  "config": {
    "image": "anthropic/mcp-server-filesystem:latest",
    "env": {"MCP_MODE": "filesystem"},
    "filesystem": {
      "rootPath": "/home",
      "readOnly": false
    }
  }
}
```

**Response:**
```json
{
  "server": {
    "id": "mcp-filesystem-1234567890",
    "name": "My Filesystem Server",
    "type": "filesystem",
    "status": "creating",
    "port": 9000,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "MCP server creation initiated"
}
```

#### GET /mcp/servers
List all MCP servers for the current environment.

**Response:**
```json
{
  "servers": [
    {
      "id": "mcp-filesystem-1234567890",
      "name": "My Filesystem Server",
      "type": "filesystem",
      "status": "running",
      "port": 9000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### GET /mcp/servers/:id
Get details for a specific MCP server.

**Parameters:**
- `id` - MCP server ID

#### POST /mcp/servers/:id/start
Start a stopped MCP server.

**Parameters:**
- `id` - MCP server ID

**Query Parameters:**
- `username` - SSH username
- `hostname` - Remote host address

#### POST /mcp/servers/:id/stop
Stop a running MCP server.

**Parameters:**
- `id` - MCP server ID

**Query Parameters:**
- `username` - SSH username
- `hostname` - Remote host address

#### DELETE /mcp/servers/:id
Delete an MCP server.

**Parameters:**
- `id` - MCP server ID

**Query Parameters:**
- `username` - SSH username
- `hostname` - Remote host address

#### GET /mcp/servers/:id/logs
Get logs from an MCP server.

**Parameters:**
- `id` - MCP server ID

**Query Parameters:**
- `lines` - Number of log lines to return (default: 50)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "level": "info",
      "message": "MCP server started",
      "serverId": "mcp-filesystem-1234567890"
    }
  ]
}
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```