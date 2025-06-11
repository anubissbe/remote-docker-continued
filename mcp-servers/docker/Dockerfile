FROM node:20-alpine

# Install Docker CLI
RUN apk add --no-cache docker-cli

WORKDIR /app

# Create package.json
RUN echo '{ \
  "name": "mcp-server-docker", \
  "version": "1.0.0", \
  "type": "module", \
  "main": "index.js", \
  "dependencies": { \
    "@modelcontextprotocol/sdk": "^0.5.0", \
    "dockerode": "^4.0.2", \
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
ENV DOCKER_SOCKET=/var/run/docker.sock

# Run the MCP server
CMD ["node", "index.js"]