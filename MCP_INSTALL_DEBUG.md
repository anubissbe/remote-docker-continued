# MCP Server Installation Debugging Guide

## What to Check in Browser Console

When you try to install an MCP server, please check the browser console (F12) for these logs:

### 1. When clicking "Install" button on a catalog item:
You should see:
```
Opening install dialog for: filesystem
Item full_name: mcp/filesystem:latest
```

### 2. When clicking "Install & Start" in the dialog:
You should see:
```
Install & Start button clicked!
Button disabled state: false
selectedItem exists: true
installing state: null
handleInstall called - button was clicked!
currentEnv: {id: "...", name: "...", hostname: "...", username: "..."}
selectedItem: {name: "filesystem", full_name: "mcp/filesystem:latest", ...}
installing state: null
Starting MCP server installation: filesystem
Installing MCP server with request: {
  fullName: "mcp/filesystem:latest",
  name: "filesystem",
  username: "youruser",
  hostname: "yourhost",
  autoStart: true
}
Install response: {...}
Actual response: {...}
```

## Common Issues and Solutions

### Issue 1: "Missing currentEnv or selectedItem"
**Console shows:**
```
Missing currentEnv or selectedItem: {currentEnv: undefined, selectedItem: {...}}
```
**Solution:** The environment is not properly connected. Make sure:
- SSH connection is active (green indicator)
- You have selected an environment

### Issue 2: Button doesn't respond
**Console shows nothing when clicking**
**Solution:** The button might be disabled. Check:
- Is there another installation in progress?
- Is the dialog properly opened?

### Issue 3: Network error
**Console shows:**
```
Error installing MCP server: NetworkError
```
**Solution:** Backend endpoint issue. Check:
- Is the extension properly installed?
- Try restarting Docker Desktop

### Issue 4: No response from backend
**Console shows:**
```
Install response: undefined
Error: No response from install endpoint
```
**Solution:** The backend service might not be running. Try:
- Reinstalling the extension
- Checking Docker Desktop logs

## What Information to Provide

Please share:
1. All console logs when attempting to install
2. Which MCP server you're trying to install
3. The exact error message (if any)
4. Whether the SSH connection is active
5. The environment details (visible in console logs)

## Quick Test

1. Open browser console (F12)
2. Go to MCP Servers → Browse Catalog
3. Click "Install" on any server
4. Click "Install & Start" in the dialog
5. Copy all console output and share it

This will help identify exactly where the installation process is failing.