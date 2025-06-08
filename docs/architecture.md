# Architecture Overview

Technical architecture and design patterns of the Things MCP Server.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │    │   MCP Server    │    │   Things.app    │
│  (Claude, etc.) │◄──►│  (This Project) │◄──►│    (macOS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Things Database │
                       │   (SQLite)      │
                       └─────────────────┘
```

## Core Components

### MCP Server Layer

**Purpose**: Model Context Protocol server that bridges AI assistants with Things.app

**Technologies**:
- TypeScript with ES modules
- `@modelcontextprotocol/sdk` for MCP compliance
- Zod for runtime schema validation
- Node.js child processes for system integration

**Key Files**:
- `src/index.ts` - Server initialization and tool registration
- `src/tools/` - Individual MCP tool implementations

### Things.app Integration Layer

**Purpose**: Interfaces with Things.app using multiple interaction methods

**Methods**:
1. **URL Scheme** (Primary) - For create and update operations
2. **Direct Database Access** - For read operations and verification
3. **JSON Operations** - For reliable completion/cancellation

**Key Files**:
- `src/utils/url-builder.ts` - URL scheme construction
- `src/utils/applescript.ts` - AppleScript execution
- `src/utils/json-operations.ts` - JSON-based operations

### Data Layer

**Purpose**: Type-safe data structures and validation

**Components**:
- TypeScript type definitions (`src/types/things.ts`)
- Zod schemas for runtime validation
- Data transformation utilities

## Design Patterns

### Tool Registration Pattern

Each MCP tool follows a standardized registration pattern:

```typescript
export function registerXxxTool(server: McpServer): void {
  server.tool(
    'tool_name',
    'Description for AI assistants',
    zodSchema.shape,  // Schema with .shape property
    async (params) => {
      // Tool implementation
      return { content: [{ type: "text", text: "Result" }] };
    }
  );
}
```

**Benefits**:
- Consistent API surface
- Automatic parameter validation
- Standardized error handling
- MCP compliance guarantee

### Hybrid Operation Strategy

Different operations use the most appropriate method:

```typescript
// Creation: URL Scheme (fast, reliable)
const url = buildThingsUrl('add', params);
await openThingsUrl(url);

// Reading: Direct Database (comprehensive, fast)
const data = executeSqlQuery(dbPath, query);

// Completion: JSON Operation (reliable state changes)
await executeJsonOperation('complete', { id });
```

**Rationale**:
- URL scheme for immediate operations
- Database access for complex queries
- JSON operations for state changes requiring verification

### ES Module Architecture

```typescript
// All imports use .js extensions for TypeScript files
import { buildThingsUrl } from '../utils/url-builder.js';
import type { ThingsTask } from '../types/things.js';

// Package.json: "type": "module"
// Jest: --experimental-vm-modules flag
```

**Benefits**:
- Modern JavaScript standards
- Better tree-shaking
- Native Node.js ESM support
- Future-proof architecture

## Data Flow

### Creation Flow

```
AI Request → Zod Validation → URL Building → Things.app → Response
```

1. **AI Assistant** sends structured request
2. **MCP Server** validates with Zod schema
3. **URL Builder** constructs Things URL scheme
4. **macOS** opens URL in Things.app
5. **Things.app** creates item
6. **Response** confirms creation

### Query Flow

```
AI Request → Database Access → Data Processing → Formatted Response
```

1. **AI Assistant** requests data summary
2. **MCP Server** locates Things database
3. **SQLite Query** extracts relevant data
4. **Data Processor** formats and filters results
5. **Response** returns Markdown or JSON

### Update Flow

```
AI Request → Auth Check → Operation Routing → Verification → Response
```

1. **AI Assistant** requests update
2. **Auth Module** validates token
3. **Router** chooses JSON or URL operation
4. **Verification** confirms database state
5. **Response** confirms update

## Security Architecture

### Authentication Model

```typescript
// Update operations require auth token
export function requireAuthToken(): string {
  const token = process.env.THINGS_AUTH_TOKEN;
  if (!token) {
    throw new Error('THINGS_AUTH_TOKEN required for updates');
  }
  return token;
}
```

**Security Layers**:
1. **Environment Variable** storage for tokens
2. **Operation-level** authorization checks
3. **Things.app** built-in URL scheme validation
4. **No persistent** credential storage

### Data Access Security

- **Read-only** database access for queries
- **No credential** exposure in responses
- **Local-only** operations (no network calls)
- **macOS sandbox** compatibility

## Performance Architecture

### Database Access Optimization

```typescript
// Efficient SQLite queries with proper indexing
const query = `
  SELECT uuid, title, notes, type, area, project
  FROM TMTask 
  WHERE status = 0 AND trashed = 0
  ORDER BY creationDate DESC
`;
```

**Optimizations**:
- Direct SQLite access bypasses AppleScript overhead
- Filtered queries reduce data transfer
- Bit-packed date handling for Things format
- Minimal object creation in hot paths

### URL Scheme Efficiency

```typescript
// Batch operations where possible
const url = buildThingsUrl('add', {
  title: 'Task',
  'checklist-items': items.join(','), // Single URL call
  tags: tags.join(',')
});
```

**Benefits**:
- Single URL call per operation
- Proper percent encoding for reliability
- Minimal subprocess overhead
- Asynchronous execution

### Memory Management

- **Streaming** SQLite results for large datasets
- **Compressed objects** removing empty properties
- **Lazy loading** of database connections
- **Garbage collection** friendly patterns

## Error Handling Architecture

### Layered Error Strategy

```typescript
// Tool level: User-friendly messages
catch (error) {
  logger.error('Failed to add task', { error: error.message });
  throw new Error(`Could not create task: ${error.message}`);
}

// Utility level: Technical details
catch (error) {
  logger.debug('SQLite query failed', { query, error });
  return [];
}
```

**Error Layers**:
1. **Tool Level** - User-facing error messages
2. **Utility Level** - Technical error details
3. **System Level** - Platform compatibility checks
4. **Validation Level** - Schema validation errors

### Platform Compatibility

```typescript
// Graceful handling of non-macOS platforms
if (process.platform !== 'darwin') {
  throw new Error('Things.app integration requires macOS');
}
```

## Extensibility Architecture

### Plugin Pattern for New Tools

```typescript
// New tool follows same pattern
export function registerNewTool(server: McpServer): void {
  server.tool(name, description, schema.shape, handler);
}

// Registration in index.ts
registerNewTool(server);
```

### Schema Evolution

```typescript
// Zod schemas allow safe evolution
const schema = z.object({
  // Existing fields
  title: z.string(),
  // New optional fields for backward compatibility
  priority: z.enum(['high', 'medium', 'low']).optional(),
});
```

### Configuration Architecture

```typescript
// Environment-based configuration
const config = {
  logLevel: process.env.LOG_LEVEL || 'info',
  authToken: process.env.THINGS_AUTH_TOKEN,
  dbPath: findThingsDatabase()
};
```

## Testing Architecture

### Test Strategy Layers

1. **Unit Tests** - Core logic and utilities
2. **Integration Tests** - Full MCP tool workflows  
3. **Platform Tests** - macOS-specific functionality
4. **Verification Tests** - Database state validation

### Test Infrastructure

```typescript
// Platform detection for test skipping
beforeEach(() => {
  if (process.platform !== 'darwin') {
    test.skip('macOS-only functionality');
  }
});

// Database verification pattern
await addTask(params);
const verified = await verifyItemExists(taskId);
expect(verified).toBe(true);
```

## Deployment Architecture

### Distribution Model

- **npm Package** for easy installation
- **npx Execution** for zero-install usage
- **Global Installation** for permanent setup
- **Local Development** with source code

### Runtime Requirements

- **Node.js** 18+ for ES modules
- **macOS** for Things.app integration
- **Things.app** 3.0+ for URL scheme support
- **MCP Client** for AI assistant integration

## Future Architecture Considerations

### Scalability

- **Connection pooling** for multiple MCP clients
- **Caching layer** for frequently accessed data
- **Background sync** for offline operations
- **Event-driven** updates for real-time data

### Cross-Platform

- **Abstract interfaces** for future platform support
- **Plugin architecture** for different task managers
- **Protocol abstraction** beyond Things.app URL scheme
- **Universal data** formats for portability