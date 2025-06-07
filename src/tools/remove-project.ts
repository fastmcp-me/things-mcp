import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { deleteProject } from '../utils/applescript.js';
import { logger } from '../utils/logger.js';

const removeProjectSchema = z.object({
  id: z.string().describe('The unique ID of the project to remove')
});

export function registerRemoveProjectTool(server: McpServer): void {
  server.tool(
    'remove_project',
    'Permanently delete a project from Things.app by ID. THIS ACTION CANNOT BE UNDONE. All to-dos within the project will also be deleted.',
    removeProjectSchema.shape,
    async (params) => {
      try {
        logger.info('Removing project', { params });

        await deleteProject(params.id);

        return {
          content: [{
            type: "text",
            text: `Successfully removed project with ID: ${params.id}`
          }]
        };
      } catch (error) {
        logger.error('Failed to remove project', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}