# Scripts

This directory contains utility scripts for building, deploying, and maintaining the Remote Docker Extension.

## Available Scripts

### Repository Management

#### repo-setup.sh
Interactive script for managing GitHub repository settings, workflows, and security.

**Usage:**
```bash
# Interactive mode
./scripts/repo-setup.sh

# Command line mode
./scripts/repo-setup.sh setup    # Setup labels and repository settings
./scripts/repo-setup.sh check    # Check workflows and security
./scripts/repo-setup.sh dependabot # Manage Dependabot PRs
./scripts/repo-setup.sh build    # Run build and tests
```

**Features:**
- Configure repository labels and settings
- Check workflow status and security
- Manage Dependabot pull requests
- Run comprehensive build and test suite

#### merge-dependabot.sh
Handle Dependabot pull requests with options to review, merge, or close.

**Usage:**
```bash
./scripts/merge-dependabot.sh
```

**Features:**
- Review each PR individually
- Auto-merge passing PRs
- Bulk close PRs if manual management preferred
- Check PR status before merging

### Build and Deploy

#### build.sh
Builds the Docker extension image locally.

**Usage:**
```bash
./scripts/build.sh
```

**Environment Variables:**
- `IMAGE` - Docker image name (default: anubissbe/remote-docker)
- `TAG` - Image tag (default: latest)

#### deploy.sh
Builds and pushes the extension to Docker Hub with multi-architecture support.

**Usage:**
```bash
./scripts/deploy.sh
```

**Environment Variables:**
- `IMAGE` - Docker image name (default: anubissbe/remote-docker)
- `TAG` - Image tag (default: latest)

### Development

#### dev-setup.sh
Sets up the development environment by installing all dependencies.

**Usage:**
```bash
./scripts/dev-setup.sh
```

**Requirements:**
- Docker
- Node.js and npm
- Go

#### clean.sh
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