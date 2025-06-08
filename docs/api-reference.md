# API Reference

Complete reference for all MCP tools provided by the Things MCP Server.

## Tool Categories

### Creation Tools
- [`add_todo`](#add_todo) - Create new tasks with scheduling and organization
- [`add_project`](#add_project) - Create new projects with initial tasks

### Update Tools
- [`update_todo`](#update_todo) - Modify existing tasks (requires auth token)
- [`update_project`](#update_project) - Modify existing projects (requires auth token)

### Data Access Tools
- [`things_summary`](#things_summary) - Query and summarize your Things database
- [`export_json`](#export_json) - Export complete database as structured JSON

---

## add_todo

Create a new to-do item in Things.app with full scheduling and organization features.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Clear, actionable description of the task |
| `notes` | string | No | Additional details (max 10,000 characters, supports markdown) |
| `when` | string | No | Schedule: `today`, `tomorrow`, `evening`, `anytime`, `someday`, or ISO date (YYYY-MM-DD) |
| `deadline` | string | No | Deadline in ISO date format (YYYY-MM-DD) |
| `tags` | string[] | No | Array of tag names for organization (max 20) |
| `checklistItems` | string[] | No | Array of sub-task descriptions (max 100) |
| `projectId` | string | No | Specific project ID to add task to |
| `projectName` | string | No | Project name (Things will find by name) |
| `areaId` | string | No | Specific area ID for assignment |
| `areaName` | string | No | Area name (e.g., "Work", "Personal") |
| `headingId` | string | No | Specific heading ID within project |
| `headingName` | string | No | Heading name within project |
| `completed` | boolean | No | Mark as completed immediately (default: false) |
| `canceled` | boolean | No | Mark as canceled immediately (default: false) |
| `creationDate` | string | No | Override creation date (ISO8601 format) |
| `completionDate` | string | No | Set completion date when `completed` is true |

### Example Usage

```typescript
// Basic task
{
  "title": "Call dentist for appointment",
  "when": "tomorrow",
  "deadline": "2024-01-15"
}

// Task with full organization
{
  "title": "Review quarterly budget",
  "notes": "Focus on Q4 expenses and Q1 projections",
  "when": "today",
  "deadline": "2024-01-10",
  "tags": ["urgent", "finance"],
  "areaName": "Work",
  "checklistItems": [
    "Gather expense reports",
    "Analyze trends",
    "Prepare recommendations"
  ]
}
```

### Response

```json
{
  "content": [{
    "type": "text",
    "text": "Successfully created to-do: Call dentist for appointment"
  }]
}
```

---

## add_project

Create a new project in Things.app with optional initial tasks and full organization.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Project name and description |
| `notes` | string | No | Project details and context (max 10,000 characters) |
| `when` | string | No | Project start schedule (same options as `add_todo`) |
| `deadline` | string | No | Project deadline in ISO date format |
| `tags` | string[] | No | Project tags for organization |
| `areaId` | string | No | Area ID to assign project to |
| `areaName` | string | No | Area name for assignment |
| `initialTodos` | string[] | No | Array of initial task titles (max 100) |
| `completed` | boolean | No | Mark as completed immediately |
| `canceled` | boolean | No | Mark as canceled immediately |

### Example Usage

```typescript
// Project with initial tasks
{
  "title": "Website Redesign",
  "notes": "Complete overhaul of company website with modern design",
  "when": "2024-01-08",
  "deadline": "2024-03-01",
  "areaName": "Work",
  "tags": ["design", "development"],
  "initialTodos": [
    "Research competitor websites",
    "Create wireframes",
    "Design mockups",
    "Develop front-end",
    "User testing"
  ]
}
```

---

## update_todo

Modify existing tasks in Things.app. Requires authorization token.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the task to update |
| `title` | string | No | New task title |
| `notes` | string | No | Update notes content |
| `when` | string | No | Reschedule the task |
| `deadline` | string | No | Update deadline |
| `tags` | string[] | No | Replace all tags |
| `completed` | boolean | No | Mark as completed/incomplete |
| `canceled` | boolean | No | Mark as canceled/active |
| `checklistItems` | string[] | No | Replace checklist items |
| `appendNotes` | string | No | Add text to end of existing notes |
| `prependNotes` | string | No | Add text to beginning of notes |

### Example Usage

```typescript
// Complete a task
{
  "id": "task-uuid-here",
  "completed": true
}

// Reschedule and add notes
{
  "id": "task-uuid-here", 
  "when": "tomorrow",
  "appendNotes": "\n\nPostponed due to client feedback"
}
```

---

## update_project

Modify existing projects in Things.app. Requires authorization token.

### Parameters

Similar to `update_todo` but for projects, with additional project-specific operations.

---

## things_summary

Generate comprehensive summaries of your Things database with advanced filtering.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | No | Output format: `markdown` (default) or `json` |
| `includeCompleted` | boolean | No | Include completed items (default: false) |
| `areas` | string[] | No | Filter by specific area names |
| `tags` | string[] | No | Filter by specific tag names |
| `projects` | string[] | No | Filter by specific project names |

### Example Usage

```typescript
// Basic summary
{
  "format": "markdown"
}

// Filtered summary
{
  "format": "json",
  "areas": ["Work", "Personal"],
  "tags": ["urgent"],
  "includeCompleted": true
}
```

### Response Format

#### Markdown Format
Returns a comprehensive, readable summary with:
- Overview statistics
- Today's tasks (prioritized)
- Inbox items
- Areas with projects and tasks
- Standalone projects
- Active tags
- Quick navigation links

#### JSON Format
Returns structured data perfect for programmatic processing:

```json
{
  "summary": {
    "totalOpenTasks": 42,
    "totalActiveProjects": 8,
    "totalAreas": 4,
    "totalTags": 12,
    "lastUpdated": "2024-01-08T10:30:00.000Z"
  },
  "areas": [...],
  "inboxTasks": [...],
  "todayTasks": [...],
  "projects": [...],
  "tags": [...],
  "urls": {
    "showToday": "things:///show?list=today",
    "showInbox": "things:///show?list=inbox",
    "showProjects": "things:///show?list=projects",
    "showAreas": "things:///show?list=areas"
  }
}
```

---

## export_json

Export your complete Things database as structured JSON for backup, analysis, or migration.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeCompleted` | boolean | No | Include completed items (default: false) |
| `includeTrashed` | boolean | No | Include trashed items (default: false) |
| `minimal` | boolean | No | Export minimal data only (default: false) |

### Example Usage

```typescript
// Full export for backup
{
  "includeCompleted": true,
  "includeTrashed": true
}

// Active items only
{
  "minimal": true
}
```

---

## Common Patterns

### Date Formats

**ISO Date Format**: `YYYY-MM-DD` (e.g., `2024-01-15`)
**ISO DateTime Format**: `YYYY-MM-DDTHH:MM:SS` (e.g., `2024-01-15T14:30:00`)

### Schedule Values

- `today` - Add to Today list
- `tomorrow` - Schedule for tomorrow
- `evening` - Add to This Evening  
- `anytime` - No specific schedule
- `someday` - Add to Someday list
- `YYYY-MM-DD` - Specific date

### Error Handling

All tools return structured error responses:

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid date format",
    "details": "Expected YYYY-MM-DD format"
  }
}
```

### Authorization

Update operations require the `THINGS_AUTH_TOKEN` environment variable:
1. Enable Things URLs in Things.app Preferences
2. Copy the authorization token
3. Set as environment variable in your MCP configuration

### Performance Notes

- `things_summary` accesses the SQLite database directly for fast queries
- Creation tools use URL scheme for immediate response
- Update tools use hybrid approach (JSON + URL scheme) for reliability
- All operations are designed for minimal latency and maximum compatibility