import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { requireAuthToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

const updateProjectAttributesSchema = z.object({
  title: z.string().optional().describe('New title for the project'),
  notes: z.string().max(10000).optional().describe('New notes for the project (max 10,000 characters, replaces existing notes)'),
  'prepend-notes': z.string().optional().describe('Text to prepend to existing notes'),
  'append-notes': z.string().optional().describe('Text to append to existing notes'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday']).or(z.string()).optional().describe('Schedule date (today, tomorrow, evening, anytime, someday, or ISO date)'),
  deadline: z.string().optional().describe('Deadline (ISO date string)'),
  tags: z.array(z.string()).optional().describe('Array of tag strings (replaces all current tags)'),
  'add-tags': z.array(z.string()).optional().describe('Array of tag strings to add (keeps existing tags)'),
  'area-id': z.string().optional().describe('Area ID to move project to'),
  area: z.string().optional().describe('Area title to move project to'),
  completed: z.boolean().optional().describe('Mark the project as completed'),
  canceled: z.boolean().optional().describe('Mark the project as canceled'),
  'creation-date': z.string().optional().describe('Creation date (ISO8601 datetime string)'),
  'completion-date': z.string().optional().describe('Completion date (ISO8601 datetime string)')
});

const updateProjectSchema = z.object({
  id: z.string().describe('The unique ID of the project to update'),
  attributes: updateProjectAttributesSchema.describe('Attributes to update for the project')
});

export function registerUpdateProjectTool(server: McpServer): void {
  server.tool(
    'update_project',
    'Update an existing project in Things.app using JSON schema. Requires auth token. Can modify any property, move between areas, or change status.',
    updateProjectSchema.shape,
    async (params) => {
      try {
        logger.info('Updating project', { id: params.id });
        
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
        
        const url = buildThingsUrl('update-project', urlParams);
        logger.debug('Generated URL', { url: url.replace(authToken, '***') });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully updated project: ${params.id}`
          }]
        };
      } catch (error) {
        logger.error('Failed to update project', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}