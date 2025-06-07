import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listProjects, ListOptions } from '../utils/applescript.js';
import { logger } from '../utils/logger.js';

const listProjectsSchema = z.object({
  status: z.enum(['open', 'completed', 'canceled', 'all']).optional().default('open').describe('Filter by completion status'),
  area: z.string().optional().describe('Filter by area name'),
  tags: z.array(z.string()).optional().describe('Filter by tags (projects must have all specified tags)'),
  due_before: z.string().optional().describe('Filter projects due before this date (ISO format)'),
  due_after: z.string().optional().describe('Filter projects due after this date (ISO format)'),
  modified_after: z.string().optional().describe('Filter projects modified after this date (ISO format)'),
  limit: z.number().int().positive().max(1000).optional().describe('Maximum number of projects to return (default: 100)')
});

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    'list_projects',
    'Retrieve and display projects from Things.app with filtering options. Filter by status, area, tags, due dates, and modification dates.',
    listProjectsSchema.shape,
    async (params) => {
      try {
        logger.info('Listing projects', { params });

        const options: ListOptions = {
          status: params.status as any,
          area: params.area,
          tags: params.tags,
          limit: params.limit || 100
        };

        // Parse date filters if provided
        if (params.due_before) {
          options.dueBefore = new Date(params.due_before);
        }
        if (params.due_after) {
          options.dueAfter = new Date(params.due_after);
        }
        if (params.modified_after) {
          options.modifiedAfter = new Date(params.modified_after);
        }

        const projects = await listProjects(options);

        // Apply additional filters
        let filteredProjects = projects;

        if (options.area) {
          filteredProjects = filteredProjects.filter(project => 
            project.area?.toLowerCase().includes(options.area!.toLowerCase())
          );
        }

        if (options.tags && options.tags.length > 0) {
          filteredProjects = filteredProjects.filter(project => 
            options.tags!.every(tag => 
              project.tags.some(projectTag => 
                projectTag.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }

        if (options.dueBefore) {
          filteredProjects = filteredProjects.filter(project => 
            project.dueDate && project.dueDate < options.dueBefore!
          );
        }

        if (options.dueAfter) {
          filteredProjects = filteredProjects.filter(project => 
            project.dueDate && project.dueDate > options.dueAfter!
          );
        }

        if (options.modifiedAfter) {
          filteredProjects = filteredProjects.filter(project => 
            project.modificationDate > options.modifiedAfter!
          );
        }

        // Apply limit
        if (options.limit) {
          filteredProjects = filteredProjects.slice(0, options.limit);
        }

        const resultText = formatProjectsAsText(filteredProjects);

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      } catch (error) {
        logger.error('Failed to list projects', { error: error instanceof Error ? error.message : error });
        throw error;
      }
    }
  );
}

function formatProjectsAsText(projects: any[]): string {
  if (projects.length === 0) {
    return 'No projects found matching the criteria.';
  }

  let result = `Found ${projects.length} project(s):\n\n`;

  for (const project of projects) {
    result += `• ${project.name}`;
    
    if (project.status === 'completed') {
      result += ' ✓';
    } else if (project.status === 'canceled') {
      result += ' ✗';
    }
    
    result += `\n  ID: ${project.id}`;
    
    if (project.area) {
      result += `\n  Area: ${project.area}`;
    }
    
    if (project.tags && project.tags.length > 0) {
      result += `\n  Tags: ${project.tags.join(', ')}`;
    }
    
    if (project.dueDate) {
      result += `\n  Due: ${project.dueDate.toISOString().split('T')[0]}`;
    }
    
    if (project.notes) {
      const truncatedNotes = project.notes.length > 100 
        ? project.notes.substring(0, 100) + '...' 
        : project.notes;
      result += `\n  Notes: ${truncatedNotes}`;
    }
    
    result += '\n\n';
  }

  return result.trim();
}