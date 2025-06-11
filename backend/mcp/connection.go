package mcp

import (
	"fmt"
)

// MCPConnectionInfo provides connection details for AI clients
type MCPConnectionInfo struct {
	ServerID     string            `json:"server_id"`
	Name         string            `json:"name"`
	Type         string            `json:"type"`
	Status       string            `json:"status"`
	ConnectionType string          `json:"connection_type"` // stdio, http, websocket
	Endpoint     string            `json:"endpoint,omitempty"`
	ContainerID  string            `json:"container_id"`
	Environment  map[string]string `json:"environment,omitempty"`
	Capabilities []string          `json:"capabilities"`
	Instructions string            `json:"instructions"`
}

// GetConnectionInfo returns connection information for an MCP server
func (m *Manager) GetConnectionInfo(serverID string) (*MCPConnectionInfo, error) {
	server, err := m.GetServer(serverID)
	if err != nil {
		return nil, err
	}
	
	if server.Status != "running" {
		return nil, fmt.Errorf("server %s is not running", serverID)
	}
	
	// Determine connection type based on config
	connType := "stdio" // Default for MCP servers
	if mode, hasMode := server.Config.Env["MCP_MODE"]; hasMode {
		connType = mode
	}
	
	info := &MCPConnectionInfo{
		ServerID:       server.ID,
		Name:           server.Name,
		Type:           server.Type,
		Status:         server.Status,
		ConnectionType: connType,
		ContainerID:    server.ContainerID,
		Environment:    make(map[string]string),
		Capabilities:   m.getServerCapabilities(server),
	}
	
	// Add relevant environment variables (excluding sensitive ones)
	for k, v := range server.Config.Env {
		if k == "MCP_MODE" || k == "FILESYSTEM_ROOT" || k == "MEMORY_STORE" {
			info.Environment[k] = v
		}
	}
	
	// Generate connection instructions based on type
	switch connType {
	case "stdio":
		info.Instructions = fmt.Sprintf(
			"To connect via stdio:\n" +
			"docker exec -i %s node index.js\n\n" +
			"For Claude Desktop, add to config:\n" +
			"{\n" +
			"  \"mcpServers\": {\n" +
			"    \"%s\": {\n" +
			"      \"command\": \"docker\",\n" +
			"      \"args\": [\"exec\", \"-i\", \"%s\", \"node\", \"index.js\"]\n" +
			"    }\n" +
			"  }\n" +
			"}",
			server.ContainerID, server.Name, server.ContainerID,
		)
		
	case "http":
		info.Endpoint = fmt.Sprintf("http://localhost:%d", server.Port)
		info.Instructions = fmt.Sprintf(
			"HTTP endpoint: %s\n\n" +
			"For Claude Desktop, add to config:\n" +
			"{\n" +
			"  \"mcpServers\": {\n" +
			"    \"%s\": {\n" +
			"      \"url\": \"%s\"\n" +
			"    }\n" +
			"  }\n" +
			"}",
			info.Endpoint, server.Name, info.Endpoint,
		)
		
	case "websocket":
		info.Endpoint = fmt.Sprintf("ws://localhost:%d", server.Port)
		info.Instructions = fmt.Sprintf(
			"WebSocket endpoint: %s\n\n" +
			"For Claude Desktop, add to config:\n" +
			"{\n" +
			"  \"mcpServers\": {\n" +
			"    \"%s\": {\n" +
			"      \"url\": \"%s\",\n" +
			"      \"transport\": \"websocket\"\n" +
			"    }\n" +
			"  }\n" +
			"}",
			info.Endpoint, server.Name, info.Endpoint,
		)
	}
	
	return info, nil
}

// getServerCapabilities returns the capabilities of an MCP server based on its type
func (m *Manager) getServerCapabilities(server *MCPServer) []string {
	switch server.Type {
	case "filesystem":
		return []string{"read_file", "write_file", "list_directory", "search_files"}
	case "docker":
		return []string{"list_containers", "start_container", "stop_container", "exec_command", "container_logs", "list_images"}
	case "shell":
		return []string{"execute_command", "execute_script", "get_environment", "get_working_directory"}
	case "github":
		return []string{"list_repos", "get_repo", "create_issue", "list_issues", "create_pr", "list_prs"}
	case "memory":
		return []string{"store_memory", "recall_memory", "search_memories", "list_memories"}
	case "fetch":
		return []string{"fetch_url", "fetch_with_headers", "post_request"}
	default:
		return []string{"unknown"}
	}
}

// GetAllConnectionInfo returns connection info for all running MCP servers
func (m *Manager) GetAllConnectionInfo() ([]MCPConnectionInfo, error) {
	servers := m.ListServers()
	infos := make([]MCPConnectionInfo, 0)
	
	for _, server := range servers {
		if server.Status == "running" {
			info, err := m.GetConnectionInfo(server.ID)
			if err == nil {
				infos = append(infos, *info)
			}
		}
	}
	
	return infos, nil
}