# Getting Started

This guide will help you set up and start using the Things MCP Server with your AI assistant.

## Prerequisites

- **macOS**: Things.app is exclusively available on macOS
- **Things.app**: Download from [culturedcode.com/things](https://culturedcode.com/things/)
- **MCP-compatible AI assistant**: Claude Desktop, Cursor IDE, or other MCP clients

## Installation

### Option 1: Using npx (Recommended)

The easiest way to use Things MCP is with npx - no installation required:

```json
{
  "mcpServers": {
    "things": {
      "command": "npx",
      "args": ["@wenbopan/things-mcp"]
    }
  }
}
```

### Option 2: Global Installation

```bash
npm install -g @wenbopan/things-mcp
```

Then reference the global installation:

```json
{
  "mcpServers": {
    "things": {
      "command": "things-mcp"
    }
  }
}
```

## Configuration

### 1. Enable Things URLs

1. Open **Things.app** on your Mac
2. Go to **Things → Preferences → General**
3. Check **"Enable Things URLs"**
4. Copy the **authorization token** that appears (needed for updates)

### 2. Configure Your AI Assistant

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "things": {
      "command": "npx",
      "args": ["@wenbopan/things-mcp"],
      "env": {
        "THINGS_AUTH_TOKEN": "your-authorization-token-here"
      }
    }
  }
}
```

#### Cursor IDE

Create `.cursor/mcp.json` in your project root or `~/.cursor/mcp.json` globally:

```json
{
  "things": {
    "command": "npx", 
    "args": ["@wenbopan/things-mcp"],
    "env": {
      "THINGS_AUTH_TOKEN": "your-authorization-token-here"
    }
  }
}
```

#### Other MCP Clients

Refer to your AI assistant's MCP configuration documentation and use the same command structure.

### 3. Restart Your AI Assistant

After configuration changes, completely restart your AI assistant to load the MCP server.

## Verification

Test the setup by asking your AI assistant:

```
"Show me a summary of my Things tasks"
```

If configured correctly, you should see your current tasks and projects.

## Basic Usage

### Creating Tasks

```
"Create a task to call the dentist and schedule it for tomorrow"
```

### Creating Projects

```
"Create a project called 'Website Redesign' with tasks for research, design, and development"
```

### Viewing Your Data

```
"Show me all my active projects with their deadlines"
```

### Updating Tasks

```
"Mark the 'call dentist' task as completed"
```

## Understanding Permissions

- **Reading data**: No authorization required
- **Creating new items**: No authorization required  
- **Updating existing items**: Requires authorization token

## Next Steps

- Explore the [API Reference](api-reference.md) for all available tools
- Review [common use cases](#common-use-cases) below
- Check [troubleshooting](troubleshooting.md) if you encounter issues

## Common Use Cases

### Daily Planning
Ask your AI assistant to:
- Review today's tasks
- Create new tasks for unexpected items
- Reschedule tasks as priorities change

### Project Management
- Create project templates with common tasks
- Track project progress and deadlines
- Organize tasks by areas and tags

### Quick Capture
- Rapidly capture ideas and tasks
- Set appropriate deadlines and schedules
- Tag and categorize for later organization

### Weekly Reviews
- Export data for analysis
- Review completed and pending items
- Plan upcoming priorities

## Tips for Effective Use

1. **Be specific with dates**: Use clear date formats like "next Monday" or "2024-01-15"
2. **Use natural language**: The AI assistant will translate to proper Things.app parameters
3. **Leverage areas and tags**: Organize tasks for better filtering and management
4. **Set deadlines strategically**: Use deadlines for truly time-sensitive items
5. **Regular reviews**: Use summary tools to maintain overview of your task system