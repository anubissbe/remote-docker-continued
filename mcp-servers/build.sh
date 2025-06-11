#!/bin/bash
# Build MCP server Docker images

set -e

# Parse command line arguments
PUSH_TO_HUB=true
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-push)
      PUSH_TO_HUB=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--no-push]"
      exit 1
      ;;
  esac
done

echo "Building MCP server images..."

# Build filesystem server
echo "Building filesystem MCP server..."
docker build -t anubissbe/mcp-filesystem:latest ./filesystem/

# Build docker server
echo "Building docker MCP server..."
docker build -t anubissbe/mcp-docker:latest ./docker/

# Build shell server
echo "Building shell MCP server..."
docker build -t anubissbe/mcp-shell:latest ./shell/

echo "MCP server images built successfully!"

# Push to Docker Hub only if not disabled
if [ "$PUSH_TO_HUB" = true ]; then
  echo "Pushing images to Docker Hub..."
  docker push anubissbe/mcp-filesystem:latest
  docker push anubissbe/mcp-docker:latest
  docker push anubissbe/mcp-shell:latest
  echo "MCP server images pushed successfully!"
else
  echo "Skipping push to Docker Hub (--no-push flag specified)"
fi