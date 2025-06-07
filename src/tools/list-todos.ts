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

        // Apply additional filters that couldn't be handled in AppleScript
        let filteredTodos = todos;

        if (options.project) {
          filteredTodos = filteredTodos.filter(todo => 
            todo.project?.toLowerCase().includes(options.project!.toLowerCase())
          );
        }

        if (options.area) {
          filteredTodos = filteredTodos.filter(todo => 
            todo.area?.toLowerCase().includes(options.area!.toLowerCase())
          );
        }

        if (options.tags && options.tags.length > 0) {
          filteredTodos = filteredTodos.filter(todo => 
            options.tags!.every(tag => 
              todo.tags.some(todoTag => 
                todoTag.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }

        if (options.dueBefore) {
          filteredTodos = filteredTodos.filter(todo => 
            todo.dueDate && todo.dueDate < options.dueBefore!
          );
        }

        if (options.dueAfter) {
          filteredTodos = filteredTodos.filter(todo => 
            todo.dueDate && todo.dueDate > options.dueAfter!
          );
        }

        if (options.modifiedAfter) {
          filteredTodos = filteredTodos.filter(todo => 
            todo.modificationDate > options.modifiedAfter!
          );
        }

        // Apply limit
        if (options.limit) {
          filteredTodos = filteredTodos.slice(0, options.limit);
        }

        const resultText = formatTodosAsText(filteredTodos);

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
    
    if (todo.project) {
      result += `\n  Project: ${todo.project}`;
    }
    
    if (todo.area) {
      result += `\n  Area: ${todo.area}`;
    }
    
    if (todo.tags && todo.tags.length > 0) {
      result += `\n  Tags: ${todo.tags.join(', ')}`;
    }
    
    if (todo.dueDate) {
      result += `\n  Due: ${todo.dueDate.toISOString().split('T')[0]}`;
    }
    
    if (todo.notes) {
      const truncatedNotes = todo.notes.length > 100 
        ? todo.notes.substring(0, 100) + '...' 
        : todo.notes;
      result += `\n  Notes: ${truncatedNotes}`;
    }
    
    result += '\n\n';
  }

  return result.trim();
}