# Architecture Overview

## Project Structure

```
remote-docker/
├── backend/                 # Go backend service
│   ├── mcp/                # MCP server management
│   │   ├── catalog.go      # MCP catalog service
│   │   ├── connection.go   # Connection management
│   │   ├── dockerhub.go    # Docker Hub integration
│   │   ├── manager.go      # MCP lifecycle management
│   │   ├── predefined.go   # Predefined server configs
│   │   ├── ssh_adapter.go  # SSH tunnel adapter
│   │   └── types.go        # Type definitions
│   ├── go.mod              # Go module definition
│   ├── go.sum              # Go dependencies
│   └── main.go             # Main application entry
│
├── ui/                     # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── MCP/       # MCP-related components
│   │   │   └── ...        # Other components
│   │   ├── pages/         # Page components
│   │   │   ├── docker/    # Docker management pages
│   │   │   └── settings/  # Settings pages
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Node dependencies
│   ├── tsconfig.json      # TypeScript config
│   └── vite.config.ts     # Vite build config
│
├── mcp-servers/           # MCP server Docker images
│   ├── docker/           # Docker MCP server
│   ├── filesystem/       # Filesystem MCP server
│   ├── shell/           # Shell MCP server
│   └── build.sh         # Build script
│
├── scripts/              # Utility scripts
│   ├── build.sh         # Build extension
│   ├── clean.sh         # Clean artifacts
│   ├── deploy.sh        # Deploy to Docker Hub
│   ├── dev-setup.sh     # Development setup
│   └── ...              # Other scripts
│
├── tests/               # Test files
│   ├── integration/     # Integration tests
│   ├── e2e/            # End-to-end tests
│   └── unit/           # Unit tests
│
├── docs/               # Documentation
│   ├── api/           # API documentation
│   ├── debugging/     # Debugging guides
│   ├── setup/         # Setup instructions
│   └── ...            # Other docs
│
├── .github/           # GitHub configuration
│   ├── workflows/     # CI/CD workflows
│   └── ...           # Other GitHub files
│
├── assets/           # Static assets
├── Dockerfile        # Extension container
├── Makefile         # Build automation
├── metadata.json    # Extension metadata
└── README.md        # Main documentation
```

## Component Architecture

### Backend (Go)

The backend is built with Go and uses the Echo framework for HTTP routing. Key components:

1. **HTTP Server** (`main.go`)
   - RESTful API endpoints
   - WebSocket support for real-time updates
   - Middleware for logging and error handling

2. **MCP Manager** (`mcp/`)
   - Server lifecycle management
   - SSH tunnel orchestration
   - Docker Hub catalog integration
   - Persistent state management

3. **SSH Tunnel Manager**
   - Persistent SSH connections
   - Control master multiplexing
   - Automatic cleanup and reconnection

### Frontend (React/TypeScript)

The frontend is a modern React application with TypeScript:

1. **UI Components**
   - Material-UI based design system
   - Responsive layouts
   - Real-time data updates

2. **State Management**
   - React hooks for local state
   - Context API for global state
   - Docker Desktop SDK integration

3. **Build System**
   - Vite for fast development
   - TypeScript for type safety
   - ESLint for code quality

### MCP Servers

Model Context Protocol servers provide AI capabilities:

1. **Filesystem Server** - File access and management
2. **Docker Server** - Container orchestration
3. **Shell Server** - Command execution
4. **Custom Servers** - User-defined capabilities

## Data Flow

```
User → UI → Docker Desktop SDK → Backend API → SSH Tunnel → Remote Docker
                                      ↓
                                 MCP Servers
```

## Security Architecture

1. **Authentication**
   - SSH key-based only
   - No password storage
   - Key forwarding from host

2. **Network Security**
   - All traffic through SSH tunnels
   - No direct remote connections
   - Host key verification

3. **Container Isolation**
   - Minimal privileges
   - Resource limits
   - Network isolation

## Deployment Architecture

1. **Docker Desktop Extension**
   - Single container deployment
   - Volume mounts for persistence
   - Unix socket communication

2. **Remote Environments**
   - SSH multiplexing
   - Connection pooling
   - Automatic reconnection

3. **MCP Integration**
   - Containerized servers
   - Port forwarding
   - Health monitoring