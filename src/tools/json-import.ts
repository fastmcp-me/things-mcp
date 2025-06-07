import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildThingsUrl, openThingsUrl } from '../utils/url-builder.js';
import { logger } from '../utils/logger.js';

// Define schemas for JSON import structure
const checklistItemSchema = z.object({
  title: z.string(),
  completed: z.boolean().optional()
});

const jsonTodoSchema = z.object({
  type: z.literal('to-do'),
  attributes: z.object({
    title: z.string(),
    notes: z.string().optional(),
    when: z.string().optional(),
    deadline: z.string().optional(),
    tags: z.array(z.string()).optional(),
    'checklist-items': z.array(checklistItemSchema).optional(),
    completed: z.boolean().optional(),
    canceled: z.boolean().optional()
  })
});

const jsonHeadingSchema = z.object({
  type: z.literal('heading'),
  attributes: z.object({
    title: z.string()
  })
});

const jsonProjectSchema = z.object({
  type: z.literal('project'),
  attributes: z.object({
    title: z.string(),
    notes: z.string().optional(),
    when: z.string().optional(),
    deadline: z.string().optional(),
    tags: z.array(z.string()).optional(),
    area: z.string().optional(),
    items: z.array(z.union([jsonTodoSchema, jsonHeadingSchema])).optional(),
    completed: z.boolean().optional(),
    canceled: z.boolean().optional()
  })
});

const jsonImportSchema = z.object({
  data: z.array(z.union([jsonTodoSchema, jsonProjectSchema])).describe('Array of items to import (to-dos and/or projects)'),
  reveal: z.boolean().optional().describe('Whether to reveal the imported items in Things after import')
});

export function registerJsonImportTool(server: McpServer): void {
  server.tool(
    'json_import',
    jsonImportSchema.shape,
    async (params) => {
      try {
        logger.info('Importing items via JSON', { itemCount: params.data.length });
        
        // Convert the data to JSON string
        const jsonData = JSON.stringify(params.data);
        
        const urlParams: Record<string, any> = {
          data: jsonData,
          reveal: params.reveal
        };
        
        const url = buildThingsUrl('json', urlParams);
        logger.debug('Generated URL', { 
          url: url.substring(0, 100) + '...', // Truncate for logging
          itemCount: params.data.length 
        });
        
        await openThingsUrl(url);
        
        // Count items by type
        const todoCount = params.data.filter(item => item.type === 'to-do').length;
        const projectCount = params.data.filter(item => item.type === 'project').length;
        
        const itemSummary = [];
        if (todoCount > 0) itemSummary.push(`${todoCount} to-do${todoCount > 1 ? 's' : ''}`);
        if (projectCount > 0) itemSummary.push(`${projectCount} project${projectCount > 1 ? 's' : ''}`);
        
        return {
          content: [{
            type: "text",
            text: `Successfully imported ${itemSummary.join(' and ')} (total: ${params.data.length} items)`
          }]
        };
      } catch (error) {
        logger.error('Failed to import JSON data', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}