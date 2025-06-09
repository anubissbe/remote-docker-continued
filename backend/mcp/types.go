package mcp

import (
	"time"
)

// MCPServer represents an MCP server instance
type MCPServer struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"` // filesystem, docker, shell, custom
	Status      string    `json:"status"` // running, stopped, error
	ContainerID string    `json:"containerId,omitempty"`
	Port        int       `json:"port"`
	CreatedAt   time.Time `json:"createdAt"`
	Config      MCPConfig `json:"config"`
}

// MCPConfig contains server-specific configuration
type MCPConfig struct {
	// Common fields
	Image   string            `json:"image"`
	Command []string          `json:"command,omitempty"`
	Env     map[string]string `json:"env,omitempty"`
	
	// Type-specific fields
	Filesystem *FilesystemConfig `json:"filesystem,omitempty"`
	Docker     *DockerConfig     `json:"docker,omitempty"`
	Shell      *ShellConfig      `json:"shell,omitempty"`
	Custom     *CustomConfig     `json:"custom,omitempty"`
}

// FilesystemConfig for filesystem MCP servers
type FilesystemConfig struct {
	RootPath    string   `json:"rootPath"`
	ReadOnly    bool     `json:"readOnly"`
	AllowedDirs []string `json:"allowedDirs,omitempty"`
}

// DockerConfig for Docker MCP servers
type DockerConfig struct {
	SocketPath  string `json:"socketPath"`
	APIVersion  string `json:"apiVersion"`
	Permissions string `json:"permissions"` // read, write, admin
}

// ShellConfig for shell MCP servers
type ShellConfig struct {
	Shell        string   `json:"shell"` // bash, sh, zsh
	AllowedCmds  []string `json:"allowedCmds,omitempty"`
	BlockedCmds  []string `json:"blockedCmds,omitempty"`
	WorkingDir   string   `json:"workingDir"`
}

// CustomConfig for custom MCP servers
type CustomConfig struct {
	GitRepo     string            `json:"gitRepo,omitempty"`
	BuildCmd    string            `json:"buildCmd,omitempty"`
	RunCmd      string            `json:"runCmd,omitempty"`
	ExtraVolumes map[string]string `json:"extraVolumes,omitempty"`
}

// MCPServerRequest represents a request to create/update an MCP server
type MCPServerRequest struct {
	Name   string    `json:"name" validate:"required"`
	Type   string    `json:"type" validate:"required,oneof=filesystem docker shell custom"`
	Config MCPConfig `json:"config" validate:"required"`
}

// MCPServerResponse wraps server data with metadata
type MCPServerResponse struct {
	Server  *MCPServer `json:"server"`
	Message string     `json:"message,omitempty"`
}

// MCPServerListResponse contains multiple servers
type MCPServerListResponse struct {
	Servers []MCPServer `json:"servers"`
	Total   int         `json:"total"`
}

// MCPLogEntry represents a log line from an MCP server
type MCPLogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	ServerID  string    `json:"serverId"`
}