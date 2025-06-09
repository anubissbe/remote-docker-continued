# Remote Docker Desktop Extension

<p align="center">
  <img src="assets/extension-icon.svg" width="128" height="128" alt="Remote Docker Icon">
</p>

<p align="center">
  <strong>Manage remote Docker environments directly from Docker Desktop</strong>
</p>

<p align="center">
  <a href="https://hub.docker.com/r/telkombe/remote-docker">
    <img src="https://img.shields.io/docker/v/telkombe/remote-docker?sort=semver&label=Docker%20Hub" alt="Docker Hub">
  </a>
  <a href="https://github.com/telkombe/remote-docker/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/telkombe/remote-docker" alt="License">
  </a>
  <a href="https://github.com/telkombe/remote-docker/releases">
    <img src="https://img.shields.io/github/v/release/telkombe/remote-docker" alt="Release">
  </a>
</p>

## Overview

Remote Docker is a Docker Desktop extension that enables you to connect to and manage remote Docker hosts through SSH tunnels. It provides a seamless experience for managing containers, images, volumes, and networks on remote Docker installations directly from your Docker Desktop interface.

### Key Features

- 🔐 **Secure SSH Connections** - Connect to remote Docker hosts using SSH key authentication
- 🖥️ **Multi-Environment Support** - Manage multiple remote Docker environments
- 📊 **Real-time Dashboard** - Monitor system resources, container statistics, and Docker events
- 🐳 **Full Docker Management** - Manage containers, images, volumes, and networks
- 📋 **Container Logs** - View real-time logs with syntax highlighting and filtering
- 🔄 **Auto-refresh** - Keep data up-to-date with configurable auto-refresh intervals
- 🎨 **Dark Mode Support** - Seamless integration with Docker Desktop's theme

## Installation

### From Docker Hub

```bash
docker extension install telkombe/remote-docker:latest
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/telkombe/remote-docker.git
cd remote-docker

# Build and install locally
make build
docker extension install telkombe/remote-docker:latest
```

## Quick Start

1. **Install the extension** from Docker Hub
2. **Open the extension** in Docker Desktop
3. **Add a remote environment**:
   - Click "Add Environment"
   - Enter a name for your environment
   - Provide the SSH connection details:
     - Hostname: Your remote Docker host (e.g., `192.168.1.25`)
     - Username: SSH username (e.g., `ubuntu`)
     - Port: SSH port (default: 22)
4. **Connect** to start managing your remote Docker environment

## Requirements

### Local Machine
- Docker Desktop 4.8.0 or later
- SSH key pair for authentication

### Remote Host
- Docker Engine installed and running
- SSH server with key-based authentication enabled
- User with Docker permissions (typically in the `docker` group)

## SSH Key Setup

The extension uses SSH key authentication for secure connections. Your SSH keys are automatically mounted from your local `.ssh` directory.

### Windows
```powershell
# Keys are read from
C:\Users\<username>\.ssh\id_rsa
C:\Users\<username>\.ssh\id_rsa.pub
```

### macOS/Linux
```bash
# Keys are read from
~/.ssh/id_rsa
~/.ssh/id_rsa.pub
```

### Setting up SSH Keys

