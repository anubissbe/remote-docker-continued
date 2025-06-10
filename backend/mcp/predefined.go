package mcp

// PredefinedServer represents a pre-configured MCP server type
type PredefinedServer struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	Icon        string    `json:"icon"`
	Config      MCPConfig `json:"config"`
}

// GetPredefinedServers returns the list of predefined MCP server configurations
func GetPredefinedServers() []PredefinedServer {
	// Note: These are example configurations. The actual MCP servers from Docker Hub
	// are under the mcp/ namespace (e.g., mcp/server-name:latest)
	// Users should check https://hub.docker.com/catalogs/mcp for available servers
	return []PredefinedServer{
		{
			ID:          "custom-mcp-server",
			Name:        "Custom MCP Server",
			Description: "Configure a custom MCP server from Docker Hub catalog",
			Type:        "custom",
			Icon:        "settings",
			Config: MCPConfig{
				// User should replace with actual MCP server from hub.docker.com/catalogs/mcp
				Image: "mcp/example-server:latest",
				Env: map[string]string{
					"MCP_CONFIG": "custom",
				},
			},
		},
		{
			ID:          "filesystem-local",
			Name:        "Local Filesystem Access",
			Description: "Access files on the remote host (requires MCP filesystem server)",
			Type:        "filesystem",
			Icon:        "folder",
			Config: MCPConfig{
				// This is a placeholder - actual image should be from mcp/ namespace
				Image: "mcp/filesystem:latest",
				Env: map[string]string{
					"MCP_ROOT_PATH": "/home",
					"MCP_READ_ONLY": "false",
				},
				Volumes: map[string]string{
					"/home": "/workspace",
				},
			},
		},
		{
			ID:          "docker-local",
			Name:        "Docker Access",
			Description: "Manage Docker on the remote host (requires MCP docker server)",
			Type:        "docker",
			Icon:        "docker",
			Config: MCPConfig{
				// This is a placeholder - actual image should be from mcp/ namespace
				Image: "mcp/docker:latest",
				Env: map[string]string{
					"DOCKER_HOST": "unix:///var/run/docker.sock",
				},
				Volumes: map[string]string{
					"/var/run/docker.sock": "/var/run/docker.sock",
				},
			},
		},
		{
			ID:          "browse-catalog",
			Name:        "Browse MCP Catalog",
			Description: "Visit hub.docker.com/catalogs/mcp to see all available MCP servers",
			Type:        "info",
			Icon:        "info",
			Config: MCPConfig{
				Image: "alpine:latest",
				Command: []string{"echo", "Visit https://hub.docker.com/catalogs/mcp"},
			},
		},
	}
}

// GetPredefinedServerByID retrieves a predefined server configuration by ID
func GetPredefinedServerByID(id string) (*PredefinedServer, bool) {
	servers := GetPredefinedServers()
	for _, server := range servers {
		if server.ID == id {
			return &server, true
		}
	}
	return nil, false
}