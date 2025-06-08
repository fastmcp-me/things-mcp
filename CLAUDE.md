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

## Memories

- Do not run npm run inspector on your own
- github repo is https://github.com/BMPixel/things-mcp

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
- Uses `encodeURIComponent()` for proper percent encoding (spaces become `%20`)

**Authentication (`src/utils/auth.ts`):**
- Update operations require `THINGS_AUTH_TOKEN` environment variable
- Use `requireAuthToken()` for operations that modify existing items
- Token obtained from Things.app Preferences → General → Enable Things URLs

**Type System (`src/types/things.ts`):**
- Complete TypeScript definitions for Things URL scheme parameters
- Supports core Things commands: add, add-project, update, update-project
- Includes union types for schedule values (`WhenValue`) and parameter types

**AppleScript Integration (`src/utils/applescript.ts`):**
- `executeAppleScript()`: Executes AppleScript commands via `osascript`
- Data access functions: `listTodos()`, `listProjects()`, `listAreas()`, `listTags()`
- Filtering support for status, dates, projects, areas, and tags

**JSON Operations (`src/utils/json-operations.ts`):**
- `executeJsonOperation()`: Executes JSON-based operations (primarily for completion/cancellation)
- `waitForOperation()`: Utility for waiting before verification
- Handles proper JSON encoding for Things URL scheme

**Verification (`src/utils/verification.ts`):**
- `verifyItemExists()`: Check if item exists in database after operation
- `verifyItemCompleted()`: Verify item completion status
- `verifyItemUpdated()`: Verify item updates with expected values
- Direct SQLite database access for real-time verification

### ES Module Configuration
- **Important**: Project uses ES modules (`"type": "module"` in package.json)
- All imports must use `.js` extensions for TypeScript files
- Jest requires `--experimental-vm-modules` flag
- Use `import` statements, never `require()`

### Tool Categories
1. **Creation Tools** (`add_todo`, `add_project`): No auth required, use URL scheme with JSON schemas
   - Direct parameter structure with validation and descriptions
   - Array fields (tags, checklist-items, initial-todos) converted to comma-separated strings for URL scheme
   - Field validation with max lengths, regex patterns, and enum constraints
2. **Update Tools** (`update_todo`, `update_project`): Require auth token, use hybrid approach
   - **JSON Operations**: Completion/cancellation operations use JSON format for reliability
   - **URL Scheme**: Other updates (title, notes, tags, etc.) use URL scheme for compatibility
   - Array fields (tags, checklist-items) converted to comma-separated strings for URL scheme
   - Support for append/prepend operations on notes and checklist items
   - Field validation with max lengths, regex patterns, and enum constraints
3. **Summary Tool** (`things_summary`): Primary data access tool - Direct database access
   - Returns formatted Markdown or structured JSON for tasks, projects, areas, and tags
   - Advanced filtering by areas, tags, projects, date ranges, and completion status
   - Direct SQLite database access with proper bit-packed date conversion
4. **Export Tool** (`export_json`): Database export tool
   - Exports entire Things database as structured JSON for debugging, backup, or data processing
   - Includes all relationships, metadata, and raw database structures
   - Options for including completed/trashed items and minimal vs. full data export

### Testing Strategy
- Unit tests for URL building and encoding logic (`url-builder.test.ts`)
- Integration tests for tool registration (`server.test.ts`)
- Full integration tests for Things URL scheme operations (`integration.test.ts`)
- **Verification Testing**: Tests include database verification for completion operations
- Platform detection - tests skip on non-macOS systems
- ES module compatibility with Jest requires specific configuration
- Create → Update → Complete lifecycle pattern for comprehensive testing

### macOS Integration
- Only works on macOS (Things.app requirement)
- Uses `child_process.exec` with `open` command for URL schemes
- Uses `sqlite3` command for direct database access in summary tool
- Validates `process.platform === 'darwin'`
- URL scheme for create/update operations, direct database access for comprehensive summaries

### Tool Descriptions
All tools follow MCP best practices with:
- Direct, action-oriented descriptions
- Clear parameter explanations
- Specific format requirements (ISO dates, array values)
- JSON schema compliance for all creation and update operations

### Date Handling
- **Creation Date**: Unix epoch format (seconds since 1970)
- **Start Date/Deadline**: Things bit-packed format requiring bitwise extraction
- Uses Things.py approach for proper date conversion with year/month/day masks
```