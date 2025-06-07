import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { requireAuthToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

const updateTodoAttributesSchema = z.object({
  title: z.string().optional().describe('New title for the to-do'),
  notes: z.string().max(10000).optional().describe('New notes for the to-do (max 10,000 characters, replaces existing notes)'),
  'prepend-notes': z.string().optional().describe('Text to prepend to existing notes'),
  'append-notes': z.string().optional().describe('Text to append to existing notes'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday']).or(z.string()).optional().describe('Schedule date (today, tomorrow, evening, anytime, someday, or ISO date)'),
  deadline: z.string().optional().describe('Deadline (ISO date string)'),
  tags: z.array(z.string()).optional().describe('Array of tag strings (replaces all current tags)'),
  'add-tags': z.array(z.string()).optional().describe('Array of tag strings to add (keeps existing tags)'),
  'checklist-items': z.array(z.string()).max(100).optional().describe('Array of checklist item strings (replaces all items, max 100)'),
  'prepend-checklist-items': z.array(z.string()).optional().describe('Array of checklist item strings to prepend'),
  'append-checklist-items': z.array(z.string()).optional().describe('Array of checklist item strings to append'),
  'list-id': z.string().optional().describe('Project/area ID to move to-do to'),
  list: z.string().optional().describe('Project/area title to move to-do to'),
  'heading-id': z.string().optional().describe('Heading ID within project'),
  heading: z.string().optional().describe('Heading title within project'),
  completed: z.boolean().optional().describe('Mark the to-do as completed'),
  canceled: z.boolean().optional().describe('Mark the to-do as canceled'),
  'creation-date': z.string().optional().describe('Creation date (ISO8601 datetime string)'),
  'completion-date': z.string().optional().describe('Completion date (ISO8601 datetime string)')
});

const updateTodoSchema = z.object({
  id: z.string().describe('The unique ID of the to-do to update'),
  attributes: updateTodoAttributesSchema.describe('Attributes to update for the to-do')
});

export function registerUpdateTodoTool(server: McpServer): void {
  server.tool(
    'update_todo',
    'Update an existing to-do item in Things.app using JSON schema. Requires auth token. Can modify any property, move between projects, or change status.',
    updateTodoSchema.shape,
    async (params) => {
      try {
        logger.info('Updating to-do', { id: params.id });
        
        const authToken = requireAuthToken();
        
        const urlParams: Record<string, any> = {
          id: params.id,
          'auth-token': authToken
        };

        // Add all attributes from the attributes object to urlParams
        if (params.attributes) {
          Object.entries(params.attributes).forEach(([key, value]) => {
            if (value !== undefined) {
              // Convert arrays to comma-separated strings for URL scheme
              if (Array.isArray(value)) {
                urlParams[key] = value.join(',');
              } else {
                urlParams[key] = value;
              }
            }
          });
        }
        
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