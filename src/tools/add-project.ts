import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const addProjectSchema = z.object({
  title: z.string().min(1).describe('Project title (required). Clear name describing the project goal, outcome, or deliverable'),
  notes: z.string().max(10000).optional().describe('Project description, objectives, scope, or additional context (max 10,000 characters). Supports markdown formatting for rich text documentation'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday'])
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .describe('Schedule when to start working on this project. Use "today" to start immediately, "tomorrow" to start next day, "evening" to start later today, "anytime" for flexible timing, "someday" for future consideration, or ISO date format (YYYY-MM-DD) for specific start date'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Set a deadline for project completion in ISO date format (YYYY-MM-DD). Creates deadline tracking and reminders in Things.app'),
  tags: z.array(z.string().min(1))
    .max(20)
    .optional()
    .describe('Array of tag names for categorizing and organizing the project (max 20 tags). Tags help with filtering and project management'),
  areaId: z.string()
    .optional()
    .describe('ID of the area of responsibility to assign this project to. Use this when you know the specific area ID'),
  areaName: z.string()
    .optional()
    .describe('Name of the area of responsibility to assign this project to (e.g., "Work", "Personal", "Health", "Finance"). Areas help organize projects by life domain'),
  initialTodos: z.array(z.string().min(1))
    .max(50)
    .optional()
    .describe('Array of initial to-do item descriptions to create within the project (max 50 items). Each string becomes a separate task within the project'),
  completed: z.boolean()
    .optional()
    .default(false)
    .describe('Mark the project as completed immediately upon creation (default: false). Useful for logging already completed projects'),
  canceled: z.boolean()
    .optional()
    .default(false)
    .describe('Mark the project as canceled immediately upon creation (default: false). Useful for recording projects that are no longer viable'),
  creationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Override the creation date with a specific ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Useful for importing historical project data'),
  completionDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Set a specific completion date using ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Only used when completed is true')
});

export function registerAddProjectTool(server: McpServer): void {
  server.tool(
    'add_project',
    'Create a new project in Things.app. Add notes, tags, assign to areas, and pre-populate with initial to-dos.',
    addProjectSchema.shape,
    async (params) => {
      try {
        logger.info('Adding new project', { title: params.title });
        
        const urlParams: Record<string, any> = {
          title: params.title
        };

        // Map schema parameters to Things URL scheme parameters
        if (params.notes) urlParams.notes = params.notes;
        if (params.when) urlParams.when = params.when;
        if (params.deadline) urlParams.deadline = params.deadline;
        if (params.tags) urlParams.tags = params.tags.join(',');
        if (params.areaId) urlParams['area-id'] = params.areaId;
        if (params.areaName) urlParams.area = params.areaName;
        if (params.initialTodos) urlParams['to-dos'] = params.initialTodos.join('\n');
        if (params.completed) urlParams.completed = params.completed;
        if (params.canceled) urlParams.canceled = params.canceled;
        if (params.creationDate) urlParams['creation-date'] = params.creationDate;
        if (params.completionDate) urlParams['completion-date'] = params.completionDate;
        
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