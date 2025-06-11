# API Documentation

## Overview

The Remote Docker Extension provides a RESTful API for managing remote Docker environments and MCP servers. All endpoints are served through the Unix socket at `/run/guest-services/backend.sock`.

## Base URL

```
http://localhost/api
```

## Authentication

Currently, the API does not require authentication as it runs within the Docker Desktop extension environment. SSH authentication is handled separately for remote connections.

## API Endpoints

### Environment Management

#### Connect to Environment
```http
POST /connect
```

**Request Body:**
```json
{
  "name": "production",
  "username": "user",
  "hostname": "192.168.1.100",
  "port": 22
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected successfully"
}
```

#### Get Tunnel Status
```http
GET /tunnel/status?username={username}&hostname={hostname}
```

**Response:**
```json
{
  "connected": true,
  "duration": "2h 15m",
  "lastActivity": "2024-01-10T15:30:00Z"
}
```

### Docker Operations

#### List Containers
```http
POST /containers/list
```

**Request Body:**
```json
{
  "username": "user",
  "hostname": "192.168.1.100",
  "all": true
}
```

**Response:**
```json
{
  "containers": [
    {
      "ID": "abc123",
      "Names": ["web-server"],
      "Image": "nginx:latest",
      "State": "running",
      "Status": "Up 2 hours",
      "Ports": ["80/tcp"]
    }
  ]
}
```

#### Get Container Logs
```http
POST /container/logs
```

**Request Body:**
```json
{
  "username": "user",
  "hostname": "192.168.1.100",
  "containerId": "abc123",
  "tail": 100,
  "follow": false
}
```

#### Container Actions
```http
POST /container/{action}
```

Actions: `start`, `stop`, `restart`, `pause`, `unpause`, `remove`

**Request Body:**
```json
{
  "username": "user",
  "hostname": "192.168.1.100",
  "containerId": "abc123"
}
```

### Image Management

#### List Images
```http
POST /images/list
```

#### Pull Image
```http
POST /image/pull
```

**Request Body:**
```json
{
  "username": "user",
  "hostname": "192.168.1.100",
  "imageName": "nginx:latest"
}
```

#### Remove Image
```http
POST /image/remove
```

### Volume Management

#### List Volumes
```http
POST /volumes/list
```

#### Create Volume
```http
POST /volume/create
```

**Request Body:**
```json
{
  "username": "user",
  "hostname": "192.168.1.100",
  "name": "data-volume"
}
```

### Network Management

#### List Networks
```http
POST /networks/list
```

#### Create Network
```http
POST /network/create
```

**Request Body:**
```json
{
  "username": "user",
  "hostname": "192.168.1.100",
  "name": "custom-network",
  "driver": "bridge"
}
```

### MCP Server Management

#### List MCP Servers
```http
GET /mcp/servers?username={username}&hostname={hostname}
```

**Response:**
```json
{
  "servers": [
    {
      "id": "mcp-123",
      "name": "filesystem",
      "type": "filesystem",
      "status": "running",
      "port": 9001,
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### Create MCP Server
```http
POST /mcp/server
```

**Request Body:**
```json
{
  "name": "my-filesystem",
  "type": "filesystem",
  "image": "mcp/filesystem:latest",
  "username": "user",
  "hostname": "192.168.1.100"
}
```

#### Start/Stop MCP Server
```http
POST /mcp/server/{id}/{action}
```

Actions: `start`, `stop`

#### Get MCP Catalog
```http
GET /mcp/catalog?page=1&search=filesystem&category=storage
```

**Response:**
```json
{
  "items": [
    {
      "name": "filesystem",
      "namespace": "mcp",
      "description": "File system access server",
      "fullName": "mcp/filesystem:latest",
      "categories": ["storage", "files"]
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

### Dashboard

#### Get Overview
```http
POST /dashboard/overview
```

**Response:**
```json
{
  "containers": {
    "total": 10,
    "running": 7,
    "stopped": 3
  },
  "images": {
    "total": 25
  },
  "volumes": {
    "total": 15
  },
  "networks": {
    "total": 5
  }
}
```

#### Get System Info
```http
POST /dashboard/systeminfo
```

**Response:**
```json
{
  "dockerVersion": "24.0.7",
  "os": "Ubuntu 22.04",
  "architecture": "x86_64",
  "cpus": 8,
  "memory": "16GB"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## WebSocket Endpoints

### Container Logs Stream
```
ws://localhost/ws/container/{id}/logs
```

### System Events
```
ws://localhost/ws/events
```

## Rate Limiting

Currently, no rate limiting is implemented as the API is intended for local use within Docker Desktop.

## Versioning

The API is currently at version 1.0. Future versions will be indicated in the URL path (e.g., `/api/v2/`).