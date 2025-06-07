import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { deleteTodo } from '../utils/applescript.js';
import { logger } from '../utils/logger.js';

const removeTodoSchema = z.object({
  id: z.string().describe('The unique ID of the todo to remove')
});

export function registerRemoveTodoTool(server: McpServer): void {
  server.tool(
    'remove_todo',
    'Permanently delete a to-do item from Things.app by ID. THIS ACTION CANNOT BE UNDONE. Use with caution.',
    removeTodoSchema.shape,
    async (params) => {
      try {
        logger.info('Removing todo', { params });

        await deleteTodo(params.id);

        return {
          content: [{
            type: "text",
            text: `Successfully removed todo with ID: ${params.id}`
          }]
        };
      } catch (error) {
        logger.error('Failed to remove todo', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}