1. **Generate SSH keys** (if you don't have them):
   ```bash
   ssh-keygen -t rsa -b 4096
   ```

2. **Copy your public key to the remote host**:
   ```bash
   ssh-copy-id username@remote-host
   ```

3. **Test the connection**:
   ```bash
   ssh username@remote-host docker version
   ```

## Features in Detail

### Dashboard
- System information and Docker version
- Resource utilization (CPU, Memory, Disk)
- Container statistics and distribution
- Recent Docker events
- Real-time metrics with auto-refresh

### Container Management
- View all containers with status
- Start/stop containers
- View container logs with syntax highlighting
- Port mapping information
- Docker Compose project grouping

### Image Management
- List all images with size information
- Remove unused images
- View image details and layers

### Network Management
- List Docker networks
- View network configuration
- Delete unused networks

### Volume Management
- List Docker volumes
- View volume details
- Remove unused volumes

## Configuration

### Environment Settings
Each environment can be configured with:
- **Name**: Friendly name for the environment
- **Hostname**: IP address or domain name
- **Port**: SSH port (default: 22)
- **Username**: SSH username

### Auto-refresh Settings
- Enable/disable auto-refresh per view
- Configurable refresh intervals (15s, 30s, 60s, 300s)
- Visual indicators for refresh status

## Security

- **SSH Key Authentication**: Only SSH key authentication is supported (no passwords)
- **Local Key Storage**: SSH keys remain on your local machine
- **Read-only Mounts**: Keys are mounted read-only in the extension container
- **No Keys in Images**: Docker images do not contain any SSH keys
- **Secure Tunneling**: All Docker API communication goes through SSH tunnels

## Architecture

### Components

The extension consists of two main parts:

1. **Backend (Go)**
   - Handles SSH tunnel creation and management
   - Proxies Docker commands to remote hosts
   - Built with Echo framework

2. **Frontend (React/TypeScript)**
   - Provides a UI for remote Docker management
   - Features a responsive dashboard with real-time updates
   - Built with Material UI components and Recharts for data visualization

### How It Works

1. The extension mounts your local `~/.ssh` directory as read-only
2. When you connect to a remote environment, it creates an SSH tunnel
3. Docker commands are proxied through the tunnel to the remote Docker daemon
4. Results are displayed in the familiar Docker Desktop UI

## Troubleshooting

### Common Issues

#### "Permission denied" SSH Error
- Ensure your SSH key has proper permissions (600 on Unix-like systems)
- Verify the remote user is in the `docker` group
- Check SSH key is correctly added to remote host's `authorized_keys`

#### Blank Screen on Extension Load
- Check Docker Desktop console for errors (View → Developer Tools)
- Ensure Docker Desktop is up to date
- Try reinstalling the extension

#### Cannot Connect to Remote Host
- Verify SSH connection works: `ssh username@hostname`
- Check Docker is running on remote: `ssh username@hostname docker ps`
- Ensure no firewall is blocking SSH port

### Debug Mode

Enable debug logging in the extension:
1. Open Docker Desktop Developer Tools
2. Check console for detailed error messages
3. Look for API response errors

## Development

See [docs/development.md](docs/development.md) for development setup and contribution guidelines.

### Project Structure

```
remote-docker/
├── backend/          # Go backend service
├── ui/              # React frontend
├── docs/            # Documentation
├── scripts/         # Build and deployment scripts
├── assets/          # Icons and images
├── Dockerfile       # Extension container definition
├── metadata.json    # Extension metadata
└── docker-compose.yaml
```

## Documentation

- [User Guide](docs/user-guide.md) - Detailed usage instructions
- [API Reference](docs/api-reference.md) - Backend API documentation
- [Development Guide](docs/development.md) - Setup and contribution guide
- [Docker Hub Cleanup](docs/docker-hub-cleanup.md) - Image management guide

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Docker Extension SDK](https://docs.docker.com/desktop/extensions-sdk/)
- UI powered by [React](https://reactjs.org/) and [Material-UI](https://mui.com/)
- Backend powered by [Go](https://golang.org/) and [Echo](https://echo.labstack.com/)
- Extension icon created using Midjourney

## Support

- **Issues**: [GitHub Issues](https://github.com/telkombe/remote-docker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/telkombe/remote-docker/discussions)
- **Docker Hub**: [telkombe/remote-docker](https://hub.docker.com/r/telkombe/remote-docker)

## Disclaimer

> **Warning:** Use this extension at your own risk. Always review and validate the actions performed on your remote Docker environments. This was an experimental project to explore Docker Desktop extension development and LLM-assisted coding.