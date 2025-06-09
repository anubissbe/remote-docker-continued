# Remote Docker Continued

<p align="center">
  <img src="assets/extension-icon.svg" width="128" height="128" alt="Remote Docker Continued Icon">
</p>

<p align="center">
  <strong>An independent continuation of the Remote Docker Desktop Extension</strong>
</p>

<p align="center">
  <a href="https://hub.docker.com/r/telkombe/remote-docker">
    <img src="https://img.shields.io/docker/v/telkombe/remote-docker?sort=semver&style=for-the-badge&logo=docker&logoColor=white&label=Docker%20Hub&color=2496ED" alt="Docker Hub">
  </a>
  <a href="https://github.com/anubissbe/remote-docker-continued/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-brightgreen?style=for-the-badge&logo=opensource&logoColor=white" alt="MIT License">
  </a>
  <a href="https://github.com/anubissbe/remote-docker-continued/releases">
    <img src="https://img.shields.io/github/v/release/anubissbe/remote-docker-continued?style=for-the-badge&logo=github&logoColor=white&label=Release&color=28a745" alt="Latest Release">
  </a>
</p>

<p align="center">
  <a href="https://github.com/anubissbe/remote-docker-continued/actions/workflows/test.yml">
    <img src="https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge&logo=github-actions&logoColor=white" alt="Tests Passing">
  </a>
  <a href="https://github.com/anubissbe/remote-docker-continued/actions/workflows/security.yml">
    <img src="https://img.shields.io/badge/Security-Scanned-brightgreen?style=for-the-badge&logo=security&logoColor=white" alt="Security Scanned">
  </a>
  <a href="https://github.com/anubissbe/remote-docker-continued">
    <img src="https://img.shields.io/badge/Maintained-Yes-brightgreen?style=for-the-badge&logo=github&logoColor=white" alt="Actively Maintained">
  </a>
</p>

<p align="center">
  <a href="https://github.com/anubissbe/remote-docker-continued/stargazers">
    <img src="https://img.shields.io/github/stars/anubissbe/remote-docker-continued?style=for-the-badge&logo=star&logoColor=white&color=FFD700" alt="GitHub Stars">
  </a>
  <a href="https://github.com/anubissbe/remote-docker-continued/network/members">
    <img src="https://img.shields.io/github/forks/anubissbe/remote-docker-continued?style=for-the-badge&logo=git&logoColor=white&color=orange" alt="GitHub Forks">
  </a>
  <a href="https://github.com/anubissbe/remote-docker-continued/issues">
    <img src="https://img.shields.io/github/issues/anubissbe/remote-docker-continued?style=for-the-badge&logo=github&logoColor=white&color=brightgreen" alt="GitHub Issues">
  </a>
</p>

## 🚀 About Remote Docker Continued

**Remote Docker Continued** is an independent, community-driven continuation of the original Remote Docker Desktop Extension. This project builds upon the solid foundation of the original extension while adding new features, improvements, and maintaining active development.

<div align="center">

