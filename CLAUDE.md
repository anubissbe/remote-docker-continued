# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remote Docker is a Docker Desktop extension that enables management of remote Docker environments through SSH tunnels. It provides a unified interface for both local and remote Docker operations with MCP (Model Context Protocol) server integration.

## Key Architecture Components

### Backend (Go)
- **SSH Tunnel Manager**: Maintains persistent SSH connections using control master mode for multiplexing
- **MCP Manager**: Handles lifecycle of MCP servers with factory/strategy patterns
- **Docker API Proxy**: Routes Docker commands through SSH tunnels to remote hosts
- **Persistence Layer**: JSON-based storage in `/root/docker-extension/`

### Frontend (React/TypeScript)
- **Material-UI Components**: UI components in `ui/src/components/`
- **Docker Desktop SDK Integration**: Via `ddClient` utility
- **Real-time Updates**: Configurable auto-refresh for monitoring

### Critical Architectural Patterns
1. **SSH Control Sockets**: Located in `/tmp/docker-remote-ssh/`, managed by SSHTunnelManager
2. **MCP Server States**: `creating` → `running` → `stopped` → `error`
3. **Container Grouping**: Automatic Docker Compose project detection and grouping
4. **Async Deployment**: Background goroutines with panic recovery for MCP servers

## Development Commands

### Quick Start
```bash
./scripts/dev-setup.sh  # Install all dependencies
make dev               # Build and install for development
```

### Building
```bash
make build            # Build Docker extension image
make install          # Install in Docker Desktop
make uninstall        # Remove from Docker Desktop
make push             # Push to Docker Hub (requires access)
```

### Testing & Linting
```bash
make test             # Run all tests
make lint             # Run Go and TypeScript linters

# Individual testing:
cd backend && go test ./...
cd ui && npm test
```

### Frontend Development
```bash
cd ui
npm run dev           # Start dev server on port 3000 with hot reload
npm run build         # Production build
npm run lint          # Run ESLint
```

### Backend Development
```bash
cd backend
go build -o ../server # Build backend binary
go test ./...         # Run tests
go fmt ./...          # Format code
```

## API Endpoints Structure

- `/tunnel/*` - SSH connection lifecycle management
- `/mcp/*` - MCP server CRUD operations and catalog
- `/container/*`, `/images/*`, `/volumes/*`, `/networks/*` - Docker resource management
- `/dashboard/*` - Aggregated metrics and monitoring data
- `/settings` - Persistent configuration

## MCP Server Integration

### Adding New MCP Server Types
1. Add server definition to `backend/mcp/catalog.go` in `getHardcodedCatalog()`
2. Add configuration case in `GetPredefinedConfig()` function
3. Define type-specific config structures if needed in `backend/mcp/types.go`

### MCP Server Docker Images
- Official MCP images: `mcp/filesystem`, `mcp/docker`, `mcp/fetch`, `mcp/everything`
- Custom images: `anubissbe/mcp-filesystem`, `anubissbe/mcp-docker`, `anubissbe/mcp-shell`
- Build custom images: `cd mcp-servers && ./build.sh`

## Key Files to Understand

1. **backend/main.go**: API routing and endpoint definitions
2. **backend/mcp/manager.go**: MCP server lifecycle management
3. **backend/mcp/ssh_adapter.go**: SSH tunneling for MCP connections
4. **ui/src/components/MCP/MCPServers.tsx**: MCP UI implementation
5. **ui/src/utils/ddClient.ts**: Docker Desktop SDK wrapper

## Important Technical Details

### SSH Configuration
- Uses mounted `~/.ssh` from host (read-only)
- Control master sockets in `/tmp/docker-remote-ssh/`
- Auto cleanup after 120 minutes idle
- Host key checking: `accept-new`

### Data Persistence
- Settings: `/root/docker-extension/settings.json`
- MCP servers: `/root/docker-extension/mcp-servers.json`
- Docker volume: `remote-docker-settings`

### Error Handling
- Commands return both stdout and stderr
- Graceful degradation for dashboard metrics
- Structured logging with logrus
- User-friendly error messages in UI

## Common Development Tasks

### Debugging MCP Installation Failures
1. Check Docker logs: `docker logs <container-id>`
2. Verify image exists: `docker images | grep mcp`
3. Check catalog configuration in `backend/mcp/catalog.go`
4. Ensure correct environment variables in `GetPredefinedConfig()`

### Adding New Docker Commands
1. Add endpoint in `backend/main.go`
2. Implement command execution using `runSSHCommand()`
3. Parse output and return structured response
4. Add corresponding UI component in `ui/src/pages/`

### Updating Extension Version
1. Update version in `metadata.json`
2. Update CHANGELOG.md
3. Run `make build && make push`
4. Create GitHub release with tag

## Testing Locally

1. **Backend Only**: `cd backend && go run main.go`
2. **Frontend Only**: `cd ui && npm run dev`
3. **Full Extension**: `make dev` (installs in Docker Desktop)
4. **MCP Servers**: Test with `docker run -it <image> <command>`

## Security Considerations

- No passwords - SSH key authentication only
- Keys never stored in images or containers
- All communication through encrypted SSH tunnels
- Container isolation for MCP servers
- Minimal container privileges