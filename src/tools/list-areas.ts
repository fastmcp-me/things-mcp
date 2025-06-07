import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listAreas } from '../utils/applescript.js';
import { logger } from '../utils/logger.js';

const listAreasSchema = z.object({
  limit: z.number().int().positive().max(1000).optional().describe('Maximum number of areas to return (default: 100)')
});

export function registerListAreasTool(server: McpServer): void {
  server.tool(
    'list_areas',
    'Retrieve and display all areas of responsibility from Things.app. Areas are top-level organizational containers.',
    listAreasSchema.shape,
    async (params) => {
      try {
        logger.info('Listing areas', { params });

        const areas = await listAreas();

        // Apply limit
        const limitedAreas = params.limit ? areas.slice(0, params.limit) : areas.slice(0, 100);

        const resultText = formatAreasAsText(limitedAreas);

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      } catch (error) {
        logger.error('Failed to list areas', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}

function formatAreasAsText(areas: any[]): string {
  if (areas.length === 0) {
    return 'No areas found.';
  }

  let result = `Found ${areas.length} area(s):\n\n`;

  for (const area of areas) {
    result += `• ${area.name}\n  ID: ${area.id}`;
    
    if (area.notes) {
      const truncatedNotes = area.notes.length > 100 
        ? area.notes.substring(0, 100) + '...' 
        : area.notes;
      result += `\n  Notes: ${truncatedNotes}`;
    }
    
    if (area.tags && area.tags.length > 0) {
      result += `\n  Tags: ${area.tags.join(', ')}`;
    }
    
    result += '\n\n';
  }

  return result.trim();
}