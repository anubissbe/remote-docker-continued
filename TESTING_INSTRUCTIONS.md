# Testing SSH Connection Stability Fixes

## Installation Steps

1. **Wait for the build to complete** (usually 5-10 minutes after push)
   - Check build status at: https://github.com/anubissbe/remote-docker/actions
   - Wait for the green checkmark on the latest commit

2. **Remove the current extension** (if installed):
   ```bash
   docker extension rm telkombe/remote-docker
   ```

3. **Install the new version**:
   ```bash
   docker extension install telkombe/remote-docker:v1.0.20
   ```

   Or if you want the latest version:
   ```bash
   docker extension install telkombe/remote-docker:latest
   ```

## What to Test

### 1. Initial Setup
- Open Docker Desktop
- Go to Remote Docker extension
- Set up an environment (if not already done)
- Connect to the environment

### 2. Navigation Test (Main Fix)
With the SSH connection active, navigate between these pages:
- Dashboard
- Containers  
- Images
- Volumes
- Networks
- MCP Servers
- Back to Dashboard

**Expected Result**: SSH connection should remain active (green indicator) throughout all navigation

### 3. Console Debugging
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate between pages
4. Look for these log messages:
   ```
   setActiveEnvironment called: {prevEnv: "env1", newEnv: "env1", currentActive: "env1"}
   Same environment selected, no action needed
   ```

**Expected Result**: You should see "Same environment selected, no action needed" when navigating

### 4. MCP Catalog Test
1. Go to MCP Servers
2. Click "Browse Catalog" tab
3. Try to install an MCP server
4. Check console for logs:
   ```
   Install & Start button clicked!
   handleInstall called - button was clicked!
   currentEnv: {id: "...", name: "...", hostname: "...", username: "..."}
   ```

## What Was Fixed

1. **Navigation Issue**: Previously, every page navigation would disconnect and reconnect SSH
2. **Health Checks**: Removed automatic health checks that were causing false disconnections
3. **Cleanup**: Removed aggressive cleanup that disconnected on component unmount
4. **MCP Install**: Added debugging to identify why install button wasn't working

## If Issues Persist

Check the console logs and note:
- When exactly the disconnection happens
- What action triggered it
- Any error messages in the console

The extensive logging added will help identify any remaining issues.