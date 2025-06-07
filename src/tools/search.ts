import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

const searchSchema = z.object({
  query: z.string().describe('The search query to find items in Things')
});

export function registerSearchTool(server: McpServer): void {
  server.tool(
    'search',
    searchSchema.shape,
    async (params) => {
      try {
        logger.info('Searching in Things', { query: params.query });
        
        const urlParams: Record<string, any> = {
          query: params.query
        };
        
        const url = buildThingsUrl('search', urlParams);
        logger.debug('Generated URL', { url });
        
        await openThingsUrl(url);
        
        return {
          content: [{
            type: "text",
            text: `Successfully searched for: ${params.query}`
          }]
        };
      } catch (error) {
        logger.error('Failed to search', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}