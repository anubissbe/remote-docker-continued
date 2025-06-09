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
	return []PredefinedServer{
		{
			ID:          "filesystem-basic",
			Name:        "Filesystem Access",
			Description: "Read and write files on the remote host",
			Type:        "filesystem",
			Icon:        "folder",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-filesystem:latest",
				Env: map[string]string{
					"MCP_MODE": "filesystem",
				},
				Filesystem: &FilesystemConfig{
					RootPath: "/home",
					ReadOnly: false,
				},
			},
		},
		{
			ID:          "filesystem-readonly",
			Name:        "Filesystem (Read-Only)",
			Description: "Read-only access to files on the remote host",
			Type:        "filesystem",
			Icon:        "folder_open",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-filesystem:latest",
				Env: map[string]string{
					"MCP_MODE": "filesystem",
				},
				Filesystem: &FilesystemConfig{
					RootPath: "/",
					ReadOnly: true,
				},
			},
		},
		{
			ID:          "docker-management",
			Name:        "Docker Management",
			Description: "Manage Docker containers, images, and networks",
			Type:        "docker",
			Icon:        "docker",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-docker:latest",
				Env: map[string]string{
					"MCP_MODE": "docker",
				},
				Docker: &DockerConfig{
					SocketPath:  "/var/run/docker.sock",
					APIVersion:  "1.41",
					Permissions: "admin",
				},
			},
		},
		{
			ID:          "shell-bash",
			Name:        "Shell Access (Bash)",
			Description: "Execute bash commands on the remote host",
			Type:        "shell",
			Icon:        "terminal",
			Config: MCPConfig{
				Image:   "anthropic/mcp-server-shell:latest",
				Command: []string{"bash"},
				Env: map[string]string{
					"MCP_MODE":  "shell",
					"SHELL":     "/bin/bash",
				},
				Shell: &ShellConfig{
					Shell:      "bash",
					WorkingDir: "/workspace",
					BlockedCmds: []string{
						"rm -rf /*",
						"dd",
						"mkfs",
						"fdisk",
					},
				},
			},
		},
		{
			ID:          "shell-restricted",
			Name:        "Restricted Shell",
			Description: "Limited shell access with safety restrictions",
			Type:        "shell",
			Icon:        "security",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-shell:latest",
				Env: map[string]string{
					"MCP_MODE":     "shell",
					"SHELL":        "/bin/sh",
					"RESTRICTED":   "true",
				},
				Shell: &ShellConfig{
					Shell:      "sh",
					WorkingDir: "/workspace",
					AllowedCmds: []string{
						"ls", "cat", "grep", "find", "echo",
						"pwd", "cd", "mkdir", "touch", "cp",
						"mv", "head", "tail", "less", "more",
					},
				},
			},
		},
		{
			ID:          "git-repository",
			Name:        "Git Repository Access",
			Description: "Work with Git repositories on the remote host",
			Type:        "custom",
			Icon:        "git",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-git:latest",
				Env: map[string]string{
					"MCP_MODE": "git",
				},
				Custom: &CustomConfig{
					ExtraVolumes: map[string]string{
						"/home/git": "/repos",
					},
				},
			},
		},
		{
			ID:          "database-postgres",
			Name:        "PostgreSQL Database",
			Description: "Connect to PostgreSQL databases",
			Type:        "custom",
			Icon:        "database",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-postgres:latest",
				Env: map[string]string{
					"MCP_MODE": "postgres",
					"PGHOST":   "localhost",
					"PGPORT":   "5432",
				},
			},
		},
		{
			ID:          "web-browser",
			Name:        "Web Browser",
			Description: "Browse web pages and interact with web applications",
			Type:        "custom",
			Icon:        "web",
			Config: MCPConfig{
				Image: "anthropic/mcp-server-browser:latest",
				Env: map[string]string{
					"MCP_MODE": "browser",
				},
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