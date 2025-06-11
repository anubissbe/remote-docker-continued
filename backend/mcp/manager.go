package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
	
	"github.com/sirupsen/logrus"
)

// Manager handles MCP server lifecycle
type Manager struct {
	servers    map[string]*MCPServer
	mu         sync.RWMutex
	sshMgr     SSHManager
	logger     *logrus.Logger
	dataFile   string
}

// SSHManager interface for SSH operations
type SSHManager interface {
	GetTunnelEndpoint(serverID string) (string, error)
	CreateTunnel(serverID string, localPort, remotePort int) error
	CloseTunnel(serverID string) error
	ExecuteCommand(cmd string) (string, error)
}

// NewManager creates a new MCP manager
func NewManager(sshMgr SSHManager, logger *logrus.Logger) *Manager {
	dataFile := "/root/docker-extension/mcp-servers.json"
	
	// Ensure directory exists
	dir := filepath.Dir(dataFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		logger.Warnf("Failed to create MCP data directory: %v", err)
	}
	
	manager := &Manager{
		servers:  make(map[string]*MCPServer),
		sshMgr:   sshMgr,
		logger:   logger,
		dataFile: dataFile,
	}
	
	// Load existing servers
	manager.loadServers()
	
	return manager
}

// CreateServer creates a new MCP server on the remote host
func (m *Manager) CreateServer(ctx context.Context, req MCPServerRequest) (*MCPServer, error) {
	m.logger.Info("CreateServer: Starting")
	
	m.mu.Lock()
	defer m.mu.Unlock()
	m.logger.Info("CreateServer: Acquired lock")
	
	// Get the next available port INSIDE the lock to prevent race conditions
	nextPort := m.getNextAvailablePortUnsafe()
	m.logger.Infof("CreateServer: Got next port: %d", nextPort)
	
	// Generate unique ID
	serverID := fmt.Sprintf("mcp-%s-%d", req.Type, time.Now().Unix())
	
	// Create server instance
	server := &MCPServer{
		ID:        serverID,
		Name:      req.Name,
		Type:      req.Type,
		Status:    "creating",
		Port:      nextPort,
		CreatedAt: time.Now(),
		Config:    req.Config,
	}
	
	// Store server
	m.servers[serverID] = server
	m.logger.Infof("CreateServer: Stored server %s", serverID)
	
	// Save to disk
	m.saveServersUnsafe()
	m.logger.Info("CreateServer: Saved to disk")
	
	// Deploy in background
	go m.deployServer(ctx, server)
	m.logger.Info("CreateServer: Started deployment goroutine")
	
	return server, nil
}

// GetServer retrieves a server by ID
func (m *Manager) GetServer(serverID string) (*MCPServer, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	server, exists := m.servers[serverID]
	if !exists {
		return nil, fmt.Errorf("server not found: %s", serverID)
	}
	
	return server, nil
}

// ListServers returns all MCP servers
func (m *Manager) ListServers() []MCPServer {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	servers := make([]MCPServer, 0, len(m.servers))
	for _, server := range m.servers {
		servers = append(servers, *server)
	}
	
	return servers
}

// StartServer starts a stopped MCP server
func (m *Manager) StartServer(ctx context.Context, serverID string) error {
	server, err := m.GetServer(serverID)
	if err != nil {
		return err
	}
	
	if server.Status == "running" {
		return nil
	}
	
	// Start the container
	cmd := fmt.Sprintf("docker start %s", server.ContainerID)
	output, err := m.sshMgr.ExecuteCommand(cmd)
	if err != nil {
		m.logger.WithError(err).WithField("output", output).Error("Failed to start MCP server")
		return fmt.Errorf("failed to start server: %w", err)
	}
	
	// Update status
	m.updateServerStatus(serverID, "running")
	
	// Re-establish SSH tunnel
	return m.sshMgr.CreateTunnel(serverID, server.Port, server.Port)
}

// StopServer stops a running MCP server
func (m *Manager) StopServer(ctx context.Context, serverID string) error {
	server, err := m.GetServer(serverID)
	if err != nil {
		return err
	}
	
	if server.Status == "stopped" {
		return nil
	}
	
	// Stop the container
	cmd := fmt.Sprintf("docker stop %s", server.ContainerID)
	output, err := m.sshMgr.ExecuteCommand(cmd)
	if err != nil {
		m.logger.WithError(err).WithField("output", output).Error("Failed to stop MCP server")
		return fmt.Errorf("failed to stop server: %w", err)
	}
	
	// Update status
	m.updateServerStatus(serverID, "stopped")
	
	// Close SSH tunnel
	return m.sshMgr.CloseTunnel(serverID)
}

