package mcp

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"
)

// DockerHubRepository represents a Docker Hub repository
type DockerHubRepository struct {
	User          string    `json:"user"`
	Name          string    `json:"name"`
	Namespace     string    `json:"namespace"`
	RepositoryType string   `json:"repository_type"`
	Status        int       `json:"status"`
	Description   string    `json:"description"`
	IsPrivate     bool      `json:"is_private"`
	IsAutomated   bool      `json:"is_automated"`
	CanEdit       bool      `json:"can_edit"`
	StarCount     int       `json:"star_count"`
	PullCount     int       `json:"pull_count"`
	LastUpdated   time.Time `json:"last_updated"`
	IsMigrated    bool      `json:"is_migrated"`
}

// DockerHubResponse represents the Docker Hub API response
type DockerHubResponse struct {
	Count    int                   `json:"count"`
	Next     string                `json:"next"`
	Previous string                `json:"previous"`
	Results  []DockerHubRepository `json:"results"`
}

// DockerHubTag represents a Docker Hub tag
type DockerHubTag struct {
	Name        string    `json:"name"`
	FullSize    int64     `json:"full_size"`
	LastUpdated time.Time `json:"last_updated"`
}

// DockerHubTagResponse represents the Docker Hub tags API response
type DockerHubTagResponse struct {
	Count    int           `json:"count"`
	Next     string        `json:"next"`
	Previous string        `json:"previous"`
	Results  []DockerHubTag `json:"results"`
}

// FetchMCPServersFromDockerHub fetches all MCP servers from Docker Hub
func (s *MCPCatalogService) FetchMCPServersFromDockerHub() ([]CatalogItem, error) {
	items := []CatalogItem{}
	
	// Start with the first page
	url := "https://hub.docker.com/v2/repositories/mcp/?page_size=100"
	
	for url != "" {
		resp, err := s.client.Get(url)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch from Docker Hub: %w", err)
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("Docker Hub API returned status %d", resp.StatusCode)
		}
		
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read response body: %w", err)
		}
		
		var dockerHubResp DockerHubResponse
		if err := json.Unmarshal(body, &dockerHubResp); err != nil {
			return nil, fmt.Errorf("failed to parse Docker Hub response: %w", err)
		}
		
		// Convert Docker Hub repositories to catalog items
		for _, repo := range dockerHubResp.Results {
			// Get the latest tag for each repository
			tags, err := s.fetchTagsForRepository(repo.Namespace, repo.Name)
			if err != nil {
				// If we can't fetch tags, use "latest" as default
				tags = []string{"latest"}
			}
			
			// Determine categories based on name and description
			categories := s.inferCategories(repo.Name, repo.Description)
			
			// Determine icon based on name
			icon := s.inferIcon(repo.Name)
			
			item := CatalogItem{
				Name:         repo.Name,
				Namespace:    repo.Namespace,
				Description:  repo.Description,
				Publisher:    repo.User,
				UpdatedAt:    repo.LastUpdated.Format(time.RFC3339),
				PullCount:    repo.PullCount,
				StarCount:    repo.StarCount,
				Tags:         tags,
				Icon:         icon,
				Categories:   categories,
				FullName:     fmt.Sprintf("%s/%s:latest", repo.Namespace, repo.Name),
				InstallReady: true, // All MCP servers should be ready to install
			}
			
			items = append(items, item)
		}
		
		// Check if there's a next page
		url = dockerHubResp.Next
	}
	
	return items, nil
}

// fetchTagsForRepository fetches available tags for a Docker Hub repository
func (s *MCPCatalogService) fetchTagsForRepository(namespace, name string) ([]string, error) {
	url := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/%s/tags/?page_size=10", namespace, name)
	
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch tags: status %d", resp.StatusCode)
	}
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	var tagResp DockerHubTagResponse
	if err := json.Unmarshal(body, &tagResp); err != nil {
		return nil, err
	}
	
	tags := make([]string, 0, len(tagResp.Results))
	for _, tag := range tagResp.Results {
		tags = append(tags, tag.Name)
	}
	
	return tags, nil
}

// inferCategories infers categories based on repository name and description
func (s *MCPCatalogService) inferCategories(name, description string) []string {
	categories := []string{}
	lowerName := strings.ToLower(name)
	lowerDesc := strings.ToLower(description)
	combined := lowerName + " " + lowerDesc
	
	// File/storage related
	if strings.Contains(combined, "file") || strings.Contains(combined, "filesystem") || 
	   strings.Contains(combined, "storage") || strings.Contains(combined, "fs") {
		categories = append(categories, "storage", "files")
	}
	
	// Docker related
	if strings.Contains(combined, "docker") || strings.Contains(combined, "container") {
		categories = append(categories, "docker", "containers")
	}
	
	// Database related
	if strings.Contains(combined, "database") || strings.Contains(combined, "db") ||
	   strings.Contains(combined, "sql") || strings.Contains(combined, "postgres") ||
	   strings.Contains(combined, "mysql") || strings.Contains(combined, "mongo") {
		categories = append(categories, "database", "storage")
	}
	
	// Git/VCS related
	if strings.Contains(combined, "git") || strings.Contains(combined, "github") ||
	   strings.Contains(combined, "version") || strings.Contains(combined, "vcs") {
		categories = append(categories, "git", "vcs")
	}
	
	// Shell/terminal related
	if strings.Contains(combined, "shell") || strings.Contains(combined, "terminal") ||
	   strings.Contains(combined, "bash") || strings.Contains(combined, "command") {
		categories = append(categories, "shell", "automation")
	}
	
	// Web/HTTP related
	if strings.Contains(combined, "web") || strings.Contains(combined, "http") ||
	   strings.Contains(combined, "fetch") || strings.Contains(combined, "browser") {
		categories = append(categories, "web", "http")
	}
	
	// AI/LLM related
	if strings.Contains(combined, "ai") || strings.Contains(combined, "llm") ||
	   strings.Contains(combined, "claude") || strings.Contains(combined, "gpt") ||
	   strings.Contains(combined, "model") {
		categories = append(categories, "ai", "llm")
	}
	
	// Memory/knowledge related
	if strings.Contains(combined, "memory") || strings.Contains(combined, "knowledge") ||
	   strings.Contains(combined, "context") {
		categories = append(categories, "memory", "knowledge")
	}
	
	// Default category if none matched
	if len(categories) == 0 {
		categories = append(categories, "tools")
	}
	
	return categories
}

// inferIcon infers an appropriate icon based on repository name
func (s *MCPCatalogService) inferIcon(name string) string {
	lowerName := strings.ToLower(name)
	
	switch {
	case strings.Contains(lowerName, "file") || strings.Contains(lowerName, "filesystem"):
		return "folder"
	case strings.Contains(lowerName, "docker"):
		return "docker"
	case strings.Contains(lowerName, "shell") || strings.Contains(lowerName, "terminal"):
		return "terminal"
	case strings.Contains(lowerName, "git"):
		return "git"
	case strings.Contains(lowerName, "database") || strings.Contains(lowerName, "db"):
		return "database"
	case strings.Contains(lowerName, "web") || strings.Contains(lowerName, "http"):
		return "web"
	case strings.Contains(lowerName, "memory") || strings.Contains(lowerName, "knowledge"):
		return "memory"
	case strings.Contains(lowerName, "ai") || strings.Contains(lowerName, "llm"):
		return "ai"
	default:
		return "settings"
	}
}