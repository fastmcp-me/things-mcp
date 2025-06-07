# Test Suite

Core test suite for the Things MCP Server.

## Running Tests

```bash
npm test
```

## Test Files

- `server.test.ts` - Basic server functionality and tool registration
- `url-builder.test.ts` - URL construction and parameter encoding

## Requirements

- Node.js 20+
- Jest test framework
- macOS (for full functionality)

## Note

These tests focus on core functionality and do not require Things.app to be running. For integration testing with actual Things.app functionality, use the MCP Inspector tool:

```bash
npm run inspector
```