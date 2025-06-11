package utils

import (
	"fmt"
	"regexp"
	"strings"
)

// Shell escape functions for safe command execution

var (
	// Safe patterns for validation
	containerIDPattern = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`)
	imageNamePattern   = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.:/-]*$`)
	volumeNamePattern  = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`)
	networkIDPattern   = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`)
	usernamePattern    = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`)
	hostnamePattern    = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9.-]*$`)
)

// ShellEscape escapes a string for safe use in shell commands
func ShellEscape(s string) string {
	// If string is empty, return empty quotes
	if s == "" {
		return "''"
	}
	
	// If string contains only safe characters, return as-is
	if regexp.MustCompile(`^[a-zA-Z0-9_./=-]+$`).MatchString(s) {
		return s
	}
	
	// Otherwise, wrap in single quotes and escape any single quotes
	return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'"
}

// ValidateContainerID validates a container ID or name
func ValidateContainerID(id string) error {
	if id == "" {
		return fmt.Errorf("container ID cannot be empty")
	}
	if len(id) > 255 {
		return fmt.Errorf("container ID too long")
	}
	if !containerIDPattern.MatchString(id) {
		return fmt.Errorf("invalid container ID format")
	}
	return nil
}

// ValidateImageName validates a Docker image name
func ValidateImageName(name string) error {
	if name == "" {
		return fmt.Errorf("image name cannot be empty")
	}
	if len(name) > 255 {
		return fmt.Errorf("image name too long")
	}
	if !imageNamePattern.MatchString(name) {
		return fmt.Errorf("invalid image name format")
	}
	return nil
}

// ValidateVolumeName validates a Docker volume name
func ValidateVolumeName(name string) error {
	if name == "" {
		return fmt.Errorf("volume name cannot be empty")
	}
	if len(name) > 255 {
		return fmt.Errorf("volume name too long")
	}
	if !volumeNamePattern.MatchString(name) {
		return fmt.Errorf("invalid volume name format")
	}
	return nil
}

// ValidateNetworkID validates a Docker network ID or name
func ValidateNetworkID(id string) error {
	if id == "" {
		return fmt.Errorf("network ID cannot be empty")
	}
	if len(id) > 255 {
		return fmt.Errorf("network ID too long")
	}
	if !networkIDPattern.MatchString(id) {
		return fmt.Errorf("invalid network ID format")
	}
	return nil
}

// ValidateSSHUsername validates an SSH username
func ValidateSSHUsername(username string) error {
	if username == "" {
		return fmt.Errorf("username cannot be empty")
	}
	if len(username) > 32 {
		return fmt.Errorf("username too long")
	}
	if !usernamePattern.MatchString(username) {
		return fmt.Errorf("invalid username format")
	}
	return nil
}

// ValidateSSHHostname validates an SSH hostname
func ValidateSSHHostname(hostname string) error {
	if hostname == "" {
		return fmt.Errorf("hostname cannot be empty")
	}
	if len(hostname) > 255 {
		return fmt.Errorf("hostname too long")
	}
	if !hostnamePattern.MatchString(hostname) {
		return fmt.Errorf("invalid hostname format")
	}
	return nil
}

// BuildDockerCommand safely builds a docker command with proper escaping
func BuildDockerCommand(args ...string) string {
	if len(args) == 0 {
		return "docker"
	}
	
	parts := make([]string, len(args))
	for i, arg := range args {
		parts[i] = ShellEscape(arg)
	}
	
	return "docker " + strings.Join(parts, " ")
}

// BuildSSHTarget safely builds an SSH target string
func BuildSSHTarget(username, hostname string) (string, error) {
	if err := ValidateSSHUsername(username); err != nil {
		return "", fmt.Errorf("invalid SSH username: %w", err)
	}
	if err := ValidateSSHHostname(hostname); err != nil {
		return "", fmt.Errorf("invalid SSH hostname: %w", err)
	}
	return fmt.Sprintf("%s@%s", username, hostname), nil
}