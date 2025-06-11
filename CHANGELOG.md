# Changelog

All notable changes to the Remote Docker Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.15] - 2025-06-10

### Added
- MCP Catalog Browser with tab-based UI
  - Browse available MCP servers from Docker Hub catalog
  - Search servers by name and description
  - Filter by categories (storage, docker, shell, kubernetes, etc.)
  - One-click installation with auto-start capability
  - Real-time metrics showing download counts and ratings
  - Pagination support for large catalogs
  - Smart auto-configuration based on server type

### Changed
- Updated MCPServers component to use tabbed interface
- Added "Installed Servers" and "Browse Catalog" tabs
- Enhanced README with MCP catalog features

### Fixed
- Added missing `volumes` field to MCPConfig for proper volume mounting

## [1.0.14] - 2025-06-10

### Fixed
- Updated MCP server configurations to match Docker Hub catalog structure
- Changed to correct mcp/ namespace for all predefined servers
- Added catalog browsing reference link

## [1.0.13] - 2025-06-10

### Fixed
- Increased SSH idle timeout from 10 to 60 minutes
- Improved SSH connection stability to prevent disconnections
- Added tunnel status checking before attempting reconnection
- Enhanced settings persistence logging

## [1.0.12] - 2025-06-10

### Fixed
- Fixed settings persistence issue across extension reinstalls
- Resolved SSH disconnection when switching Docker Desktop tabs
- Improved MCP server loading with better error handling
- Added comprehensive debugging for MCP server initialization

## [1.0.11] - 2025-06-10

### Added
- MCP (Model Context Protocol) Toolkit Integration
  - New MCP Servers tab in the UI for managing MCP servers on remote hosts
  - Pre-configured MCP server templates (Filesystem, Docker, Shell)
  - Backend API endpoints for MCP server lifecycle management
  - SSH adapter for executing MCP operations on remote hosts
  - Comprehensive type definitions for MCP entities
  - Real-time server status monitoring
  - Secure SSH tunneling for MCP connections
  - Container-based isolation for each MCP server

### Fixed
- Resolved Jest security vulnerability by updating to v30.0.0
- Updated Node.js to 22.13 and Go to 1.24.0
- Improved TypeScript type definitions

## [1.0.10] - 2025-06-09

### Added
- Comprehensive GitHub workflows for CI/CD
- Security scanning with Trivy, gosec, and npm audit
- Automated testing pipeline for frontend and backend
- Release automation with changelog generation
- Repository management scripts
- Community standards files (CODE_OF_CONDUCT, CODEOWNERS)
- Issue and PR templates
- Security policy and vulnerability reporting guidelines

### Fixed
- All npm security vulnerabilities (Vite, Babel dependencies)
- Docker Desktop API response wrapper handling
- SSH key permission management for Windows

### Changed
- Updated project structure with proper documentation organization
- Enhanced build scripts and deployment automation
- Improved repository configuration and settings

## [1.0.9] - 2025-06-09

### Fixed
- Dashboard and container pages blank screen issue
- Docker Desktop API response handling for all components
- Container, Image, Network, and Volume management API calls
- ContainerLogs component response processing

### Changed
- Updated all frontend components to handle wrapped API responses
- Improved error handling and logging

## [1.0.8] - 2025-06-09

### Fixed
- SSH tunnel connection issues
- Settings persistence and environment management
- Container logs display and real-time updates

### Added
- Enhanced error messages and debugging information
- Better SSH connection handling

## [1.0.1] - [1.0.7] - 2025-06-09

### Development Iterations
- Multiple fixes for SSH authentication
- Improvements to Docker Desktop integration
- UI enhancements and bug fixes
- Build system optimizations

## [0.1.0] - Initial Release

### Added
- Initial Docker Desktop extension structure
- Basic SSH tunneling functionality
- Container management interface
- Dashboard with system metrics
- Docker Compose project support

### Features
- Remote Docker host management via SSH
- Real-time container monitoring
- Image, volume, and network management
- Container logs with syntax highlighting
- Multi-environment support

---

## Security Updates

### [1.0.10] - Security Fixes
- ✅ Fixed CVE-2025-46565 (Vite server.fs.deny bypass)
- ✅ Fixed CVE-2025-32395 (Vite server.fs.deny bypass) 
- ✅ Fixed CVE-2025-31486 (Vite server.fs.deny bypass)
- ✅ Fixed CVE-2025-31125 (Vite server.fs.deny bypass)
- ✅ Fixed CVE-2025-30208 (Vite server.fs.deny bypass)
- ✅ Fixed CVE-2025-27789 (Babel RegExp complexity)

### Pending Security Updates
- 🔄 CVE-2025-22869 (SSH Denial of Service) - Dependabot PR #3
- 🔄 GitHub Actions security improvements - Dependabot PR #6
- 🔄 Network security enhancements - Dependabot PR #5

## Links

- [Repository](https://github.com/anubissbe/remote-docker)
- [Docker Hub](https://hub.docker.com/r/anubissbe/remote-docker)
- [Issues](https://github.com/anubissbe/remote-docker/issues)
- [Security Policy](https://github.com/anubissbe/remote-docker/blob/main/.github/SECURITY.md)