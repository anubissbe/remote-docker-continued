# Testing Guide

## Overview

This directory contains all tests for the Remote Docker Extension project. Tests are organized into three categories:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between different parts of the system
- **E2E Tests**: Test complete user workflows through the entire application

## Directory Structure

```
tests/
├── unit/           # Unit tests
│   ├── backend/    # Go backend unit tests
│   └── frontend/   # React component unit tests
├── integration/    # Integration tests
│   ├── api/        # API integration tests
│   └── mcp/        # MCP server integration tests
└── e2e/            # End-to-end tests
    └── scenarios/  # User scenario tests
```

## Running Tests

### All Tests
```bash
make test
```

### Backend Unit Tests
```bash
cd backend && go test ./...
```

### Frontend Unit Tests
```bash
cd ui && npm test
```

### Integration Tests
```bash
cd tests/integration && go test ./...
```

### E2E Tests
```bash
cd tests/e2e && npm test
```

## Writing Tests

### Backend Tests (Go)

Use the standard Go testing package:

```go
func TestFunctionName(t *testing.T) {
    // Arrange
    expected := "expected result"
    
    // Act
    result := FunctionToTest()
    
    // Assert
    if result != expected {
        t.Errorf("Expected %s, got %s", expected, result)
    }
}
```

### Frontend Tests (React/TypeScript)

Use Jest and React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test API endpoints and service interactions:

```go
func TestAPIEndpoint(t *testing.T) {
    // Setup test server
    e := echo.New()
    setupRoutes(e)
    
    // Make request
    req := httptest.NewRequest(http.MethodGet, "/api/endpoint", nil)
    rec := httptest.NewRecorder()
    e.ServeHTTP(rec, req)
    
    // Verify response
    assert.Equal(t, http.StatusOK, rec.Code)
}
```

## Test Coverage

We aim for:
- **80%** overall code coverage
- **90%** coverage for critical paths
- **100%** coverage for security-related code

Generate coverage reports:

```bash
# Backend coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Frontend coverage
npm run test:coverage
```

## CI/CD Integration

All tests run automatically on:
- Pull request creation
- Push to main branch
- Release tag creation

See `.github/workflows/test.yml` for CI configuration.

## Test Data

Test fixtures and mock data are stored in:
- `tests/fixtures/` - Static test data
- `tests/mocks/` - Mock implementations

## Best Practices

1. **Test Names**: Use descriptive names that explain what is being tested
2. **Isolation**: Each test should be independent and not rely on others
3. **Cleanup**: Always clean up resources (files, connections, etc.)
4. **Assertions**: Use clear, specific assertions
5. **Mocking**: Mock external dependencies (SSH, Docker API, etc.)
6. **Performance**: Keep tests fast (< 1 second for unit tests)

## Debugging Tests

### Verbose Output
```bash
go test -v ./...
npm test -- --verbose
```

### Run Single Test
```bash
go test -run TestSpecificFunction
npm test ComponentName.test.tsx
```

### Debug Mode
```bash
DEBUG=true go test ./...
npm test -- --detectOpenHandles
```