import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { requireAuthToken } from '../utils/auth.js';
import { logger } from '../utils/logger.js';
import { executeJsonOperation, JsonOperation } from '../utils/json-operations.js';

const updateProjectSchema = z.object({
  id: z.string().min(1).describe('The unique ID of the project to update. This ID can be obtained from the list_projects tool'),
  title: z.string().min(1).optional().describe('Update the project title with a new clear name describing the project goal, outcome, or deliverable'),
  notes: z.string().max(10000).optional().describe('Replace existing notes with new project description, objectives, or context (max 10,000 characters). Supports markdown formatting. This completely replaces existing notes'),
  prependNotes: z.string().optional().describe('Add text to the beginning of existing notes without replacing them. Useful for adding project updates or new objectives'),
  appendNotes: z.string().optional().describe('Add text to the end of existing notes without replacing them. Useful for adding progress updates or new requirements'),
  when: z.enum(['today', 'tomorrow', 'evening', 'anytime', 'someday'])
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .describe('Reschedule when to start working on this project. Use "today" to start immediately, "tomorrow" to start next day, "evening" to start later today, "anytime" for flexible timing, "someday" for future consideration, or ISO date format (YYYY-MM-DD) for specific start date'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Update the project deadline in ISO date format (YYYY-MM-DD). Creates or updates deadline tracking and reminders in Things.app'),
  tags: z.array(z.string().min(1))
    .max(20)
    .optional()
    .describe('Replace all current tags with this new set of tag names (max 20 tags). This completely replaces existing tags for the project'),
  addTags: z.array(z.string().min(1))
    .max(20)
    .optional()
    .describe('Add these tag names to existing tags without removing current ones (max 20 total tags). Preserves existing project tags'),
  areaId: z.string()
    .optional()
    .describe('Move the project to a different area of responsibility by specifying the area ID'),
  areaName: z.string()
    .optional()
    .describe('Move the project to a different area of responsibility by specifying the area name (e.g., "Work", "Personal", "Health", "Finance")'),
  completed: z.boolean()
    .optional()
    .describe('Mark the project as completed (true) or reopen it (false). Completed projects are moved to the Logbook along with all their to-dos'),
  canceled: z.boolean()
    .optional()
    .describe('Mark the project as canceled (true) or restore it (false). Canceled projects are moved to the Trash along with all their to-dos'),
  creationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Override the creation date with a specific ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Useful for data migration or historical project tracking'),
  completionDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    .optional()
    .describe('Set a specific completion date using ISO8601 datetime (YYYY-MM-DDTHH:MM:SS). Only used when marking the project as completed')
});

export function registerUpdateProjectTool(server: McpServer): void {
  server.tool(
    'update_project',
    'Update an existing project in Things.app. Modify title, notes, scheduling, tags, area assignment, and completion status.',
    updateProjectSchema.shape,
    async (params) => {
      try {
        logger.info('Updating project', { id: params.id });
        
        const authToken = requireAuthToken();
        
        // Check if we're doing a completion/cancellation operation (use JSON)
        if (params.completed !== undefined || params.canceled !== undefined) {
          const attributes: Record<string, any> = {};
          
          if (params.completed !== undefined) {
            attributes.completed = params.completed;
            if (params.completionDate) {
              attributes['completion-date'] = params.completionDate;
            }
          }
          
          if (params.canceled !== undefined) {
            attributes.canceled = params.canceled;
          }
          
          const operation: JsonOperation = {
            type: 'project',
            operation: 'update',
            id: params.id,
            attributes
          };
          
          await executeJsonOperation(operation, authToken);
        } else {
          // Use URL scheme for other updates
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
          if (params.areaId) urlParams['area-id'] = params.areaId;
          if (params.areaName) urlParams.area = params.areaName;
          if (params.creationDate) urlParams['creation-date'] = params.creationDate;
          
          const url = buildThingsUrl('update-project', urlParams);
          logger.debug('Generated URL', { url: url.replace(authToken, '***') });
          
          await openThingsUrl(url);
        }
        
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