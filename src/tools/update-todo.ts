import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { requireAuthToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

const updateTodoSchema = z.object({
  id: z.string().min(1).describe('The unique ID of the to-do to update. This ID can be obtained from the list_todos tool'),
  title: z.string().min(1).optional().describe('Update the to-do title with a new clear, actionable description of the task'),
  notes: z.string().max(10000).optional().describe('Replace existing notes with new content (max 10,000 characters). Supports markdown formatting. This completely replaces existing notes'),
  prependNotes: z.string().optional().describe('Add text to the beginning of existing notes without replacing them. Useful for adding updates or new information'),
  appendNotes: z.string().optional().describe('Add text to the end of existing notes without replacing them. Useful for adding follow-up information or status updates'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday'])
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .describe('Reschedule the to-do. Use "today" for immediate action, "tomorrow" for next day, "evening" for later today, "anytime" for no specific time, "someday" for future consideration, or ISO date format (YYYY-MM-DD) for specific date'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Update the deadline in ISO date format (YYYY-MM-DD). Creates or updates deadline reminder in Things.app'),
  tags: z.array(z.string().min(1))
    .max(20)
    .optional()
    .describe('Replace all current tags with this new set of tag names (max 20 tags). This completely replaces existing tags'),
  addTags: z.array(z.string().min(1))
    .max(20)
    .optional()
    .describe('Add these tag names to existing tags without removing current ones (max 20 total tags). Preserves existing tags'),
  checklistItems: z.array(z.string().min(1))
    .max(100)
    .optional()
    .describe('Replace all current checklist items with this new set (max 100 items). This completely replaces existing checklist items'),
  prependChecklistItems: z.array(z.string().min(1))
    .optional()
    .describe('Add these checklist items to the beginning of the existing checklist without removing current items'),
  appendChecklistItems: z.array(z.string().min(1))
    .optional()
    .describe('Add these checklist items to the end of the existing checklist without removing current items'),
  projectId: z.string()
    .optional()
    .describe('Move the to-do to a different project by specifying the project ID'),
  projectName: z.string()
    .optional()
    .describe('Move the to-do to a different project by specifying the project name. Things.app will find the project by name'),
  areaId: z.string()
    .optional()
    .describe('Move the to-do to a different area by specifying the area ID'),
  areaName: z.string()
    .optional()
    .describe('Move the to-do to a different area by specifying the area name (e.g., "Work", "Personal", "Health")'),
  headingId: z.string()
    .optional()
    .describe('Move the to-do under a specific heading within the target project by heading ID'),
  headingName: z.string()
    .optional()
    .describe('Move the to-do under a specific heading within the target project by heading name (e.g., "Phase 1", "Research")'),
  completed: z.boolean()
    .optional()
    .describe('Mark the to-do as completed (true) or reopen it (false). Completed to-dos are moved to the Logbook'),
  canceled: z.boolean()
    .optional()
    .describe('Mark the to-do as canceled (true) or restore it (false). Canceled to-dos are moved to the Trash'),
  creationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Override the creation date with a specific ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Useful for data migration'),
  completionDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Set a specific completion date using ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Only used when marking as completed')
});

export function registerUpdateTodoTool(server: McpServer): void {
  server.tool(
    'update_todo',
    'Update an existing to-do item in Things.app with comprehensive modification options. Requires THINGS_AUTH_TOKEN. Can modify any property including title, notes, scheduling, tags, checklist items, project/area assignment, and completion status. Supports both replacement and append/prepend operations for notes and checklist items.',
    updateTodoSchema.shape,
    async (params) => {
      try {
        logger.info('Updating to-do', { id: params.id });
        
        const authToken = requireAuthToken();
        
        const urlParams: Record<string, any> = {
          id: params.id,
          'auth-token': authToken
        };

        // Map schema parameters to Things URL scheme parameters
        if (params.title) urlParams.title = params.title;
        if (params.notes) urlParams.notes = params.notes;
        if (params.prependNotes) urlParams['prepend-notes'] = params.prependNotes;
        if (params.appendNotes) urlParams['append-notes'] = params.appendNotes;
        if (params.when) urlParams.when = params.when;
        if (params.deadline) urlParams.deadline = params.deadline;
        if (params.tags) urlParams.tags = params.tags.join(',');
        if (params.addTags) urlParams['add-tags'] = params.addTags.join(',');
        if (params.checklistItems) urlParams['checklist-items'] = params.checklistItems.join(',');
        if (params.prependChecklistItems) urlParams['prepend-checklist-items'] = params.prependChecklistItems.join(',');
        if (params.appendChecklistItems) urlParams['append-checklist-items'] = params.appendChecklistItems.join(',');
        if (params.projectId) urlParams['list-id'] = params.projectId;
        if (params.projectName) urlParams.list = params.projectName;
        if (params.areaId) urlParams['area-id'] = params.areaId;
        if (params.areaName) urlParams.area = params.areaName;
        if (params.headingId) urlParams['heading-id'] = params.headingId;
        if (params.headingName) urlParams.heading = params.headingName;
        if (params.completed !== undefined) urlParams.completed = params.completed;
        if (params.canceled !== undefined) urlParams.canceled = params.canceled;
        if (params.creationDate) urlParams['creation-date'] = params.creationDate;
        if (params.completionDate) urlParams['completion-date'] = params.completionDate;
        
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