// DeleteServer removes an MCP server
func (m *Manager) DeleteServer(ctx context.Context, serverID string) error {
	server, err := m.GetServer(serverID)
	if err != nil {
		return err
	}
	
	// Stop if running
	if server.Status == "running" {
		if err := m.StopServer(ctx, serverID); err != nil {
			return err
		}
	}
	
	// Remove container
	cmd := fmt.Sprintf("docker rm -f %s", server.ContainerID)
	output, err := m.sshMgr.ExecuteCommand(cmd)
	if err != nil {
		m.logger.WithError(err).WithField("output", output).Error("Failed to remove MCP server")
		// Continue with cleanup even if removal fails
	}
	
	// Remove from manager
	m.mu.Lock()
	delete(m.servers, serverID)
	m.mu.Unlock()
	
	return nil
}

// GetServerLogs retrieves logs from an MCP server
func (m *Manager) GetServerLogs(serverID string, lines int) ([]MCPLogEntry, error) {
	server, err := m.GetServer(serverID)
	if err != nil {
		return nil, err
	}
	
	// Get container logs
	cmd := fmt.Sprintf("docker logs --tail %d --timestamps %s", lines, server.ContainerID)
	output, err := m.sshMgr.ExecuteCommand(cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to get logs: %w", err)
	}
	
	// Parse logs (simplified - real implementation would parse properly)
	logs := []MCPLogEntry{
		{
			Timestamp: time.Now(),
			Level:     "info",
			Message:   output,
			ServerID:  serverID,
		},
	}
	
	return logs, nil
}

// deployServer handles the actual deployment of an MCP server
func (m *Manager) deployServer(ctx context.Context, server *MCPServer) {
	defer func() {
		if r := recover(); r != nil {
			m.logger.WithField("serverID", server.ID).Errorf("Panic in deployServer: %v", r)
			m.updateServerStatus(server.ID, "error")
		}
	}()
	
	// Build docker run command based on server type
	dockerCmd := m.buildDockerCommand(server)
	
	m.logger.WithFields(logrus.Fields{
		"serverID": server.ID,
		"command":  dockerCmd,
	}).Info("Deploying MCP server")
	
	// Execute deployment
	output, err := m.sshMgr.ExecuteCommand(dockerCmd)
	if err != nil {
		m.logger.WithError(err).WithField("output", output).Error("Failed to deploy MCP server")
		m.updateServerStatus(server.ID, "error")
		return
	}
	
	// Extract container ID from output (trim whitespace)
	containerID := strings.TrimSpace(output)
	m.updateServerContainerID(server.ID, containerID)
	
	// Create SSH tunnel for MCP connection
	if err := m.sshMgr.CreateTunnel(server.ID, server.Port, server.Port); err != nil {
		m.logger.WithError(err).Error("Failed to create SSH tunnel for MCP server")
		m.updateServerStatus(server.ID, "error")
		return
	}
	
	// Update status to running
	m.updateServerStatus(server.ID, "running")
	
	m.logger.WithField("serverID", server.ID).Info("MCP server deployed successfully")
}

