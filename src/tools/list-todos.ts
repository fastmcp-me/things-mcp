import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listTodos, ListOptions } from '../utils/applescript.js';
import { logger } from '../utils/logger.js';

const listTodosSchema = z.object({
  status: z.enum(['open', 'completed', 'canceled', 'all']).optional().default('open').describe('Filter by completion status'),
  project: z.string().optional().describe('Filter by project name'),
  area: z.string().optional().describe('Filter by area name'),
  tags: z.array(z.string()).optional().describe('Filter by tags (todos must have all specified tags)'),
  due_before: z.string().optional().describe('Filter todos due before this date (ISO format)'),
  due_after: z.string().optional().describe('Filter todos due after this date (ISO format)'),
  modified_after: z.string().optional().describe('Filter todos modified after this date (ISO format)'),
  limit: z.number().int().positive().max(1000).optional().describe('Maximum number of todos to return (default: 100)')
});

export function registerListTodosTool(server: McpServer): void {
  server.tool(
    'list_todos',
    'Retrieve and display to-do items from Things.app with powerful filtering options. Filter by status, project, area, tags, due dates, and modification dates.',
    listTodosSchema.shape,
    async (params) => {
      try {
        logger.info('Listing todos', { params });

        const options: ListOptions = {
          status: params.status as any,
          project: params.project,
          area: params.area,
          tags: params.tags,
          limit: params.limit || 100
        };

        // Parse date filters if provided
        if (params.due_before) {
          options.dueBefore = new Date(params.due_before);
        }
        if (params.due_after) {
          options.dueAfter = new Date(params.due_after);
        }
        if (params.modified_after) {
          options.modifiedAfter = new Date(params.modified_after);
        }

        const todos = await listTodos(options);
        const resultText = formatTodosAsText(todos);

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      } catch (error) {
        logger.error('Failed to list todos', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}

function formatTodosAsText(todos: any[]): string {
  if (todos.length === 0) {
    return 'No todos found matching the criteria.';
  }

  let result = `Found ${todos.length} todo(s):\n\n`;

  for (const todo of todos) {
    result += `• ${todo.name}`;
    
    if (todo.status === 'completed') {
      result += ' ✓';
    } else if (todo.status === 'canceled') {
      result += ' ✗';
    }
    
    result += `\n  ID: ${todo.id}`;
    result += `\n  Status: ${todo.status}`;
    
    // Display all date properties
    result += `\n  📅 Due Date: ${todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : 'None'}`;
    result += `\n  🚀 Activation Date: ${todo.activationDate ? todo.activationDate.toISOString().split('T')[0] : 'None'}`;
    result += `\n  ✅ Completion Date: ${todo.completionDate ? todo.completionDate.toISOString().split('T')[0] : 'None'}`;
    
    // Display project information
    result += `\n  📁 Project: ${todo.project || 'None'}`;
    result += `\n  📁 Project ID: ${todo.projectId || 'None'}`;
    
    // Display area information
    result += `\n  🏷️  Area: ${todo.area || 'None'}`;
    result += `\n  🏷️  Area ID: ${todo.areaId || 'None'}`;
    
    // Display tags
    result += `\n  🏷️  Tags: ${todo.tags && todo.tags.length > 0 ? todo.tags.join(', ') : 'None'}`;
    
    // Display notes
    if (todo.notes) {
      const truncatedNotes = todo.notes.length > 100 
        ? todo.notes.substring(0, 100) + '...' 
        : todo.notes;
      result += `\n  📝 Notes: ${truncatedNotes}`;
    } else {
      result += `\n  📝 Notes: None`;
    }
    
    // Display metadata
    result += `\n  📅 Created: ${todo.creationDate.toISOString().split('T')[0]}`;
    result += `\n  ✏️  Modified: ${todo.modificationDate.toISOString().split('T')[0]}`;
    result += `\n  🔖 Type: ${todo.type}`;
    result += '\n\n';
  }

  return result.trim();
}