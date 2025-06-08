# Development Guide

Guide for developers working on the Things MCP Server, including setup, testing, and contribution workflows.

## Prerequisites

- **macOS**: Required for Things.app integration and testing
- **Node.js**: Version 18 or later
- **Things.app**: Version 3.0+ for testing integration
- **Git**: For version control

## Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/BMPixel/things-mcp.git
cd things-mcp
npm install
```

### 2. Configure Things.app

1. Open Things.app and enable URL scheme support:
   - **Things → Preferences → General**
   - Check **"Enable Things URLs"**
   - Copy the authorization token

2. Set up environment variables:
   ```bash
   export THINGS_AUTH_TOKEN="your-token-here"
   ```

### 3. Build the Project

```bash
npm run build
```

## Development Commands

### Build and Development
```bash
npm run build          # Compile TypeScript to build/ directory
npm run dev            # Watch mode for development
npm start              # Run the MCP server
```

### Testing
```bash
npm test               # Run Jest tests with ES module support
npm run test:watch     # Watch mode for tests
npm test -- --testNamePattern="URL Builder"  # Run specific test suite
npm test -- tests/server.test.ts             # Run specific test file
```

### Code Quality
```bash
npm run lint           # Check code with ESLint
npm run lint:fix       # Fix linting issues automatically
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

### MCP Testing
```bash
npm run inspector      # Launch MCP Inspector for tool testing
```

**Note**: Do not run `npm run inspector` in CI or automated environments.

## Project Structure

```
src/
├── index.ts           # MCP server entry point
├── tools/             # MCP tool implementations
│   ├── add-todo.ts    # Task creation tool
│   ├── add-project.ts # Project creation tool
│   ├── update-todo.ts # Task update tool
│   ├── update-project.ts # Project update tool
│   ├── things-summary.ts # Database query tool
│   └── export-json.ts # Database export tool
├── types/             # TypeScript type definitions
│   └── things.ts      # Things URL scheme types
└── utils/             # Utility modules
    ├── applescript.ts # AppleScript integration
    ├── auth.ts        # Authorization handling
    ├── encoder.ts     # URL encoding utilities
    ├── json-operations.ts # JSON-based operations
    ├── logger.ts      # Logging utilities
    ├── url-builder.ts # Things URL construction
    └── verification.ts # Operation verification

tests/
├── integration.test.ts # Full workflow tests
├── server.test.ts     # Tool registration tests
└── url-builder.test.ts # URL building tests
```

## Architecture Patterns

### Tool Registration Pattern

Each tool follows a consistent registration pattern:

```typescript
// src/tools/example-tool.ts
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const exampleSchema = z.object({
  // Define parameters with validation and descriptions
});

export function registerExampleTool(server: McpServer): void {
  server.tool(
    'tool_name',
    'Tool description for AI assistants',
    exampleSchema.shape, // Use .shape for proper schema registration
    async (params) => {
      // Tool implementation
      return {
        content: [{
          type: "text",
          text: "Result message"
        }]
      };
    }
  );
}
```

### URL Construction Pattern

All Things.app interactions use the URL scheme:

```typescript
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';

// Build URL with parameters
const url = buildThingsUrl('add', {
  title: 'Task title',
  when: 'today'
});

// Execute URL
await openThingsUrl(url);
```

### ES Module Configuration

This project uses ES modules with specific requirements:

- All imports must use `.js` extensions for TypeScript files
- `package.json` has `"type": "module"`
- Jest requires `--experimental-vm-modules` flag
- Use `import` statements, never `require()`

## Testing Strategy

### Unit Tests

Focus on core logic and URL building:

```bash
npm test -- tests/url-builder.test.ts
```

### Integration Tests

Test full MCP tool workflows:

```bash
npm test -- tests/integration.test.ts
```

### Platform Detection

Tests automatically skip on non-macOS platforms:

```typescript
beforeEach(() => {
  if (process.platform !== 'darwin') {
    test.skip('macOS-only test');
  }
});
```

### Test Patterns

1. **Create → Update → Complete**: Test full task lifecycle
2. **Database Verification**: Verify operations using SQLite queries
3. **Error Handling**: Test invalid inputs and error responses
4. **Platform Compatibility**: Ensure graceful handling on non-macOS

## Code Standards

### TypeScript

- Strict TypeScript configuration
- Comprehensive type definitions in `src/types/`
- Use Zod schemas for runtime validation

### Code Style

- ESLint configuration enforces consistency
- Prettier for automatic formatting
- Pre-commit hooks ensure quality

### Documentation

- JSDoc comments for public APIs
- Clear parameter descriptions in Zod schemas
- Comprehensive error messages

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-tool

# Develop with watch mode
npm run dev

# Test during development
npm run test:watch
```

### 2. Testing

```bash
# Run all tests
npm test

# Test specific functionality
npm test -- --testNamePattern="add_todo"

# Integration testing with MCP Inspector
npm run inspector
```

### 3. Code Quality

```bash
# Check and fix code quality
npm run lint:fix
npm run format

# Verify build
npm run build
```

### 4. Commit and Push

```bash
# Commits trigger pre-commit hooks
git add .
git commit -m "feat: add new tool functionality"
git push origin feature/new-tool
```

## Debugging

### MCP Inspector

The MCP Inspector provides a web interface for testing tools:

```bash
npm run inspector
```

Access at `http://localhost:3000` to:
- Test tool parameters
- View responses
- Debug tool behavior

### Logging

The project uses structured logging:

```typescript
import { logger } from '../utils/logger.js';

logger.info('Operation started', { tool: 'add_todo', params });
logger.error('Operation failed', { error: error.message });
```

### Database Debugging

Direct SQLite access for debugging:

```bash
# Find Things database
ls ~/Library/Group\ Containers/*/ThingsData-*/Things\ Database.thingsdatabase/

# Query database
sqlite3 "path/to/main.sqlite" "SELECT * FROM TMTask LIMIT 5;"
```

## Common Development Tasks

### Adding a New Tool

1. Create tool file in `src/tools/`
2. Define Zod schema with descriptions
3. Implement tool logic
4. Register in `src/index.ts`
5. Add tests
6. Update documentation

### Updating Types

1. Modify `src/types/things.ts`
2. Update affected tools
3. Run tests to verify compatibility
4. Update API documentation

### Performance Optimization

1. Profile using Node.js built-in profiler
2. Optimize database queries in summary tool
3. Minimize URL scheme calls
4. Use efficient JSON operations

## Contribution Guidelines

### Before Contributing

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Check existing issues and PRs
3. Discuss major changes in GitHub issues

### Pull Request Process

1. Ensure all tests pass
2. Add tests for new functionality
3. Update documentation
4. Follow commit message conventions
5. Request review from maintainers

### Release Process

The project uses semantic versioning with automated releases:

1. Commits to `main` trigger CI/CD
2. Semantic commit messages determine version bumps
3. Releases are automatically published to npm

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `THINGS_AUTH_TOKEN` | Authorization token from Things.app | For update operations |
| `NODE_ENV` | Environment: `development`, `production`, `test` | No |
| `LOG_LEVEL` | Logging level: `debug`, `info`, `warn`, `error` | No |

## Troubleshooting

### Common Issues

**Build Errors**: Ensure TypeScript and dependencies are up to date
**Test Failures**: Check macOS version and Things.app installation
**Permission Errors**: Verify Things URL authorization is enabled

### Getting Help

- Check [troubleshooting guide](troubleshooting.md)
- Review existing [GitHub issues](https://github.com/BMPixel/things-mcp/issues)
- Create new issue with detailed reproduction steps