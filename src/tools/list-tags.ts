import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listTags } from '../utils/applescript.js';
import { logger } from '../utils/logger.js';

const listTagsSchema = z.object({
  limit: z.number().int().positive().max(1000).optional().describe('Maximum number of tags to return (default: 100)')
});

export function registerListTagsTool(server: McpServer): void {
  server.tool(
    'list_tags',
    'Retrieve and display all tags available in Things.app. Tags are used for categorizing and filtering to-dos and projects.',
    listTagsSchema.shape,
    async (params) => {
      try {
        logger.info('Listing tags', { params });

        const tags = await listTags();

        // Apply limit
        const limitedTags = params.limit ? tags.slice(0, params.limit) : tags.slice(0, 100);

        const resultText = formatTagsAsText(limitedTags);

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      } catch (error) {
        logger.error('Failed to list tags', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}

function formatTagsAsText(tags: any[]): string {
  if (tags.length === 0) {
    return 'No tags found.';
  }

  let result = `Found ${tags.length} tag(s):\n\n`;

  for (const tag of tags) {
    result += `• ${tag.name} (ID: ${tag.id})\n`;
  }

  return result.trim();
}