# Remote Docker Extension Makefile

.PHONY: help build push install uninstall clean dev lint test format check setup

# Default target
help:
	@echo "Remote Docker Extension - Make targets:"
	@echo ""
	@echo "Development:"
	@echo "  make setup     - Install all development dependencies"
	@echo "  make dev       - Build and install for development"
	@echo "  make build     - Build the Docker extension image"
	@echo "  make clean     - Clean build artifacts"
	@echo ""
	@echo "Quality:"
	@echo "  make lint      - Run all linters"
	@echo "  make format    - Auto-format code"
	@echo "  make test      - Run all tests"
	@echo "  make check     - Run lint, format check, and tests"
	@echo ""
	@echo "Deployment:"
	@echo "  make install   - Install extension in Docker Desktop"
	@echo "  make uninstall - Remove extension from Docker Desktop"
	@echo "  make push      - Push image to Docker Hub"

# Build the extension
build:
	@echo "Building Remote Docker extension..."
	@./scripts/build.sh

# Push to Docker Hub
push:
	@echo "Pushing to Docker Hub..."
	@./scripts/deploy.sh

# Install extension
install:
	@echo "Installing extension..."
	docker extension install anubissbe/remote-docker:latest

# Uninstall extension
uninstall:
	@echo "Uninstalling extension..."
	docker extension rm anubissbe/remote-docker

# Development build and install
dev: build
	@echo "Installing development build..."
	-docker extension rm anubissbe/remote-docker 2>/dev/null || true
	docker extension install anubissbe/remote-docker

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@./scripts/clean.sh

# Setup development environment
setup:
	@echo "Setting up development environment..."
	@./scripts/dev-setup.sh
	@echo "Installing additional development tools..."
	@command -v golangci-lint >/dev/null 2>&1 || curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin

# Run linters
lint:
	@echo "Running linters..."
	@echo "→ Go linting..."
	cd backend && golangci-lint run
	@echo "→ TypeScript linting..."
	cd ui && npm run lint

# Format code
format:
	@echo "Formatting code..."
	@echo "→ Go formatting..."
	cd backend && go fmt ./...
	@echo "→ TypeScript/React formatting..."
	cd ui && npm run format

# Run tests
test:
	@echo "Running tests..."
	@echo "→ Backend tests..."
	cd backend && go test -v -race -coverprofile=coverage.out ./...
	@echo "→ Frontend tests..."
	cd ui && npm test -- --coverage --watchAll=false
	@echo "→ Integration tests..."
	cd tests/integration && go test -v ./...

# Run all checks
check: lint test
	@echo "All checks passed! ✅"