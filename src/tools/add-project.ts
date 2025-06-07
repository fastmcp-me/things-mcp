import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const addProjectSchema = z.object({
  title: z.string().describe('Project title (required). Clear name describing the project goal or outcome'),
  notes: z.string().optional().describe('Project description, objectives, or additional context. Supports markdown formatting'),
  when: z.string().optional().describe('Project start date. Use "today", "tomorrow", "evening", "anytime", "someday", or ISO date (YYYY-MM-DD)'),
  deadline: z.string().optional().describe('Project deadline in ISO format (YYYY-MM-DD). Creates deadline tracking'),
  tags: z.string().optional().describe('Comma-separated tags for categorization (e.g., "work,client,website")'),
  area: z.string().optional().describe('Area of responsibility to assign this project to (e.g., "Work", "Personal")'),
  todos: z.string().optional().describe('Initial to-dos as newline-separated items. Each line becomes a separate task'),
  completed: z.boolean().optional().describe('Mark project as completed immediately upon creation (default: false)'),
  canceled: z.boolean().optional().describe('Mark project as canceled immediately upon creation (default: false)')
});

export function registerAddProjectTool(server: McpServer): void {
  server.tool(
    'add_project',
    'Create a new project in Things.app with optional scheduling, areas, and initial to-dos. Projects organize related tasks and can contain multiple to-dos.',
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