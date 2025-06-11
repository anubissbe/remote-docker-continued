FROM node:20-alpine

# Install bash and common tools
RUN apk add --no-cache bash curl wget git jq

WORKDIR /app

# Create package.json
RUN echo '{ \
  "name": "mcp-server-shell", \
  "version": "1.0.0", \
  "type": "module", \
  "main": "index.js", \
  "dependencies": { \
    "@modelcontextprotocol/sdk": "^0.5.0", \
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
ENV SHELL=/bin/bash
ENV WORKING_DIR=/workspace

# Create workspace directory
RUN mkdir -p /workspace

# Run the MCP server
CMD ["node", "index.js"]