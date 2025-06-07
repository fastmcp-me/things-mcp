import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { requireAuthToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

const updateProjectSchema = z.object({
  id: z.string().describe('The ID of the project to update'),
  title: z.string().optional().describe('New title for the project'),
  notes: z.string().optional().describe('New notes for the project'),
  when: z.string().optional().describe('New schedule date (today, tomorrow, evening, anytime, someday, or ISO date)'),
  deadline: z.string().optional().describe('New deadline (ISO date format)'),
  tags: z.string().optional().describe('New comma-separated list of tags (replaces all tags)'),
  area: z.string().optional().describe('Move to different area (ID or name)'),
  completed: z.boolean().optional().describe('Mark the project as completed'),
  canceled: z.boolean().optional().describe('Mark the project as canceled'),
  prepend_notes: z.string().optional().describe('Text to prepend to existing notes'),
  append_notes: z.string().optional().describe('Text to append to existing notes'),
  add_tags: z.string().optional().describe('Comma-separated tags to add (keeps existing tags)')
});

export function registerUpdateProjectTool(server: McpServer): void {
  server.tool(
    'update_project',
    'Update an existing project in Things.app. Requires auth token. Can modify any property, move between areas, or change status.',
    updateProjectSchema.shape,
    async (params) => {
      try {
        logger.info('Updating project', { id: params.id });
        
        const authToken = requireAuthToken();
        
        const urlParams: Record<string, any> = {
          id: params.id,
          'auth-token': authToken,
          title: params.title,
          notes: params.notes,
          when: params.when,
          deadline: params.deadline,
          tags: params.tags,
          area: params.area,
          completed: params.completed,
          canceled: params.canceled,
          'prepend-notes': params.prepend_notes,
          'append-notes': params.append_notes,
          'add-tags': params.add_tags
        };
        
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