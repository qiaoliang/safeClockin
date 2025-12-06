# Frontend Testing Guide

This guide explains how to run tests for the SafeGuard frontend application.

## Test Structure

```
frontend/
├── test/
│   ├── setup.js                 # Test setup and mocks
│   ├── token-missing-bug.test.js # Unit tests for token validation
│   └── integration/
│       └── api-token-validation.test.js # Integration tests
├── vitest.config.js             # Vitest configuration
└── package.json                 # Test scripts and dependencies
```

## Running Tests Locally

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Test Commands

```bash
# Run all tests in watch mode
npm run test

# Run tests once (for CI/CD)
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Test Types

### Unit Tests
- Test individual functions and components in isolation
- Mock all external dependencies
- Fast execution
- Located in `test/` directory

### Integration Tests
- Test API interactions and data flow
- Use mock servers for backend simulation
- Verify end-to-end functionality
- Located in `test/integration/` directory

## CI/CD Pipeline

The tests run automatically on GitHub Actions when:

- Pushing to main/master/develop branches
- Creating pull requests to main/master/develop branches

### Pipeline Stages

1. **Unit Tests** - Runs on Node.js 18.x and 20.x
2. **Integration Tests** - Tests against mock backend
3. **Security Scan** - Checks for vulnerabilities

### Coverage Reports

Coverage reports are generated and uploaded to Codecov for tracking test coverage over time.

## Writing New Tests

### Test File Naming

- Unit tests: `*.test.js`
- Integration tests: `integration/*.test.js`

### Test Structure

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { yourFunction } from '../path/to/module'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should do something specific', async () => {
    // Arrange
    const input = 'test input'
    
    // Act
    const result = await yourFunction(input)
    
    // Assert
    expect(result).toBe('expected output')
  })
})
```

### Mocking uni-app APIs

The test setup automatically mocks uni-app APIs. You can customize mock behavior in your tests:

```javascript
// Mock specific API behavior
global.uni.getStorageSync.mockReturnValue('mock-token')
global.uni.showModal.mockImplementation(({ success }) => {
  success({ confirm: true })
})
```

## Debugging Tests

### Running in Debug Mode

```bash
# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/vitest run

# Or use VS Code debugging with launch configuration
```

### Test Logs

- Use `console.log` for debugging
- Vitest provides detailed error messages
- Use `--reporter=verbose` for more detailed output

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **AAA Pattern**: Arrange, Act, Assert structure for tests
3. **Mocking**: Mock external dependencies to ensure isolated testing
4. **Coverage**: Aim for high test coverage but focus on critical paths
5. **Integration**: Test both unit and integration scenarios

## Troubleshooting

### Common Issues

1. **"uni is not defined"**: Ensure test setup file is loaded
2. **Module resolution errors**: Check vitest.config.js alias configuration
3. **Mock not working**: Clear mocks in beforeEach or use vi.clearAllMocks()

### Getting Help

- Check Vitest documentation: https://vitest.dev/
- Review existing test files for examples
- Use `--reporter=verbose` for detailed error information