import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';
import { AddTodoParams } from '../types/things.js';

const addTodoSchema = z.object({
  title: z.string().describe('The title of the to-do'),
  notes: z.string().optional().describe('Additional notes for the to-do'),
  when: z.string().optional().describe('When to schedule the to-do (today, tomorrow, evening, anytime, someday, or ISO date)'),
  deadline: z.string().optional().describe('Deadline for the to-do (ISO date format)'),
  tags: z.string().optional().describe('Comma-separated list of tags'),
  checklist_items: z.string().optional().describe('Newline-separated checklist items'),
  list: z.string().optional().describe('ID or name of the project/area to add the to-do to'),
  heading: z.string().optional().describe('Name of the heading within the project'),
  completed: z.boolean().optional().describe('Whether the to-do should be marked as completed'),
  canceled: z.boolean().optional().describe('Whether the to-do should be marked as canceled')
});

export function registerAddTodoTool(server: McpServer): void {
  server.tool(
    'add_todo',
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