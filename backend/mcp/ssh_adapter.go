package mcp

import (
	"fmt"
	"os/exec"
	"sync"
)

// SSHTunnelAdapter adapts the main SSHTunnelManager to implement SSHManager interface
type SSHTunnelAdapter struct {
	executeCommand   func(username, hostname, command string) ([]byte, error)
	tunnels          map[string]*tunnelInfo
	currentUsername  string
	currentHostname  string
	mu               sync.RWMutex
}

type tunnelInfo struct {
	localPort  int
	remotePort int
	username   string
	hostname   string
	cmd        *exec.Cmd
}

// NewSSHTunnelAdapter creates a new adapter
func NewSSHTunnelAdapter(executeCommand func(username, hostname, command string) ([]byte, error)) *SSHTunnelAdapter {
	return &SSHTunnelAdapter{
		executeCommand: executeCommand,
		tunnels:        make(map[string]*tunnelInfo),
	}
}

// GetTunnelEndpoint returns the local endpoint for an MCP server tunnel
func (s *SSHTunnelAdapter) GetTunnelEndpoint(serverID string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	tunnel, exists := s.tunnels[serverID]
	if !exists {
		return "", fmt.Errorf("no tunnel found for server %s", serverID)
	}
	
	return fmt.Sprintf("localhost:%d", tunnel.localPort), nil
}

// CreateTunnel creates an SSH tunnel for MCP server access
func (s *SSHTunnelAdapter) CreateTunnel(serverID string, localPort, remotePort int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	// Close existing tunnel if any
	if tunnel, exists := s.tunnels[serverID]; exists {
		if tunnel.cmd != nil && tunnel.cmd.Process != nil {
			tunnel.cmd.Process.Kill()
		}
	}
	
	// For now, store tunnel info - actual SSH tunnel creation would happen here
	// In the real implementation, this would create an SSH port forward
	s.tunnels[serverID] = &tunnelInfo{
		localPort:  localPort,
		remotePort: remotePort,
	}
	
	return nil
}

// CloseTunnel closes an SSH tunnel
func (s *SSHTunnelAdapter) CloseTunnel(serverID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	tunnel, exists := s.tunnels[serverID]
	if !exists {
		return nil
	}
	
	if tunnel.cmd != nil && tunnel.cmd.Process != nil {
		tunnel.cmd.Process.Kill()
	}
	
	delete(s.tunnels, serverID)
	return nil
}

// ExecuteCommand executes a command on the remote host
func (s *SSHTunnelAdapter) ExecuteCommand(cmd string) (string, error) {
	// This needs to be configured with the current environment's username/hostname
	// For now, we'll need to pass this through context or configuration
	s.mu.RLock()
	username := s.currentUsername
	hostname := s.currentHostname
	s.mu.RUnlock()
	
	if username == "" || hostname == "" {
		return "", fmt.Errorf("no SSH environment configured")
	}
	
	output, err := s.executeCommand(username, hostname, cmd)
	if err != nil {
		return "", err
	}
	return string(output), nil
}

// SetCurrentEnvironment sets the current SSH environment for command execution
func (s *SSHTunnelAdapter) SetCurrentEnvironment(username, hostname string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.currentUsername = username
	s.currentHostname = hostname
}