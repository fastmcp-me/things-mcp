# Things MCP Server

Control your Things.app tasks directly from Claude Code, Claude Desktop, Cursor, and other AI assistants using the Model Context Protocol (MCP).

## What It Does

This MCP server lets AI assistants interact with your Things.app tasks on macOS. You can:

- **Create** new tasks and projects
- **Update** existing items 
- **View** your task database with detailed summaries
- **Schedule** tasks for specific dates
- **Organize** with areas, tags, and deadlines

## Quick Start

### 1. Install

```bash
git clone https://github.com/your-username/things-mcp.git
cd things-mcp
npm install
npm run build
```

### 2. Get Things Authorization Token

For updating existing tasks, you need an authorization token:

1. Open **Things.app** on macOS
2. Go to **Things → Preferences → General** 
3. Check **"Enable Things URLs"**
4. Copy the authorization token that appears
5. Set it as an environment variable:

```bash
export THINGS_AUTH_TOKEN="your-token-here"
```

### 3. Configure Your AI Assistant

#### Claude Code
Add to your project's `.claude_code_config.json`:

```json
{
  "mcpServers": {
    "things": {
      "command": "node",
      "args": ["/path/to/things-mcp/build/src/index.js"],
      "env": {
        "THINGS_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "things": {
      "command": "node",
      "args": ["/path/to/things-mcp/build/src/index.js"],
      "env": {
        "THINGS_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Cursor IDE
Create `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "things": {
    "command": "node",
    "args": ["/path/to/things-mcp/build/src/index.js"],
    "env": {
      "THINGS_AUTH_TOKEN": "your-token-here"
    }
  }
}
```

### 4. Restart Your AI Assistant

After configuration, restart your AI assistant to load the MCP server.

## Use Cases

### Daily Planning
"Show me my today's tasks and create a project for the new marketing campaign with initial tasks for research, design, and content creation."

### Project Management  
"Update the mobile app project to add design review and testing tasks, then schedule the design review for next Monday."

### Task Organization
"Move all my unscheduled shopping tasks to the 'Personal' area and tag them with 'weekend'."

### Progress Tracking
"Give me a summary of all active projects with their deadlines and completion status."

### Quick Capture
"Create a task to call the dentist, schedule it for tomorrow, and set a deadline for end of week."

## Available Tools

### `things_summary`
Get a complete overview of your Things database including tasks, projects, areas, and tags. Returns formatted markdown or structured JSON.

### `add_todo` 
Create new tasks with scheduling, deadlines, tags, and checklist items.

### `add_project`
Create new projects with initial tasks, areas, and scheduling.

### `update_todo` / `update_project`
Modify existing items (requires auth token).

### `export_json`
Export your entire Things database for backup or analysis.

## Requirements

- **macOS** (Things.app requirement)
- **Things.app** installed and running
- **Node.js** 20 or higher

## Troubleshooting

### "Things container not found"
- Ensure Things.app is installed and has been launched at least once
- Check that you're running on macOS

### "Update operations require auth token"  
- Follow the authorization token setup steps above
- Verify the token is correctly set in your environment

### MCP server not loading
- Check your configuration file syntax
- Verify the path to the built server file
- Restart your AI assistant after configuration changes

## License

MIT

## Contributing

Issues and pull requests welcome! Please ensure all tests pass before submitting.