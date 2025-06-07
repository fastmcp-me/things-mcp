import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const addTodoAttributesSchema = z.object({
  title: z.string().describe('To-do title (required). Clear, actionable description of the task'),
  notes: z.string().max(10000).optional().describe('Additional notes or details for the to-do (max 10,000 characters). Supports markdown formatting'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday']).or(z.string()).optional().describe('Schedule date. Use "today", "tomorrow", "evening", "anytime", "someday", or ISO date string'),
  deadline: z.string().optional().describe('Due date deadline (ISO date string). Creates deadline reminder in Things'),
  tags: z.array(z.string()).optional().describe('Array of tag strings for organization'),
  'checklist-items': z.array(z.string()).max(100).optional().describe('Array of checklist item strings (max 100 items)'),
  'list-id': z.string().optional().describe('Project or area ID to add this to-do to'),
  list: z.string().optional().describe('Project or area name to add this to-do to. Creates relationship in Things hierarchy'),
  'heading-id': z.string().optional().describe('Heading ID within the target project'),
  heading: z.string().optional().describe('Heading name within the target project for organization'),
  completed: z.boolean().optional().describe('Mark as completed immediately upon creation (default: false)'),
  canceled: z.boolean().optional().describe('Mark as canceled immediately upon creation (default: false)'),
  'creation-date': z.string().optional().describe('Creation date (ISO8601 datetime string)'),
  'completion-date': z.string().optional().describe('Completion date (ISO8601 datetime string)')
});

const addTodoSchema = z.object({
  attributes: addTodoAttributesSchema.describe('Attributes for the new to-do item')
});

export function registerAddTodoTool(server: McpServer): void {
  server.tool(
    'add_todo',
    'Create a new to-do item in Things.app using JSON schema. Optional scheduling, tags, and project assignment. Opens Things.app to add the item immediately.',
    addTodoSchema.shape,
    async (params) => {
      try {
        const title = params.attributes.title;
        logger.info('Adding new to-do', { title });
        
        const urlParams: Record<string, any> = {};

        // Add all attributes to urlParams
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
        
        const url = buildThingsUrl('add', urlParams);
        logger.debug('Generated URL', { url });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully created to-do: ${title}`
          }]
        };
      } catch (error) {
        logger.error('Failed to add to-do', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}