import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { requireAuthToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

const updateTodoSchema = z.object({
  id: z.string().describe('The ID of the to-do to update'),
  title: z.string().optional().describe('New title for the to-do'),
  notes: z.string().optional().describe('New notes for the to-do'),
  when: z.string().optional().describe('New schedule date (today, tomorrow, evening, anytime, someday, or ISO date)'),
  deadline: z.string().optional().describe('New deadline (ISO date format)'),
  tags: z.string().optional().describe('New comma-separated list of tags (replaces all tags)'),
  checklist_items: z.string().optional().describe('New newline-separated checklist items (replaces all items)'),
  list: z.string().optional().describe('Move to different project/area (ID or name)'),
  heading: z.string().optional().describe('Move to different heading within project'),
  completed: z.boolean().optional().describe('Mark the to-do as completed'),
  canceled: z.boolean().optional().describe('Mark the to-do as canceled'),
  prepend_notes: z.string().optional().describe('Text to prepend to existing notes'),
  append_notes: z.string().optional().describe('Text to append to existing notes'),
  add_tags: z.string().optional().describe('Comma-separated tags to add (keeps existing tags)'),
  add_checklist_items: z.string().optional().describe('Newline-separated checklist items to add')
});

export function registerUpdateTodoTool(server: McpServer): void {
  server.tool(
    'update_todo',
    'Update an existing to-do item in Things.app. Requires auth token. Can modify any property, move between projects, or change status.',
    updateTodoSchema.shape,
    async (params) => {
      try {
        logger.info('Updating to-do', { id: params.id });
        
        const authToken = requireAuthToken();
        
        const urlParams: Record<string, any> = {
          id: params.id,
          'auth-token': authToken,
          title: params.title,
          notes: params.notes,
          when: params.when,
          deadline: params.deadline,
          tags: params.tags,
          'checklist-items': params.checklist_items,
          list: params.list,
          heading: params.heading,
          completed: params.completed,
          canceled: params.canceled,
          'prepend-notes': params.prepend_notes,
          'append-notes': params.append_notes,
          'add-tags': params.add_tags,
          'add-checklist-items': params.add_checklist_items
        };
        
        const url = buildThingsUrl('update', urlParams);
        logger.debug('Generated URL', { url: url.replace(authToken, '***') });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully updated to-do: ${params.id}`
          }]
        };
      } catch (error) {
        logger.error('Failed to update to-do', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}