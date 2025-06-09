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