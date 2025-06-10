# Debugging MCP Installation - Version 1.0.25

## What's New
I've added visible debugging to the MCP installation dialog since F12 doesn't work in Docker Desktop extensions.

## How to Test

1. **Update the extension:**
   ```bash
   docker extension update telkombe/remote-docker:latest
   ```

2. **Go to MCP Servers → Browse Catalog**

3. **Click "Install" on any server**

4. **In the dialog, click "Install & Start"**

5. **You will now see a debug log in the dialog showing:**
   - Each step of the installation process
   - Any errors that occur
   - The exact API calls being made
   - The responses from the backend

## What to Look For

The debug log will show messages like:
```
10:45:23: Install button clicked
10:45:23: Environment: Your Environment Name
10:45:23: Server: filesystem
10:45:23: Starting installation of filesystem
10:45:23: Sending install request to backend...
10:45:23: Request: {
  "fullName": "mcp/filesystem:latest",
  "name": "filesystem",
  "username": "youruser",
  "hostname": "yourhost",
  "autoStart": true
}
10:45:23: Docker Desktop client is available
10:45:23: Calling POST /mcp/catalog/install...
10:45:24: API call completed
10:45:24: Received response from backend
...
```

## If Installation Fails

The log will show exactly where it fails:
- ❌ ERROR messages will appear in red
- Stack traces will be included
- The exact error from the backend will be shown

## Share the Debug Log

Please copy the entire contents of the debug log and share it so I can help diagnose the issue.

The dialog will stay open for 3 seconds after a successful installation, or indefinitely if there's an error, giving you time to read and copy the log.