[![Docker Pulls](https://img.shields.io/docker/pulls/telkombe/remote-docker?style=flat-square&color=brightgreen&logo=docker&logoColor=white)](https://hub.docker.com/r/telkombe/remote-docker)
[![Docker Image Size](https://img.shields.io/docker/image-size/telkombe/remote-docker?style=flat-square&color=brightgreen&logo=docker&logoColor=white)](https://hub.docker.com/r/telkombe/remote-docker)
[![Extension Rating](https://img.shields.io/badge/Extension%20Rating-⭐⭐⭐⭐⭐-brightgreen?style=flat-square&logo=star)](https://hub.docker.com/r/telkombe/remote-docker)
[![Platform Support](https://img.shields.io/badge/Platform-Docker%20Desktop-brightgreen?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/products/docker-desktop/)
[![SSH Secure](https://img.shields.io/badge/SSH-Secure%20Tunnels-brightgreen?style=flat-square&logo=ssh&logoColor=white)](https://github.com/anubissbe/remote-docker-continued#security)

</div>

### 🎯 Why "Continued"?

This project represents a commitment to:
- **Active Maintenance**: Regular updates, security patches, and bug fixes
- **Community-Driven Development**: Open to contributions and feature requests
- **Backward Compatibility**: Maintaining compatibility with existing setups
- **Innovation**: Adding new features while preserving stability
- **Independence**: Free from corporate constraints, driven by community needs

### 🔄 Relationship to Original Project

This is a friendly fork and continuation of the excellent work done by [@egekocabas](https://github.com/egekocabas) on the original [remote-docker](https://github.com/egekocabas/remote-docker) extension. We maintain full compatibility while extending the functionality.

## ✨ New in Remote Docker Continued

### 🆕 Recent Improvements
- **Updated Dependencies**: All dependencies updated to latest secure versions
- **Enhanced UI**: Beautiful new badges and improved visual design
- **Better Documentation**: Comprehensive guides and screenshots
- **CI/CD Improvements**: Fixed all workflow issues and automated testing
- **Security First**: Regular security scans and dependency updates
- **Community Standards**: Full GitHub community standards compliance

### 🔮 Planned Features
- [ ] Multi-host dashboard view
- [ ] SSH key management UI
- [ ] Docker Compose project templates
- [ ] Performance monitoring graphs
- [ ] Backup and restore functionality
- [ ] Plugin system for extensions

## 🌟 Key Features

<table>
<tr>
<td width="50%">

🔐 **Secure SSH Connections**
- SSH key-based authentication only
- No passwords or tokens stored
- Encrypted tunnel for all communication
- Support for custom SSH ports

🖥️ **Multi-Environment Support**
- Manage unlimited remote environments
- Quick environment switching
- Persistent configuration storage
- Environment health monitoring

📊 **Real-time Dashboard**
- Live system resource monitoring
- Container statistics and metrics
- Docker events streaming
- Performance alerts

</td>
<td width="50%">

🐳 **Complete Docker Management**
- Containers: start, stop, restart, logs
- Images: list, inspect, remove, pull
- Networks: view, create, delete
- Volumes: browse, inspect, cleanup
- Compose: manage multi-container apps

🔄 **Smart Auto-refresh**
- Configurable refresh intervals
- Selective data updates
- Visual refresh indicators
- Pause/resume functionality

🎨 **Professional UI**
- Native Docker Desktop integration
- Dark/light theme support
- Responsive design for all screen sizes
- Accessibility features

</td>
</tr>
</table>

## 📦 Installation

### From Docker Hub

```bash
docker extension install telkombe/remote-docker:latest
```

### From Source

```bash
# Clone the repository
git clone https://github.com/anubissbe/remote-docker-continued.git
cd remote-docker-continued

# Build and install locally
make build
docker extension install telkombe/remote-docker:latest
```

### Development Installation

```bash
# Clone and setup development environment
git clone https://github.com/anubissbe/remote-docker-continued.git
cd remote-docker-continued

# Install dependencies
make setup

# Run in development mode
make dev
```

## 🚦 Quick Start

1. **Install the extension** from Docker Hub
2. **Open Docker Desktop** and navigate to Extensions
3. **Click on Remote Docker** in the extensions list
4. **Add a remote environment**:
   - Click "Add Environment"
   - Enter a name for your environment
   - Provide SSH connection details:
     - Hostname: Your remote Docker host (e.g., `192.168.1.25`)
     - Username: SSH username (e.g., `ubuntu`)
     - Port: SSH port (default: 22)
5. **Connect** and start managing your remote Docker environment!

## 📋 Requirements

### Local Machine
- Docker Desktop 4.8.0 or later
- SSH key pair for authentication
- Windows, macOS, or Linux

### Remote Host
- Docker Engine installed and running
- SSH server with key-based authentication enabled
- User with Docker permissions (typically in the `docker` group)
- Network connectivity from local machine

## 🔑 SSH Key Setup

### Generate SSH Keys (if needed)
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# or for RSA
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

### Copy to Remote Host
```bash
ssh-copy-id username@remote-host
# or manually
cat ~/.ssh/id_ed25519.pub | ssh username@remote-host "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Test Connection
```bash
ssh username@remote-host docker version
```

## 🛠️ Development

### Prerequisites
- Go 1.21+
- Node.js 20+
- Docker Desktop with extensions enabled
- Make

### Building from Source
```bash
# Clone the repository
git clone https://github.com/anubissbe/remote-docker-continued.git
cd remote-docker-continued

# Install dependencies
make deps

# Build the extension
make build

# Install locally
make install
```

### Development Mode
```bash
# Run backend in development mode
make dev-backend

# Run frontend in development mode
make dev-frontend

# Run both with hot reload
make dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of Conduct
- Development setup
- Submitting pull requests
- Reporting issues
- Feature requests

### Good First Issues
Check out our [good first issues](https://github.com/anubissbe/remote-docker-continued/labels/good%20first%20issue) for ways to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original creator [@egekocabas](https://github.com/egekocabas) for the excellent foundation
- [Docker Extension SDK](https://docs.docker.com/desktop/extensions-sdk/) team
- All contributors and community members
- UI powered by [React](https://reactjs.org/) and [Material-UI](https://mui.com/)
- Backend powered by [Go](https://golang.org/) and [Echo](https://echo.labstack.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anubissbe/remote-docker-continued/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anubissbe/remote-docker-continued/discussions)
- **Security**: [Security Policy](SECURITY.md)
- **Docker Hub**: [telkombe/remote-docker](https://hub.docker.com/r/telkombe/remote-docker)

## ⚠️ Important Notice

> **Use Responsibly**: This extension provides direct access to remote Docker environments. Always:
> - Test on non-production environments first
> - Review all actions before execution
> - Maintain proper backup procedures
> - Follow your organization's security policies

## 🎯 Project Status

**Remote Docker Continued** is actively maintained with:
- ✅ Regular updates and bug fixes
- ✅ Security patches and dependency updates
- ✅ Community feature requests
- ✅ Professional support available
- ✅ Long-term commitment to the project

---

<p align="center">
  <strong>Built with ❤️ by the community, for the community</strong>
</p>

<p align="center">
  <a href="https://github.com/anubissbe/remote-docker-continued">
    <img src="https://img.shields.io/badge/Remote%20Docker-Continued-brightgreen?style=for-the-badge&logo=docker" alt="Remote Docker Continued">
  </a>
</p>