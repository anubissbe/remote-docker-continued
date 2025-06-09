#!/bin/bash
# Development setup script for remote-docker extension

set -e

# Colors for output
INFO_COLOR='\033[0;36m'
SUCCESS_COLOR='\033[0;32m'
ERROR_COLOR='\033[0;31m'
NO_COLOR='\033[m'

echo -e "${INFO_COLOR}Setting up remote-docker development environment...${NO_COLOR}"

# Check prerequisites
echo -e "${INFO_COLOR}Checking prerequisites...${NO_COLOR}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${ERROR_COLOR}Docker is not installed!${NO_COLOR}"
    exit 1
fi

# Check Node.js
if ! command -v npm &> /dev/null; then
    echo -e "${ERROR_COLOR}npm is not installed!${NO_COLOR}"
    exit 1
fi

# Check Go
if ! command -v go &> /dev/null; then
    echo -e "${ERROR_COLOR}Go is not installed!${NO_COLOR}"
    exit 1
fi

echo -e "${SUCCESS_COLOR}All prerequisites are installed!${NO_COLOR}"

# Install UI dependencies
echo -e "${INFO_COLOR}Installing UI dependencies...${NO_COLOR}"
cd ui
npm install
cd ..

# Install backend dependencies
echo -e "${INFO_COLOR}Installing backend dependencies...${NO_COLOR}"
cd backend
go mod download
cd ..

echo -e "${SUCCESS_COLOR}Development environment setup complete!${NO_COLOR}"
echo -e "${INFO_COLOR}You can now run:${NO_COLOR}"
echo "  make run-client     - to start the UI development server"
echo "  make build-extension - to build the Docker extension"