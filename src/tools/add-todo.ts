import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';
import { AddTodoParams } from '../types/things.js';

const addTodoSchema = z.object({
  title: z.string().describe('To-do title (required). Clear, actionable description of the task'),
  notes: z.string().optional().describe('Additional notes or details for the to-do. Supports markdown formatting'),
  when: z.string().optional().describe('Schedule date. Use "today", "tomorrow", "evening", "anytime", "someday", or ISO date (YYYY-MM-DD)'),
  deadline: z.string().optional().describe('Due date deadline in ISO format (YYYY-MM-DD). Creates deadline reminder in Things'),
  tags: z.string().optional().describe('Comma-separated tags for organization (e.g., "work,urgent,email")'),
  checklist_items: z.string().optional().describe('Sub-tasks as newline-separated items. Each line becomes a checklist item'),
  list: z.string().optional().describe('Project or area name to add this to-do to. Creates relationship in Things hierarchy'),
  heading: z.string().optional().describe('Heading name within the target project for organization'),
  completed: z.boolean().optional().describe('Mark as completed immediately upon creation (default: false)'),
  canceled: z.boolean().optional().describe('Mark as canceled immediately upon creation (default: false)')
});

export function registerAddTodoTool(server: McpServer): void {
  server.tool(
    'add_todo',
    'Create a new to-do item in Things.app with optional scheduling, tags, and project assignment. Opens Things.app to add the item immediately.',
    addTodoSchema.shape,
    async (params) => {
      try {
        logger.info('Adding new to-do', { title: params.title });
        
        const urlParams: Record<string, any> = {
          title: params.title,
          notes: params.notes,
          when: params.when,
          deadline: params.deadline,
          tags: params.tags,
          'checklist-items': params.checklist_items,
          list: params.list,
          heading: params.heading,
          completed: params.completed,
          canceled: params.canceled
        };
        
        const url = buildThingsUrl('add', urlParams);
        logger.debug('Generated URL', { url });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully created to-do: ${params.title}`
          }]
        };
      } catch (error) {
        logger.error('Failed to add to-do', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}