# User Guide

Welcome to the Remote Docker Extension! This guide will help you get started with managing remote Docker environments.

## Installation

Install the extension from Docker Desktop or using the command line:

```bash
docker extension install anubissbe/remote-docker:latest
```

## Getting Started

### Adding a Remote Environment

1. Open the Remote Docker extension in Docker Desktop
2. Navigate to the "Environments" tab
3. Click "Add Environment"
4. Enter the following details:
   - **Name**: A friendly name for your environment
   - **Host**: SSH connection string (e.g., `ssh://user@hostname`)
   - **SSH Key**: Path to your SSH private key

### Connecting to an Environment

1. Go to the "Environments" tab
2. Click on the environment you want to connect to
3. The extension will establish an SSH tunnel to the remote Docker daemon

### Managing Containers

Once connected, you can:
- View all containers on the remote host
- Start/Stop/Restart containers
- View container logs
- Remove containers

### Managing Images

The Images tab allows you to:
- View all images on the remote host
- Pull new images
- Remove unused images
- View image details

### Managing Volumes

In the Volumes tab, you can:
- List all volumes
- Create new volumes
- Remove unused volumes
- View volume details

### Managing Networks

The Networks tab provides:
- List of all networks
- Network details and configuration
- Create/remove networks

### MCP Toolkit Integration

The MCP Servers tab allows you to run Model Context Protocol servers on remote Docker hosts, enabling AI assistants to interact with your remote systems.

#### Installing from the MCP Catalog (v1.0.15+)

1. Navigate to the "MCP Servers" tab
2. Click the "Browse Catalog" tab
3. Browse or search for MCP servers:
   - Use the search bar to find servers by name or description
   - Filter by category (storage, docker, shell, kubernetes, etc.)
   - View download counts and ratings
4. Click "Install" on any server
5. Optionally provide a custom name
6. Click "Install & Start" to deploy

#### Creating an MCP Server Manually

1. Navigate to the "MCP Servers" tab
2. Stay on the "Installed Servers" tab
3. Click "New Server"
4. Choose from pre-configured templates:
   - **Filesystem Access**: Browse and edit files on the remote host
   - **Docker Management**: Control Docker via MCP
   - **Shell Access**: Execute bash commands
   - **Kubernetes**: Manage K8s clusters
   - **Database Access**: PostgreSQL, MySQL, MongoDB
   - **Git Repository**: Work with Git repos
   - **Monitoring**: System metrics and logs
   - **AI/LLM Integration**: Connect to AI models
5. Optionally customize the server name
6. Click "Create" to deploy the server

#### Managing MCP Servers

- **Start/Stop**: Use the play/stop buttons to control server state
- **Delete**: Remove servers when no longer needed (must be stopped first)
- **Status Monitoring**: View real-time server status
- **Port Information**: Each server gets a unique port for connections

#### Using MCP Servers

Once an MCP server is running:
1. Note the assigned port number
2. Configure your AI assistant to connect via SSH tunnel
3. The MCP server will be accessible at `localhost:[port]` through the tunnel

#### Security Considerations

- All MCP connections are tunneled through SSH
- Each server runs in an isolated Docker container
- Filesystem access can be restricted to specific directories
- Shell commands can be whitelisted or blacklisted
- No direct port exposure to the internet

## Features

### Auto-refresh

Enable auto-refresh to automatically update the displayed information:
1. Click the refresh icon in the top-right
2. Select your preferred refresh interval

### Container Logs

To view container logs:
1. Go to the Containers tab
2. Click on a container name
3. View real-time logs with filtering options

### Environment Switching

Quickly switch between environments:
1. Use the environment selector in the header
2. Click "Disconnect" to disconnect from current environment

## Troubleshooting

### Connection Issues

If you cannot connect to a remote environment:
1. Verify SSH connectivity: `ssh user@host`
2. Check that Docker is running on the remote host
3. Ensure your SSH key has proper permissions (600)

### Permission Errors

If you see permission errors:
1. Ensure your user is in the docker group on the remote host
2. Try connecting with `sudo` if needed

## Keyboard Shortcuts

- `Ctrl/Cmd + R` - Refresh current view
- `Ctrl/Cmd + K` - Quick search
- `Esc` - Close dialogs