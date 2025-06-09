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