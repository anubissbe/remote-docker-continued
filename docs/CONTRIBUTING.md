# Contributing Guide

Thank you for your interest in contributing to Remote Docker Extension! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](../CODE_OF_CONDUCT.md). Please read it before contributing.

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/telkombe/remote-docker/issues) to avoid duplicates
2. Use the bug report template
3. Include:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Docker version, etc.)
   - Logs if applicable

### Suggesting Features

1. Check the [discussions](https://github.com/telkombe/remote-docker/discussions) for existing proposals
2. Create a new discussion with:
   - Clear use case
   - Proposed solution
   - Alternative approaches considered

### Contributing Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Submit a pull request

## Development Setup

### Prerequisites

- Docker Desktop 4.34.0 or later
- Go 1.21 or later
- Node.js 18 or later
- Make

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/remote-docker.git
cd remote-docker

# Install dependencies
make setup

# Build for development
make dev
```

### Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   go run main.go
   ```

2. **Frontend Development**
   ```bash
   cd ui
   npm run dev
   ```

3. **Full Extension**
   ```bash
   make dev
   ```

## Code Style

### Go Code

We use `golangci-lint` with a comprehensive configuration:

```bash
# Format code
cd backend && go fmt ./...

# Run linters
cd backend && golangci-lint run
```

Key conventions:
- Use meaningful variable names
- Add comments for exported functions
- Handle all errors explicitly
- Use table-driven tests

### TypeScript/React Code

We use ESLint and Prettier:

```bash
# Format code
cd ui && npm run format

# Run linters
cd ui && npm run lint
```

Key conventions:
- Use functional components with hooks
- Proper TypeScript types (avoid `any`)
- Follow React best practices
- Use Material-UI components consistently

## Testing

### Running Tests

```bash
# All tests
make test

# Backend only
cd backend && go test -v ./...

# Frontend only
cd ui && npm test

# With coverage
make test-coverage
```

### Writing Tests

#### Backend Tests
```go
func TestFeatureName(t *testing.T) {
    t.Run("should do something", func(t *testing.T) {
        // Test implementation
    })
}
```

#### Frontend Tests
```typescript
describe('Component', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

### Test Requirements

- New features must include tests
- Bug fixes should include regression tests
- Maintain >80% code coverage
- All tests must pass before merging

## Pull Request Process

1. **Before Submitting**
   - Run `make check` to ensure quality
   - Update documentation if needed
   - Add changelog entry if applicable

2. **PR Requirements**
   - Clear title and description
   - Reference related issues
   - Pass all CI checks
   - Have at least one approval

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] Tests added/updated
   ```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

### Examples
```bash
feat(mcp): add support for custom MCP servers
fix(ssh): resolve connection timeout issue
docs(api): update endpoint documentation
```

### Commit Best Practices
- Use present tense ("add" not "added")
- Keep subject line under 50 characters
- Reference issues in footer
- Explain the "why" in the body

## Questions?

- Join our [Discussions](https://github.com/telkombe/remote-docker/discussions)
- Reach out on [Discord](https://discord.gg/remote-docker)
- Email: support@remote-docker.dev

Thank you for contributing! 🎉