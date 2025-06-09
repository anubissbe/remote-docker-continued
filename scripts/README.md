# Scripts

This directory contains utility scripts for building, deploying, and maintaining the Remote Docker Extension.

## Available Scripts

### build.sh
Builds the Docker extension image locally.

**Usage:**
```bash
./scripts/build.sh
```

**Environment Variables:**
- `IMAGE` - Docker image name (default: egekocabas/remote-docker)
- `TAG` - Image tag (default: 0.1.0)

### deploy.sh
Builds and pushes the extension to Docker Hub with multi-architecture support.

**Usage:**
```bash
./scripts/deploy.sh
```

**Environment Variables:**
- `IMAGE` - Docker image name (default: egekocabas/remote-docker)
- `TAG` - Image tag (default: 0.1.0)

### dev-setup.sh
Sets up the development environment by installing all dependencies.

**Usage:**
```bash
./scripts/dev-setup.sh
```

**Requirements:**
- Docker
- Node.js and npm
- Go

### clean.sh
Cleans build artifacts and temporary files.

**Usage:**
```bash
# Basic clean
./scripts/clean.sh

# Deep clean (also removes node_modules)
./scripts/clean.sh --deep
```

## Notes

- All scripts use bash and include error handling with `set -e`
- Scripts provide colored output for better readability
- Environment variables can be used to customize behavior
- Scripts are designed to be run from the project root directory