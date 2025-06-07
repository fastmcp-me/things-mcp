import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const addProjectSchema = z.object({
  title: z.string().describe('The title of the project'),
  notes: z.string().optional().describe('Additional notes for the project'),
  when: z.string().optional().describe('When to schedule the project (today, tomorrow, evening, anytime, someday, or ISO date)'),
  deadline: z.string().optional().describe('Deadline for the project (ISO date format)'),
  tags: z.string().optional().describe('Comma-separated list of tags'),
  area: z.string().optional().describe('ID or name of the area to add the project to'),
  todos: z.string().optional().describe('Newline-separated list of to-dos to add to the project'),
  completed: z.boolean().optional().describe('Whether the project should be marked as completed'),
  canceled: z.boolean().optional().describe('Whether the project should be marked as canceled')
});

export function registerAddProjectTool(server: McpServer): void {
  server.tool(
    'add_project',
    addProjectSchema.shape,
    async (params) => {
      try {
        logger.info('Adding new project', { title: params.title });
        
        const urlParams: Record<string, any> = {
          title: params.title,
          notes: params.notes,
          when: params.when,
          deadline: params.deadline,
          tags: params.tags,
          area: params.area,
          'to-dos': params.todos,
          completed: params.completed,
          canceled: params.canceled
        };
        
        const url = buildThingsUrl('add-project', urlParams);
        logger.debug('Generated URL', { url });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully created project: ${params.title}`
          }]
        };
      } catch (error) {
        logger.error('Failed to add project', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}