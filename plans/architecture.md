# Things MCP Server Architecture

## Overview

This document outlines the architecture for a TypeScript-based Model Context Protocol (MCP) server that integrates with Things.app on macOS using the Things URL scheme.

## System Architecture

### Core Components

1. **MCP Server Core**
   - Built using `@modelcontextprotocol/sdk`
   - TypeScript for type safety and better developer experience
   - Stdio transport for local integration

2. **Things URL Handler**
   - Converts MCP tool calls to Things URL scheme commands
   - Handles URL encoding and parameter formatting
   - Manages authentication tokens

3. **Tool Implementations**
   - Each Things command exposed as an MCP tool
   - Input validation using Zod schemas
   - Error handling for invalid operations

### Directory Structure

```
things-mcp/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/                # Tool implementations
│   │   ├── add-todo.ts       # Add to-do tool
│   │   ├── add-project.ts    # Add project tool
│   │   ├── update-todo.ts    # Update to-do tool
│   │   ├── update-project.ts # Update project tool
│   │   ├── show.ts           # Show/navigate tool
│   │   ├── search.ts         # Search tool
│   │   └── json-import.ts    # Advanced JSON import tool
│   ├── utils/
│   │   ├── url-builder.ts    # Things URL construction
│   │   ├── encoder.ts        # Parameter encoding utilities
│   │   ├── auth.ts           # Authentication token management
│   │   └── logger.ts         # Logging utilities
│   └── types/
│       └── things.ts         # TypeScript type definitions
├── tests/                    # Test files
├── build/                    # Compiled output
├── .env                      # Environment variables (auth token)
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

## Tool Specifications

### 1. Add To-Do Tool
- **Name**: `add_todo`
- **Description**: Create a new to-do in Things
- **Parameters**:
  - `title` (required): To-do title
  - `notes` (optional): Additional notes
  - `when` (optional): Schedule date
  - `deadline` (optional): Deadline date
  - `tags` (optional): Comma-separated tags
  - `checklist_items` (optional): Checklist items
  - `list` (optional): Target list/project

### 2. Add Project Tool
- **Name**: `add_project`
- **Description**: Create a new project in Things
- **Parameters**:
  - `title` (required): Project title
  - `notes` (optional): Project notes
  - `when` (optional): Schedule date
  - `deadline` (optional): Project deadline
  - `tags` (optional): Comma-separated tags
  - `area` (optional): Parent area
  - `todos` (optional): Initial to-dos (JSON format)

### 3. Update To-Do Tool
- **Name**: `update_todo`
- **Description**: Update an existing to-do
- **Parameters**:
  - `id` (required): To-do ID
  - `title` (optional): New title
  - `notes` (optional): New notes
  - `when` (optional): New schedule date
  - `completed` (optional): Mark as completed
  - Other update parameters...

### 4. Update Project Tool
- **Name**: `update_project`
- **Description**: Update an existing project
- **Parameters**: Similar to update_todo but for projects

### 5. Show Tool
- **Name**: `show`
- **Description**: Navigate to specific items or views
- **Parameters**:
  - `id` (optional): Item ID or built-in list name
  - `query` (optional): Filter query

### 6. Search Tool
- **Name**: `search`
- **Description**: Search for items in Things
- **Parameters**:
  - `query` (optional): Search query

### 7. JSON Import Tool
- **Name**: `json_import`
- **Description**: Advanced import using JSON format
- **Parameters**:
  - `data` (required): JSON structure with items to import
  - `reveal` (optional): Whether to reveal imported items

## Technical Implementation Details

### URL Construction
```typescript
// Example URL builder function
function buildThingsUrl(command: string, params: Record<string, any>): string {
  const baseUrl = `things:///${command}`;
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, encodeValue(value));
    }
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
}
```

### Authentication
- Auth token stored in environment variable: `THINGS_AUTH_TOKEN`
- Required for update operations
- Can be obtained from Things app settings

### Error Handling
- Invalid parameter validation
- Missing required fields
- Authentication failures
- URL scheme execution errors

### Logging
- All operations logged to stderr (MCP convention)
- Debug mode for detailed operation traces
- Error logging with context

## Security Considerations

1. **Authentication Token Protection**
   - Store auth token in environment variables
   - Never log or expose auth tokens
   - Validate token presence before update operations

2. **Input Validation**
   - Strict parameter validation using Zod
   - Prevent injection attacks through proper encoding
   - Validate date formats and other structured data

3. **URL Encoding**
   - Proper percent-encoding for all parameter values
   - Handle special characters safely
   - Prevent URL manipulation

## Testing Strategy

1. **Unit Tests**
   - Test each tool implementation
   - Validate URL construction
   - Test parameter encoding

2. **Integration Tests**
   - Test full MCP server functionality
   - Validate tool registration and execution
   - Test error handling

3. **Manual Testing**
   - Test with MCP Inspector
   - Verify Things app integration
   - Test all URL scheme commands

## Deployment

- Package as npm module
- Distribute via npm registry or GitHub
- Include comprehensive documentation
- Provide example configurations

## Future Enhancements

1. **Resource Providers**
   - Expose Things lists as MCP resources
   - Provide read access to existing items

2. **Prompt Templates**
   - Pre-built prompts for common workflows
   - Task management templates

3. **Batch Operations**
   - Support for bulk operations
   - Transaction-like behavior

4. **Webhooks/Callbacks**
   - x-callback-url support
   - Success/failure notifications