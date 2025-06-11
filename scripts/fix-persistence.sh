#!/bin/bash

echo "Fixing Docker Extension persistence issues..."

# Remove the extension cleanly
echo "Removing existing extension..."
docker extension rm anubissbe/remote-docker 2>/dev/null || true

# Remove old volumes to start fresh
echo "Removing old volumes..."
docker volume rm remote-docker-settings 2>/dev/null || true

# Wait a moment
sleep 2

# Reinstall the extension
echo "Installing latest extension..."
docker extension install anubissbe/remote-docker:latest

echo "Done! The extension should now properly persist settings."
echo "Please reconfigure your environments in the extension."