# Remote Docker Extension Makefile

.PHONY: help build push install uninstall clean dev lint test

# Default target
help:
	@echo "Remote Docker Extension - Make targets:"
	@echo "  make build     - Build the Docker extension image"
	@echo "  make push      - Push image to Docker Hub"
	@echo "  make install   - Install extension in Docker Desktop"
	@echo "  make uninstall - Remove extension from Docker Desktop"
	@echo "  make dev       - Build and install for development"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make lint      - Run linters"
	@echo "  make test      - Run tests"

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
	docker extension install telkombe/remote-docker:latest

# Uninstall extension
uninstall:
	@echo "Uninstalling extension..."
	docker extension rm telkombe/remote-docker

# Development build and install
dev: build
	@echo "Installing development build..."
	-docker extension rm telkombe/remote-docker 2>/dev/null || true
	docker extension install telkombe/remote-docker

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@./scripts/clean.sh

# Run linters
lint:
	@echo "Running linters..."
	cd backend && go fmt ./... && go vet ./...
	cd ui && npm run lint

# Run tests
test:
	@echo "Running tests..."
	cd backend && go test ./...
	cd ui && npm test