import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const addTodoSchema = z.object({
  title: z.string().min(1).describe('To-do title (required). Clear, actionable description of the task'),
  notes: z.string().max(10000).optional().describe('Additional notes or details for the to-do (max 10,000 characters). Supports markdown formatting for rich text'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday'])
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .describe('Schedule the to-do for a specific time. Use "today" for immediate action, "tomorrow" for next day, "evening" for later today, "anytime" for no specific time, "someday" for future consideration, or ISO date format (YYYY-MM-DD) for specific date'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Set a deadline for the to-do in ISO date format (YYYY-MM-DD). Creates a deadline reminder in Things.app'),
  tags: z.array(z.string().min(1))
    .max(20)
    .optional()
    .describe('Array of tag names for organizing and categorizing the to-do (max 20 tags). Tags help with filtering and organization'),
  checklistItems: z.array(z.string().min(1))
    .max(100)
    .optional()
    .describe('Array of checklist item descriptions to add as sub-tasks (max 100 items). Each item becomes a checkable sub-task within the to-do'),
  projectId: z.string()
    .optional()
    .describe('ID of the project to add this to-do to. Use this when you know the specific project ID'),
  projectName: z.string()
    .optional()
    .describe('Name of the project to add this to-do to. Things.app will find the project by name and add the to-do there'),
  areaId: z.string()
    .optional()
    .describe('ID of the area of responsibility to assign this to-do to. Use this when you know the specific area ID'),
  areaName: z.string()
    .optional()
    .describe('Name of the area of responsibility to assign this to-do to (e.g., "Work", "Personal", "Health")'),
  headingId: z.string()
    .optional()
    .describe('ID of a specific heading within the target project to organize the to-do under'),
  headingName: z.string()
    .optional()
    .describe('Name of a heading within the target project to organize the to-do under (e.g., "Phase 1", "Research")'),
  completed: z.boolean()
    .optional()
    .default(false)
    .describe('Mark the to-do as completed immediately upon creation (default: false). Useful for logging already completed tasks'),
  canceled: z.boolean()
    .optional()
    .default(false)
    .describe('Mark the to-do as canceled immediately upon creation (default: false). Useful for recording tasks that are no longer needed'),
  creationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Override the creation date with a specific ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Useful for importing historical data'),
  completionDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Set a specific completion date using ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Only used when completed is true')
});

export function registerAddTodoTool(server: McpServer): void {
  server.tool(
    'add_todo',
    'Create a new to-do item in Things.app. Add notes, tags, checklist items, and assign to projects or areas.',
    addTodoSchema.shape,
    async (params) => {
      try {
        logger.info('Adding new to-do', { title: params.title });
        
        const urlParams: Record<string, any> = {
          title: params.title
        };

        // Map schema parameters to Things URL scheme parameters
        if (params.notes) urlParams.notes = params.notes;
        if (params.when) urlParams.when = params.when;
        if (params.deadline) urlParams.deadline = params.deadline;
        if (params.tags) urlParams.tags = params.tags.join(',');
        if (params.checklistItems) urlParams['checklist-items'] = params.checklistItems.join(',');
        if (params.projectId) urlParams['list-id'] = params.projectId;
        if (params.projectName) urlParams.list = params.projectName;
        if (params.areaId) urlParams['area-id'] = params.areaId;
        if (params.areaName) urlParams.area = params.areaName;
        if (params.headingId) urlParams['heading-id'] = params.headingId;
        if (params.headingName) urlParams.heading = params.headingName;
        if (params.completed) urlParams.completed = params.completed;
        if (params.canceled) urlParams.canceled = params.canceled;
        if (params.creationDate) urlParams['creation-date'] = params.creationDate;
        if (params.completionDate) urlParams['completion-date'] = params.completionDate;
        
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