package utils

import (
	"fmt"
	"os"
	"path/filepath"
)

// SSHConfig holds SSH connection configuration
type SSHConfig struct {
	KnownHostsFile       string
	StrictHostKeyChecking string
	ConnectTimeout       int
	ServerAliveInterval  int
	ServerAliveCountMax  int
}

// GetSecureSSHConfig returns secure SSH configuration
func GetSecureSSHConfig() *SSHConfig {
	// Get or create known hosts file in the extension data directory
	knownHostsPath := getKnownHostsPath()
	
	return &SSHConfig{
		KnownHostsFile:       knownHostsPath,
		StrictHostKeyChecking: "accept-new", // More secure than "no", adds new hosts automatically
		ConnectTimeout:       10,
		ServerAliveInterval:  30,
		ServerAliveCountMax:  10,
	}
}

// GetSSHOptions returns SSH command options based on the config
func (c *SSHConfig) GetSSHOptions() []string {
	options := []string{
		"-o", fmt.Sprintf("StrictHostKeyChecking=%s", c.StrictHostKeyChecking),
		"-o", fmt.Sprintf("UserKnownHostsFile=%s", c.KnownHostsFile),
		"-o", fmt.Sprintf("ConnectTimeout=%d", c.ConnectTimeout),
		"-o", fmt.Sprintf("ServerAliveInterval=%d", c.ServerAliveInterval),
		"-o", fmt.Sprintf("ServerAliveCountMax=%d", c.ServerAliveCountMax),
		"-o", "TCPKeepAlive=yes",
		"-o", "BatchMode=yes",
		"-o", "ExitOnForwardFailure=no",
	}
	
	return options
}

// GetSSHMasterOptions returns options for creating SSH master connection
func (c *SSHConfig) GetSSHMasterOptions(controlPath string) []string {
	options := []string{
		"-M",
		"-S", controlPath,
		"-o", "ControlPersist=300",
	}
	
	// Add common options
	options = append(options, c.GetSSHOptions()...)
	
	// Add master-specific options
	options = append(options, "-N")
	
	return options
}

// GetSSHCommandOptions returns options for running commands through existing connection
func (c *SSHConfig) GetSSHCommandOptions(controlPath string) []string {
	return []string{
		"-S", controlPath,
		"-o", fmt.Sprintf("ConnectTimeout=%d", c.ConnectTimeout),
		"-o", "BatchMode=yes",
	}
}

// getKnownHostsPath returns the path to the known_hosts file
func getKnownHostsPath() string {
	// Use the extension data directory
	dataDir := "/root/docker-extension"
	sshDir := filepath.Join(dataDir, ".ssh")
	
	// Create directory if it doesn't exist
	os.MkdirAll(sshDir, 0700)
	
	return filepath.Join(sshDir, "known_hosts")
}

// VerifyHostKey checks if a host key should be trusted
// This can be extended to implement custom host key verification logic
func VerifyHostKey(hostname string, key string) error {
	// For now, we rely on SSH's built-in verification with "accept-new"
	// This could be extended to implement custom verification logic
	// such as checking against a centralized key repository
	return nil
}