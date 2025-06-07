import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const showSchema = z.object({
  id: z.string().optional().describe('The view or item to show (today, anytime, upcoming, someday, logbook, deadlines, or a specific item ID)'),
  query: z.string().optional().describe('Optional search query to filter the view')
});

export function registerShowTool(server: McpServer): void {
  server.tool(
    'show',
    showSchema.shape,
    async (params) => {
      try {
        logger.info('Showing view or item', { id: params.id, query: params.query });
        
        const urlParams: Record<string, any> = {
          id: params.id,
          query: params.query
        };
        
        const url = buildThingsUrl('show', urlParams);
        logger.debug('Generated URL', { url });
        
        await openThingsUrl(url);
        
        const target = params.id || 'default view';
        const queryInfo = params.query ? ` with query "${params.query}"` : '';
        
        return {
          content: [{
            type: "text",
            text: `Successfully navigated to ${target}${queryInfo}`
          }]
        };
      } catch (error) {
        logger.error('Failed to show view', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}