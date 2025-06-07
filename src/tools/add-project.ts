import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const addProjectAttributesSchema = z.object({
  title: z.string().describe('Project title (required). Clear name describing the project goal or outcome'),
  notes: z.string().max(10000).optional().describe('Project description, objectives, or additional context (max 10,000 characters). Supports markdown formatting'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday']).or(z.string()).optional().describe('Project start date. Use "today", "tomorrow", "evening", "anytime", "someday", or ISO date string'),
  deadline: z.string().optional().describe('Project deadline (ISO date string). Creates deadline tracking'),
  tags: z.array(z.string()).optional().describe('Array of tag strings for categorization'),
  'area-id': z.string().optional().describe('Area ID to assign this project to'),
  area: z.string().optional().describe('Area of responsibility to assign this project to (e.g., "Work", "Personal")'),
  items: z.array(z.string()).optional().describe('Array of initial to-do item strings. Each becomes a separate task'),
  completed: z.boolean().optional().describe('Mark project as completed immediately upon creation (default: false)'),
  canceled: z.boolean().optional().describe('Mark project as canceled immediately upon creation (default: false)'),
  'creation-date': z.string().optional().describe('Creation date (ISO8601 datetime string)'),
  'completion-date': z.string().optional().describe('Completion date (ISO8601 datetime string)')
});

const addProjectSchema = z.object({
  attributes: addProjectAttributesSchema.describe('Attributes for the new project')
});

export function registerAddProjectTool(server: McpServer): void {
  server.tool(
    'add_project',
    'Create a new project in Things.app using JSON schema. Optional scheduling, areas, and initial to-dos. Projects organize related tasks and can contain multiple to-dos.',
    addProjectSchema.shape,
    async (params) => {
      try {
        const title = params.attributes.title;
        logger.info('Adding new project', { title });
        
        const urlParams: Record<string, any> = {};

        // Add all attributes to urlParams
        if (params.attributes) {
          Object.entries(params.attributes).forEach(([key, value]) => {
            if (value !== undefined) {
              // Convert arrays to comma-separated strings for URL scheme
              if (Array.isArray(value)) {
                // Special case for items array which maps to 'to-dos' in URL scheme
                if (key === 'items') {
                  urlParams['to-dos'] = value.join('\n');
                } else {
                  urlParams[key] = value.join(',');
                }
              } else {
                urlParams[key] = value;
              }
            }
          });
        }
        
        const url = buildThingsUrl('add-project', urlParams);
        logger.debug('Generated URL', { url });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully created project: ${title}`
          }]
        };
      } catch (error) {
        logger.error('Failed to add project', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}