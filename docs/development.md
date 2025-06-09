# Development Guide

This guide covers setting up a development environment for the Remote Docker Extension.

## Prerequisites

- Docker Desktop
- Node.js and npm
- Go programming language
- Make

## Quick Start

1. Clone the repository
2. Run the development setup script:
   ```bash
   ./scripts/dev-setup.sh
   ```

3. Start the UI development server:
   ```bash
   make run-client
   ```

4. Build the extension:
   ```bash
   make build-extension
   ```

## Project Structure

```
remote-docker/
├── assets/          # Extension icons and screenshots
├── backend/         # Go backend code
├── docs/            # Documentation
├── scripts/         # Build and deployment scripts
├── ui/              # React frontend code
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── main.tsx     # Entry point
│   └── build/       # Build output
├── Dockerfile       # Extension container definition
├── Makefile         # Build targets
└── metadata.json    # Extension metadata
```

## Development Workflow

### UI Development

The UI is built with React and Vite. To start development:

```bash
make run-client
```

This starts a development server at http://localhost:3000 with hot module replacement.

### Backend Development

The backend is written in Go. To build the backend:

```bash
cd backend
go build -o ../server main.go
```

#### MCP Integration

The MCP (Model Context Protocol) integration adds several new components:

- `backend/mcp/` - MCP server management logic
  - `types.go` - Type definitions for MCP entities
  - `manager.go` - MCP server lifecycle management
  - `predefined.go` - Pre-configured server templates
  - `ssh_adapter.go` - SSH integration for remote execution

- `ui/src/components/MCP/` - Frontend MCP components
  - `MCPServers.tsx` - Main MCP management interface
  - `types.ts` - TypeScript type definitions

When developing MCP features:
1. Update server templates in `predefined.go` for new MCP server types
2. Modify the manager for new lifecycle operations
3. Update the UI components for new functionality

### Testing the Extension

1. Build the extension:
   ```bash
   make build-extension
   ```

2. Install the extension:
   ```bash
   make install-extension
   ```

3. Debug the UI:
   ```bash
   make debug-ui
   ```

## Available Scripts

- `build.sh` - Build the Docker extension
- `deploy.sh` - Deploy to Docker Hub
- `dev-setup.sh` - Set up development environment
- `clean.sh` - Clean build artifacts

## Make Targets

Run `make help` to see all available targets:

- `build-extension` - Build the extension
- `install-extension` - Install the extension locally
- `update-extension` - Update an installed extension
- `run-client` - Start UI development server
- `push-extension` - Push to Docker Hub
- `validate-extension` - Validate extension metadata