// buildDockerCommand constructs the docker run command for the server
func (m *Manager) buildDockerCommand(server *MCPServer) string {
	// Base command with restart policy
	cmd := fmt.Sprintf("docker run -d --name %s --restart unless-stopped", server.ID)
	
	// Add labels for identification
	cmd += fmt.Sprintf(" -l mcp.server.id=%s", server.ID)
	cmd += fmt.Sprintf(" -l mcp.server.name=%s", server.Name)
	cmd += fmt.Sprintf(" -l mcp.server.type=%s", server.Type)
	
	// For MCP servers in stdio mode, we need to keep them running
	if mode, hasMode := server.Config.Env["MCP_MODE"]; hasMode && mode == "stdio" {
		// Add a command to keep the container running if no command is specified
		if len(server.Config.Command) == 0 {
			server.Config.Command = []string{"tail", "-f", "/dev/null"}
		}
	}
	
	// Add port mapping only if not in stdio mode
	if mode, hasMode := server.Config.Env["MCP_MODE"]; !hasMode || mode != "stdio" {
		cmd += fmt.Sprintf(" -p %d:%d", server.Port, server.Port)
	}
	
	// Add environment variables
	for k, v := range server.Config.Env {
		cmd += fmt.Sprintf(" -e %s=%s", k, v)
	}
	
	// Add volumes
	for src, dst := range server.Config.Volumes {
		cmd += fmt.Sprintf(" -v %s:%s", src, dst)
	}
	
	// Add type-specific configurations
	switch server.Type {
	case "filesystem":
		if server.Config.Filesystem != nil {
			cmd += fmt.Sprintf(" -v %s:/workspace", server.Config.Filesystem.RootPath)
			if server.Config.Filesystem.ReadOnly {
				cmd += ":ro"
			}
		}
		
	case "docker":
		if server.Config.Docker != nil {
			cmd += fmt.Sprintf(" -v %s:/var/run/docker.sock", server.Config.Docker.SocketPath)
		}
		
	case "shell":
		if server.Config.Shell != nil && server.Config.Shell.WorkingDir != "" {
			cmd += fmt.Sprintf(" -w %s", server.Config.Shell.WorkingDir)
		}
		
	case "custom":
		if server.Config.Custom != nil {
			for src, dst := range server.Config.Custom.ExtraVolumes {
				cmd += fmt.Sprintf(" -v %s:%s", src, dst)
			}
		}
	}
	
	// Add image and command
	cmd += fmt.Sprintf(" %s", server.Config.Image)
	if len(server.Config.Command) > 0 {
		for _, arg := range server.Config.Command {
			cmd += fmt.Sprintf(" %s", arg)
		}
	}
	
	return cmd
}

// Helper methods
func (m *Manager) getNextAvailablePort() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.getNextAvailablePortUnsafe()
}

// getNextAvailablePortUnsafe returns the next available port without acquiring the lock
// This method should only be called when the lock is already held
func (m *Manager) getNextAvailablePortUnsafe() int {
	// Simple implementation - in production would check for actual available ports
	basePort := 9000
	maxPort := basePort
	
	for _, server := range m.servers {
		if server.Port > maxPort {
			maxPort = server.Port
		}
	}
	
	if maxPort >= basePort {
		return maxPort + 1
	}
	return basePort
}

func (m *Manager) updateServerStatus(serverID, status string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if server, exists := m.servers[serverID]; exists {
		server.Status = status
		// Save to disk after updating status
		m.saveServersUnsafe()
	}
}

func (m *Manager) updateServerContainerID(serverID, containerID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if server, exists := m.servers[serverID]; exists {
		server.ContainerID = containerID
		// Save to disk after updating container ID
		m.saveServersUnsafe()
	}
}

// saveServers saves servers to disk (with locking)
func (m *Manager) saveServers() {
	m.mu.RLock()
	defer m.mu.RUnlock()
	m.saveServersUnsafe()
}

// saveServersUnsafe saves servers to disk (without locking - caller must hold lock)
func (m *Manager) saveServersUnsafe() {
	// Convert servers to a slice for JSON serialization
	serversList := make([]MCPServer, 0, len(m.servers))
	for _, server := range m.servers {
		serversList = append(serversList, *server)
	}
	
	data, err := json.MarshalIndent(serversList, "", "  ")
	if err != nil {
		m.logger.Errorf("Failed to marshal MCP servers: %v", err)
		return
	}
	
	if err := os.WriteFile(m.dataFile, data, 0644); err != nil {
		m.logger.Errorf("Failed to save MCP servers to %s: %v", m.dataFile, err)
		return
	}
	
	m.logger.Debugf("Saved %d MCP servers to %s", len(serversList), m.dataFile)
}

// loadServers loads servers from disk
func (m *Manager) loadServers() {
	data, err := os.ReadFile(m.dataFile)
	if err != nil {
		if os.IsNotExist(err) {
			m.logger.Infof("No existing MCP servers file found at %s", m.dataFile)
		} else {
			m.logger.Errorf("Failed to read MCP servers from %s: %v", m.dataFile, err)
		}
		return
	}
	
	var serversList []MCPServer
	if err := json.Unmarshal(data, &serversList); err != nil {
		m.logger.Errorf("Failed to unmarshal MCP servers: %v", err)
		return
	}
	
	// Convert slice back to map
	for i := range serversList {
		server := &serversList[i]
		m.servers[server.ID] = server
	}
	
	m.logger.Infof("Loaded %d MCP servers from %s", len(serversList), m.dataFile)
}