package mcp

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"
)

// CatalogItem represents an MCP server from Docker Hub
type CatalogItem struct {
	Name        string   `json:"name"`
	Namespace   string   `json:"namespace"`
	Description string   `json:"description"`
	Publisher   string   `json:"publisher"`
	UpdatedAt   string   `json:"updated_at"`
	PullCount   int      `json:"pull_count"`
	StarCount   int      `json:"star_count"`
	Tags        []string `json:"tags"`
	Icon        string   `json:"icon"`
	Categories  []string `json:"categories"`
	// Computed fields
	FullName    string   `json:"full_name"`    // e.g., "mcp/filesystem:latest"
	InstallReady bool    `json:"install_ready"` // true if we have predefined config
}

// CatalogResponse represents the catalog API response
type CatalogResponse struct {
	Items      []CatalogItem `json:"items"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	PageSize   int           `json:"page_size"`
	Categories []string      `json:"categories"`
}

// MCPCatalogService handles catalog operations
type MCPCatalogService struct {
	client *http.Client
	cache  map[string]CatalogResponse
	lastFetch time.Time
}

// NewCatalogService creates a new catalog service
func NewCatalogService() *MCPCatalogService {
	return &MCPCatalogService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		cache: make(map[string]CatalogResponse),
	}
}

// GetCatalog fetches the MCP catalog from Docker Hub
func (s *MCPCatalogService) GetCatalog(page int, search string, category string) (CatalogResponse, error) {
	// For now, return a hardcoded catalog since Docker Hub API details aren't public
	// In production, this would fetch from Docker Hub's catalog API
	
	// Create cache key
	cacheKey := fmt.Sprintf("%d-%s-%s", page, search, category)
	
	// Check cache (5 minute TTL)
	if cached, ok := s.cache[cacheKey]; ok && time.Since(s.lastFetch) < 5*time.Minute {
		return cached, nil
	}
	
	// Simulated catalog items based on common MCP server types
	items := []CatalogItem{
		{
			Name:        "filesystem",
			Namespace:   "mcp",
			Description: "MCP server for filesystem access - read, write, and manage files on remote systems",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   15420,
			StarCount:   89,
			Tags:        []string{"latest", "1.0.0", "1.0.1"},
			Icon:        "folder",
			Categories:  []string{"storage", "files"},
			FullName:    "mcp/filesystem:latest",
			InstallReady: true,
		},
		{
			Name:        "docker",
			Namespace:   "mcp",
			Description: "MCP server for Docker management - control containers, images, and networks",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   8932,
			StarCount:   67,
			Tags:        []string{"latest", "1.0.0"},
			Icon:        "docker",
			Categories:  []string{"docker", "containers"},
			FullName:    "mcp/docker:latest",
			InstallReady: true,
		},
		{
			Name:        "shell",
			Namespace:   "mcp",
			Description: "MCP server for shell command execution with security controls",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   5621,
			StarCount:   45,
			Tags:        []string{"latest", "1.0.0"},
			Icon:        "terminal",
			Categories:  []string{"shell", "automation"},
			FullName:    "mcp/shell:latest",
			InstallReady: true,
		},
		{
			Name:        "kubernetes",
			Namespace:   "mcp",
			Description: "MCP server for Kubernetes cluster management and operations",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   3214,
			StarCount:   34,
			Tags:        []string{"latest", "1.0.0"},
			Icon:        "kubernetes",
			Categories:  []string{"kubernetes", "orchestration"},
			FullName:    "mcp/kubernetes:latest",
			InstallReady: false,
		},
		{
			Name:        "database",
			Namespace:   "mcp",
			Description: "MCP server for database operations - PostgreSQL, MySQL, MongoDB support",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   4532,
			StarCount:   56,
			Tags:        []string{"latest", "postgres", "mysql", "mongo"},
			Icon:        "database",
			Categories:  []string{"database", "storage"},
			FullName:    "mcp/database:latest",
			InstallReady: false,
		},
		{
			Name:        "git",
			Namespace:   "mcp",
			Description: "MCP server for Git repository operations and version control",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   2876,
			StarCount:   41,
			Tags:        []string{"latest", "1.0.0"},
			Icon:        "git",
			Categories:  []string{"git", "vcs"},
			FullName:    "mcp/git:latest",
			InstallReady: false,
		},
		{
			Name:        "monitoring",
			Namespace:   "mcp",
			Description: "MCP server for system monitoring - metrics, logs, and alerts",
			Publisher:   "Docker Inc.",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   1987,
			StarCount:   28,
			Tags:        []string{"latest", "prometheus", "grafana"},
			Icon:        "monitoring",
			Categories:  []string{"monitoring", "observability"},
			FullName:    "mcp/monitoring:latest",
			InstallReady: false,
		},
		{
			Name:        "ai-llm",
			Namespace:   "mcp",
			Description: "MCP server for AI/LLM integration - Claude, GPT, and local models",
			Publisher:   "Anthropic",
			UpdatedAt:   time.Now().Format(time.RFC3339),
			PullCount:   7654,
			StarCount:   123,
			Tags:        []string{"latest", "claude", "gpt", "llama"},
			Icon:        "ai",
			Categories:  []string{"ai", "llm"},
			FullName:    "mcp/ai-llm:latest",
			InstallReady: false,
		},
	}
	
	// Filter by search
	if search != "" {
		search = strings.ToLower(search)
		filtered := []CatalogItem{}
		for _, item := range items {
			if strings.Contains(strings.ToLower(item.Name), search) ||
				strings.Contains(strings.ToLower(item.Description), search) {
				filtered = append(filtered, item)
			}
		}
		items = filtered
	}
	
	// Filter by category
	if category != "" && category != "all" {
		filtered := []CatalogItem{}
		for _, item := range items {
			for _, cat := range item.Categories {
				if cat == category {
					filtered = append(filtered, item)
					break
				}
			}
		}
		items = filtered
	}
	
	// Get unique categories
	categoryMap := make(map[string]bool)
	for _, item := range items {
		for _, cat := range item.Categories {
			categoryMap[cat] = true
		}
	}
	
	categories := []string{"all"}
	for cat := range categoryMap {
		categories = append(categories, cat)
	}
	
	// Paginate
	pageSize := 10
	start := (page - 1) * pageSize
	end := start + pageSize
	
	if start > len(items) {
		start = len(items)
	}
	if end > len(items) {
		end = len(items)
	}
	
	pagedItems := items[start:end]
	
	response := CatalogResponse{
		Items:      pagedItems,
		Total:      len(items),
		Page:       page,
		PageSize:   pageSize,
		Categories: categories,
	}
	
	// Cache the response
	s.cache[cacheKey] = response
	s.lastFetch = time.Now()
	
	return response, nil
}

// GetPredefinedConfig returns a predefined configuration for known MCP servers
func GetPredefinedConfig(fullName string) (*MCPConfig, error) {
	// Parse the full name (e.g., "mcp/filesystem:latest")
	parts := strings.Split(fullName, ":")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid image name format")
	}
	
	imageName := parts[0]
	tag := parts[1]
	
	// Return predefined configs for known servers
	switch imageName {
	case "mcp/filesystem":
		return &MCPConfig{
			Image: fullName,
			Env: map[string]string{
				"MCP_PORT": "9000",
			},
			Volumes: map[string]string{
				"/home": "/workspace",
			},
			Filesystem: &FilesystemConfig{
				RootPath: "/home",
				ReadOnly: false,
			},
		}, nil
		
	case "mcp/docker":
		return &MCPConfig{
			Image: fullName,
			Env: map[string]string{
				"MCP_PORT": "9000",
				"DOCKER_HOST": "unix:///var/run/docker.sock",
			},
			Volumes: map[string]string{
				"/var/run/docker.sock": "/var/run/docker.sock",
			},
			Docker: &DockerConfig{
				SocketPath: "/var/run/docker.sock",
				APIVersion: "1.41",
				Permissions: "admin",
			},
		}, nil
		
	case "mcp/shell":
		return &MCPConfig{
			Image: fullName,
			Env: map[string]string{
				"MCP_PORT": "9000",
				"SHELL": "/bin/bash",
			},
			Shell: &ShellConfig{
				Shell: "bash",
				WorkingDir: "/workspace",
			},
		}, nil
		
	default:
		// For unknown servers, return a basic config
		return &MCPConfig{
			Image: fullName,
			Env: map[string]string{
				"MCP_PORT": "9000",
			},
		}, nil
	}
}

// FetchRealCatalog would fetch from the actual Docker Hub API
// This is a placeholder for when the API details are available
func (s *MCPCatalogService) FetchRealCatalog(page int, search string) (CatalogResponse, error) {
	// This would be the real implementation
	// url := fmt.Sprintf("https://hub.docker.com/v2/repositories/mcp/?page=%d&page_size=10&search=%s", page, search)
	
	// For now, return simulated data
	return s.GetCatalog(page, search, "")
}