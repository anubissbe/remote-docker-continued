#!/bin/bash
# Build MCP server Docker images

set -e

echo "Building MCP server images..."

# Build filesystem server
echo "Building filesystem MCP server..."
docker build -t telkombe/mcp-filesystem:latest ./filesystem/

# Build docker server
echo "Building docker MCP server..."
docker build -t telkombe/mcp-docker:latest ./docker/

# Build shell server
echo "Building shell MCP server..."
docker build -t telkombe/mcp-shell:latest ./shell/

echo "MCP server images built successfully!"

# Push to Docker Hub
echo "Pushing images to Docker Hub..."
docker push telkombe/mcp-filesystem:latest
docker push telkombe/mcp-docker:latest
docker push telkombe/mcp-shell:latest

echo "MCP server images pushed successfully!"