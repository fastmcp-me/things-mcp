# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
npm run build          # Compile TypeScript to build/ directory
npm test              # Run Jest tests with ES module support
npm run dev           # Watch mode for development
npm start             # Run the MCP server
npm run inspector     # Launch MCP Inspector for testing tools
```

### Testing Commands
```bash
npm test -- --testNamePattern="URL Builder"  # Run specific test suite
npm test -- tests/server.test.ts             # Run specific test file
npm run test:watch                           # Watch mode for tests
```

## Architecture Overview

### MCP Server Design
This is a **Model Context Protocol (MCP) server** that integrates with Things.app on macOS via URL scheme automation. The architecture follows these key patterns:

**Core Flow:**
1. MCP tools receive structured parameters (validated with Zod schemas)
2. Tools convert parameters to Things URL scheme format via `url-builder.ts`
3. URLs are executed using macOS `open` command to trigger Things.app actions
4. All operations return MCP-compliant content responses

**Tool Registration Pattern:**
Each tool follows a consistent pattern in `src/tools/`:
- Export a `registerXxxTool(server: McpServer)` function
- Use Zod schemas for input validation with `.shape` property
- Call `server.tool(name, schema.shape, handler)` to register
- Return `{ content: [{ type: "text", text: "..." }] }` format

### Key Components

**URL Construction (`src/utils/url-builder.ts`):**
- `buildThingsUrl()`: Converts parameters to Things URL scheme
- `openThingsUrl()`: Executes URLs via macOS `open` command (async/await)
- Uses `URLSearchParams` for proper encoding (creates `+` for spaces, not `%20`)

**Authentication (`src/utils/auth.ts`):**
- Update operations require `THINGS_AUTH_TOKEN` environment variable
- Use `requireAuthToken()` for operations that modify existing items
- Token obtained from Things.app Preferences → General → Enable Things URLs

**Type System (`src/types/things.ts`):**
- Complete TypeScript definitions for Things URL scheme parameters
- Supports all Things commands: add, add-project, update, update-project, show, search, json
- Includes union types for schedule values (`WhenValue`) and show targets

### ES Module Configuration
- **Important**: Project uses ES modules (`"type": "module"` in package.json)
- All imports must use `.js` extensions for TypeScript files
- Jest requires `--experimental-vm-modules` flag
- Use `import` statements, never `require()`

### Tool Categories
1. **Creation Tools** (`add_todo`, `add_project`): No auth required
2. **Update Tools** (`update_todo`, `update_project`): Require auth token
3. **Navigation Tools** (`show`, `search`): No auth required  
4. **Bulk Tools** (`json_import`): No auth required, accepts complex JSON structures

### Testing Strategy
- Unit tests for URL building and encoding logic
- Integration tests for tool registration
- ES module compatibility with Jest requires specific configuration
- Mock macOS-specific functionality when needed

### macOS Integration
- Only works on macOS (Things.app requirement)
- Uses `child_process.exec` with `open` command
- Validates `process.platform === 'darwin'`
- Things URL scheme handles all actual data manipulation