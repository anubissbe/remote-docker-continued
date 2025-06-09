# User Guide

Welcome to the Remote Docker Extension! This guide will help you get started with managing remote Docker environments.

## Installation

Install the extension from Docker Desktop or using the command line:

```bash
docker extension install egekocabas/remote-docker:latest
```

## Getting Started

### Adding a Remote Environment

1. Open the Remote Docker extension in Docker Desktop
2. Navigate to the "Environments" tab
3. Click "Add Environment"
4. Enter the following details:
   - **Name**: A friendly name for your environment
   - **Host**: SSH connection string (e.g., `ssh://user@hostname`)
   - **SSH Key**: Path to your SSH private key

### Connecting to an Environment

1. Go to the "Environments" tab
2. Click on the environment you want to connect to
3. The extension will establish an SSH tunnel to the remote Docker daemon

### Managing Containers

Once connected, you can:
- View all containers on the remote host
- Start/Stop/Restart containers
- View container logs
- Remove containers

### Managing Images

The Images tab allows you to:
- View all images on the remote host
- Pull new images
- Remove unused images
- View image details

### Managing Volumes

In the Volumes tab, you can:
- List all volumes
- Create new volumes
- Remove unused volumes
- View volume details

### Managing Networks

The Networks tab provides:
- List of all networks
- Network details and configuration
- Create/remove networks

## Features

### Auto-refresh

Enable auto-refresh to automatically update the displayed information:
1. Click the refresh icon in the top-right
2. Select your preferred refresh interval

### Container Logs

To view container logs:
1. Go to the Containers tab
2. Click on a container name
3. View real-time logs with filtering options

### Environment Switching

Quickly switch between environments:
1. Use the environment selector in the header
2. Click "Disconnect" to disconnect from current environment

## Troubleshooting

### Connection Issues

If you cannot connect to a remote environment:
1. Verify SSH connectivity: `ssh user@host`
2. Check that Docker is running on the remote host
3. Ensure your SSH key has proper permissions (600)

### Permission Errors

If you see permission errors:
1. Ensure your user is in the docker group on the remote host
2. Try connecting with `sudo` if needed

## Keyboard Shortcuts

- `Ctrl/Cmd + R` - Refresh current view
- `Ctrl/Cmd + K` - Quick search
- `Esc` - Close dialogs