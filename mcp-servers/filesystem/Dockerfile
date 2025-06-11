FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Create package.json for MCP server
RUN echo '{ \
  "name": "mcp-server-filesystem", \
  "version": "1.0.0", \
  "type": "module", \
  "main": "index.js", \
  "dependencies": { \
    "@modelcontextprotocol/sdk": "^0.5.0", \
    "glob": "^10.3.10", \
    "zod": "^3.22.4" \
  } \
}' > package.json

# Install dependencies
RUN npm install

# Copy server implementation
COPY index.js .

# Expose MCP port
EXPOSE 3000

# Set environment variables
ENV MCP_MODE=stdio
ENV FILESYSTEM_ROOT=/workspace

# Create workspace directory
RUN mkdir -p /workspace

# Run the MCP server
CMD ["node", "index.js"]