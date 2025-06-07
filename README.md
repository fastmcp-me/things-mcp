# Things MCP Server

A Model Context Protocol (MCP) server that integrates with Things.app on macOS, allowing LLMs to interact with your task management system through the Things URL scheme.

## Features

- ✅ Create to-dos and projects
- ✅ Update existing items (requires auth token)
- ✅ Navigate to specific views and items
- ✅ Search functionality
- ✅ Advanced JSON import for bulk operations
- ✅ Full TypeScript implementation with type safety

## Installation

```bash
npm install
npm run build
```

## Configuration

For update operations, you need to set the `THINGS_AUTH_TOKEN` environment variable:

1. Open Things.app on macOS
2. Go to Preferences → General → Enable Things URLs
3. Copy your authorization token
4. Set the environment variable:

```bash
export THINGS_AUTH_TOKEN="your-token-here"
```

## Available Tools

### `add_todo`
Create a new to-do in Things.

**Parameters:**
- `title` (required): The title of the to-do
- `notes` (optional): Additional notes
- `when` (optional): Schedule date (today, tomorrow, evening, anytime, someday, or ISO date)
- `deadline` (optional): Deadline (ISO date format)
- `tags` (optional): Comma-separated tags
- `checklist_items` (optional): Newline-separated checklist items
- `list` (optional): Project/area to add to
- `heading` (optional): Heading within project
- `completed` (optional): Mark as completed
- `canceled` (optional): Mark as canceled

### `add_project`
Create a new project in Things.

**Parameters:**
- `title` (required): The title of the project
- `notes` (optional): Project notes
- `when` (optional): Schedule date
- `deadline` (optional): Project deadline
- `tags` (optional): Comma-separated tags
- `area` (optional): Parent area
- `todos` (optional): Initial to-dos (newline-separated)

### `update_todo`
Update an existing to-do (requires auth token).

**Parameters:**
- `id` (required): The ID of the to-do to update
- All parameters from `add_todo` (optional)
- `prepend_notes` (optional): Text to prepend to notes
- `append_notes` (optional): Text to append to notes
- `add_tags` (optional): Tags to add (keeps existing)
- `add_checklist_items` (optional): Checklist items to add

### `update_project`
Update an existing project (requires auth token).

**Parameters:**
- `id` (required): The ID of the project to update
- All parameters from `add_project` (optional)
- `prepend_notes` (optional): Text to prepend to notes
- `append_notes` (optional): Text to append to notes
- `add_tags` (optional): Tags to add (keeps existing)

### `show`
Navigate to specific views or items in Things.

**Parameters:**
- `id` (optional): Item ID or view name (today, anytime, upcoming, someday, logbook, deadlines)
- `query` (optional): Filter query

### `search`
Search for items in Things.

**Parameters:**
- `query` (optional): Search query

### `json_import`
Advanced JSON import for bulk operations.

**Parameters:**
- `data` (required): Array of items to import (to-dos and projects)
- `reveal` (optional): Whether to reveal imported items

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With MCP Inspector (for testing)
```bash
npm run inspector
```

## Testing

```bash
npm test
```

## Project Structure

```
things-mcp/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/                # Tool implementations
│   │   ├── add-todo.ts
│   │   ├── add-project.ts
│   │   ├── update-todo.ts
│   │   ├── update-project.ts
│   │   ├── show.ts
│   │   ├── search.ts
│   │   └── json-import.ts
│   ├── utils/                # Utility functions
│   │   ├── url-builder.ts    # Things URL construction
│   │   ├── encoder.ts        # Parameter encoding
│   │   ├── auth.ts           # Authentication handling
│   │   └── logger.ts         # Logging utilities
│   └── types/
│       └── things.ts         # TypeScript type definitions
├── tests/                    # Test files
├── plans/                    # Architecture and planning docs
└── build/                    # Compiled output
```

## Things URL Scheme

This server uses the [Things URL Scheme](https://culturedcode.com/things/support/articles/2803573/) to interact with the Things app. All commands are executed by opening URLs with the `things://` scheme.

## Requirements

- macOS (Things URL scheme only works on macOS)
- Things.app installed
- Node.js 20 or higher
- TypeScript 5.0 or later

## License

MIT