# MCP Toolkit Integration for Remote Docker

## Overview

The MCP (Model Context Protocol) Toolkit integration allows users to run MCP servers on remote Docker hosts, providing the same functionality as Docker Desktop's local MCP implementation but for remote environments.

## Architecture

### Components

1. **MCP Manager Service** (Backend)
   - Manages MCP server lifecycle on remote hosts
   - Handles SSH tunneling for MCP connections
   - Monitors MCP server status

2. **MCP UI Component** (Frontend)
   - Server selection interface
   - Configuration management
   - Status monitoring dashboard

3. **MCP Bridge** (Remote)
   - Docker container running on remote host
   - Exposes MCP server endpoints
   - Manages tool permissions

### Flow

```
Docker Desktop Extension
    |
    ├── MCP UI Component
    |   └── Select/Configure MCP Servers
    |
    ├── Extension Backend
    |   ├── MCP Manager Service
    |   └── SSH Tunnel Manager
    |
    └── Remote Docker Host
        ├── MCP Server Container
        └── Tool Containers
```

## MCP Catalog Browser (v1.0.15+)

The extension now includes a built-in MCP catalog browser that allows users to discover and install MCP servers with a single click.

### Features

- **Browse Catalog**: Explore 8+ MCP server types with descriptions and metadata
- **Search & Filter**: Find servers by name, description, or category
- **One-Click Install**: Install any server directly from the catalog
- **Auto-Configuration**: Smart configuration based on server type
- **Real-time Metrics**: View download counts, star ratings, and tags

### Available Categories

- **Storage**: Filesystem access, volume management
- **Docker**: Container and image management
- **Shell**: Command execution environments
- **Kubernetes**: K8s cluster management
- **Database**: PostgreSQL, MySQL, MongoDB connectors
- **Git**: Repository operations
- **Monitoring**: Metrics and observability
- **AI/LLM**: AI model integrations

## MCP Server Types

1. **Filesystem MCP Server**
   - Access remote filesystem
   - File operations (read, write, list)
   - Directory navigation
   - Configurable root path and permissions

2. **Docker MCP Server**
   - Container management
   - Image operations
   - Volume/Network access

3. **Shell MCP Server**
   - Execute commands
   - Script execution
   - Process management

4. **Custom MCP Servers**
   - User-defined tools
   - Custom integrations
   - Plugin architecture

## Security Considerations

1. **Authentication**
   - SSH key-based auth for tunnel
   - MCP server API keys
   - Per-tool permissions

2. **Network Security**
   - All traffic through SSH tunnel
   - No direct MCP port exposure
   - Encrypted communication

3. **Access Control**
   - Tool-level permissions
   - Read-only mode support
   - Audit logging

## Using the MCP Catalog

### Installing from Catalog

1. Navigate to the **MCP Servers** page
2. Click the **Browse Catalog** tab
3. Search or filter to find desired servers
4. Click **Install** on any server
5. (Optional) Provide a custom name
6. Click **Install & Start**

### Managing Installed Servers

1. Switch to the **Installed Servers** tab
2. View all running MCP servers
3. Start/Stop servers with one click
4. Delete servers when no longer needed

## Implementation Status

### ✅ Completed Features
- MCP server container definition
- SSH tunnel management for MCP
- Server lifecycle management (create, start, stop, delete)
- MCP server selection UI with catalog browser
- Configuration interface with auto-configuration
- Real-time status monitoring
- Filesystem, Docker, and Shell server support
- Multi-server management
- One-click installation from catalog

### 🚧 Planned Features
- Real Docker Hub MCP catalog API integration
- Custom server template creation
- Advanced permission management
- Performance monitoring dashboard