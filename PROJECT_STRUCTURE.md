# Project Structure

This document describes the organization of the Remote Docker Extension project.

## Directory Layout

```
remote-docker/
├── .editorconfig        # Editor configuration
├── .gitignore          # Git ignore rules
├── Dockerfile          # Extension container definition
├── LICENSE             # Project license
├── Makefile           # Build automation
├── README.md          # Main project documentation
├── docker-compose.yaml # Docker compose configuration
├── metadata.json      # Extension metadata
│
├── assets/            # Extension icons and screenshots
│   ├── extension-icon.svg
│   └── *.png          # Screenshots
│
├── backend/           # Go backend application
│   ├── go.mod
│   ├── go.sum
│   └── main.go
│
├── docs/              # Documentation
│   ├── README.md
│   ├── DOCKER_HUB_CLEANUP.md
│   ├── api-reference.md
│   ├── development.md
│   └── user-guide.md
│
├── scripts/           # Build and utility scripts
│   ├── README.md
│   ├── build.sh       # Local build script
│   ├── clean.sh       # Clean build artifacts
│   ├── deploy.sh      # Deploy to Docker Hub
│   └── dev-setup.sh   # Development environment setup
│
└── ui/                # React frontend application
    ├── index.html     # Main HTML entry point
    ├── package.json   # NPM dependencies
    ├── tsconfig.json  # TypeScript configuration
    ├── vite.config.ts # Vite build configuration
    ├── src/           # Source code
    │   ├── main.tsx   # Application entry point
    │   ├── App.tsx    # Root component
    │   ├── components/# Reusable components
    │   └── pages/     # Page components
    └── tests/         # Test HTML files for debugging
```

## Build Artifacts

The following directories are generated during build and are ignored by git:

- `ui/build/` - Frontend build output
- `ui/node_modules/` - NPM dependencies
- `server`, `client`, `ssh` - Compiled Go binaries

## Key Files

- **Makefile** - Primary build automation, run `make help` for available targets
- **metadata.json** - Docker Desktop extension metadata
- **docker-compose.yaml** - Local development configuration
- **.editorconfig** - Ensures consistent coding styles across editors

## Development Workflow

1. Run `./scripts/dev-setup.sh` to install dependencies
2. Use `make run-client` for UI development
3. Use `make build-extension` to build the extension
4. Use `make install-extension` to test locally

See [docs/development.md](docs/development.md) for detailed development instructions.