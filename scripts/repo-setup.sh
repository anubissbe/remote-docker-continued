#!/bin/bash

# Repository setup and maintenance script
# Helps configure GitHub repository settings and manage common tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Remote Docker Repository Setup${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed"
        print_info "Install from: https://cli.github.com/"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "Not authenticated with GitHub"
        print_info "Run: gh auth login"
        exit 1
    fi
    
    print_status "Prerequisites OK"
}

# Setup repository labels
setup_labels() {
    print_info "Setting up repository labels..."
    
    # Create labels if they don't exist
    labels=(
        "bug:d73a4a:Something isn't working"
        "enhancement:a2eeef:New feature or request"
        "documentation:0075ca:Improvements or additions to documentation"
        "good first issue:7057ff:Good for newcomers"
        "help wanted:008672:Extra attention is needed"
        "dependencies:0366d6:Pull requests that update a dependency file"
        "frontend:1d76db:Frontend related changes"
        "backend:0e8a16:Backend related changes"
        "docker:2188ff:Docker related changes"
        "github-actions:000000:GitHub Actions workflow changes"
        "security:b60205:Security related changes"
        "performance:fbca04:Performance improvements"
    )
    
    for label in "${labels[@]}"; do
        IFS=':' read -r name color description <<< "$label"
        gh label create "$name" --color "$color" --description "$description" 2>/dev/null || true
    done
    
    print_status "Labels configured"
}

# Setup repository settings
setup_repository() {
    print_info "Configuring repository settings..."
    
    # Enable features
    gh repo edit --enable-issues --enable-wiki=false --enable-projects=false
    gh repo edit --delete-branch-on-merge
    
    print_status "Repository settings configured"
}

# Check workflow status
check_workflows() {
    print_info "Checking workflow status..."
    
    # List recent workflow runs
    gh run list --limit 10 --json status,conclusion,name --jq '.[] | "\(.name): \(.status) (\(.conclusion // "running"))"'
    
    print_status "Workflow status checked"
}

# Security check
security_check() {
    print_info "Running security checks..."
    
    # Check for vulnerabilities in frontend
    if [ -d "ui" ]; then
        cd ui
        if npm audit --audit-level=moderate | grep -q "vulnerabilities"; then
            print_warning "Frontend has vulnerabilities"
            npm audit
        else
            print_status "Frontend security OK"
        fi
        cd ..
    fi
    
    # Check for Go vulnerabilities (if Go is available)
    if command -v go &> /dev/null && [ -d "backend" ]; then
        cd backend
        if command -v govulncheck &> /dev/null; then
            govulncheck ./...
        else
            print_info "govulncheck not available, skipping Go vulnerability check"
        fi
        cd ..
    fi
}

# Manage Dependabot PRs
manage_dependabot() {
    print_info "Checking Dependabot PRs..."
    
    dependabot_prs=$(gh pr list --author "app/dependabot" --json number --jq 'length')
    
    if [ "$dependabot_prs" -gt 0 ]; then
        print_warning "Found $dependabot_prs Dependabot PR(s)"
        print_info "Use ./scripts/merge-dependabot.sh to manage them"
    else
        print_status "No pending Dependabot PRs"
    fi
}

# Build and test
build_test() {
    print_info "Running build and tests..."
    
    # Frontend build
    if [ -d "ui" ]; then
        cd ui
        print_info "Building frontend..."
        npm ci && npm run build
        cd ..
        print_status "Frontend build OK"
    fi
    
    # Backend build (if Go available)
    if command -v go &> /dev/null && [ -d "backend" ]; then
        cd backend
        print_info "Building backend..."
        go mod tidy && go build -o ../build/service .
        cd ..
        print_status "Backend build OK"
    fi
    
    # Docker build test
    print_info "Testing Docker build..."
    docker build -t remote-docker:test . > /dev/null
    print_status "Docker build OK"
}

# Main menu
show_menu() {
    echo ""
    print_info "What would you like to do?"
    echo "1. Full setup (all tasks)"
    echo "2. Setup labels and repository settings"
    echo "3. Check workflows and security"
    echo "4. Manage Dependabot PRs"
    echo "5. Run build and tests"
    echo "6. Exit"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Choose an option (1-6): " choice
            
            case $choice in
                1)
                    setup_labels
                    setup_repository
                    check_workflows
                    security_check
                    manage_dependabot
                    build_test
                    print_status "Full setup completed!"
                    break
                    ;;
                2)
                    setup_labels
                    setup_repository
                    ;;
                3)
                    check_workflows
                    security_check
                    ;;
                4)
                    manage_dependabot
                    ;;
                5)
                    build_test
                    ;;
                6)
                    print_info "Goodbye!"
                    exit 0
                    ;;
                *)
                    print_error "Invalid option"
                    ;;
            esac
        done
    else
        # Command line mode
        case $1 in
            setup)
                setup_labels
                setup_repository
                ;;
            check)
                check_workflows
                security_check
                ;;
            dependabot)
                manage_dependabot
                ;;
            build)
                build_test
                ;;
            *)
                print_error "Unknown command: $1"
                print_info "Available commands: setup, check, dependabot, build"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"