# Contributing to Remote Docker

First off, thank you for considering contributing to Remote Docker! It's people like you that make Remote Docker such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible
- Include your Docker Desktop version and OS

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing code style
6. Issue that pull request!

## Development Process

1. **Setup Development Environment**
   ```bash
   git clone https://github.com/telkombe/remote-docker.git
   cd remote-docker
   ./scripts/dev-setup.sh
   ```

2. **Make Changes**
   - Backend changes: `backend/` directory
   - Frontend changes: `ui/` directory
   - Documentation: `docs/` directory

3. **Test Your Changes**
   ```bash
   # Run backend tests
   cd backend && go test ./...
   
   # Run frontend tests
   cd ui && npm test
   
   # Build and test locally
   ./scripts/build.sh
   docker extension install telkombe/remote-docker
   ```

4. **Submit Pull Request**
   - Ensure all tests pass
   - Update documentation if needed
   - Add a clear description of changes

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Go Style Guide

- Follow the [Effective Go](https://golang.org/doc/effective_go.html) guidelines
- Use `gofmt` to format your code
- Use meaningful variable names
- Add comments for exported functions

### TypeScript/React Style Guide

- Use TypeScript for all new code
- Follow the existing code style
- Use functional components with hooks
- Use Material-UI components consistently
- Add proper type definitions

## Additional Notes

### Issue and Pull Request Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed

Thank you for contributing!