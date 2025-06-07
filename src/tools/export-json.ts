import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';

const exportJsonSchema = z.object({
  includeCompleted: z.boolean()
    .optional()
    .default(false)
    .describe('Include completed/canceled tasks and projects in the export (default: false)'),
  includeTrash: z.boolean()
    .optional()
    .default(false)
    .describe('Include trashed items in the export (default: false). Use with caution as this includes deleted data'),
  minimal: z.boolean()
    .optional()
    .default(false)
    .describe('Export minimal data structure with only essential fields (default: false). Reduces output size for processing'),
  prettify: z.boolean()
    .optional()
    .default(true)
    .describe('Pretty-print JSON with indentation (default: true). Set to false for compact single-line output')
});

function findThingsDatabase(): string {
  const homeDir = process.env.HOME || '/Users/' + process.env.USER;
  const thingsGroupContainer = join(homeDir, 'Library/Group Containers');
  
  if (!existsSync(thingsGroupContainer)) {
    throw new Error('Things group container not found. Please ensure Things.app is installed on macOS.');
  }
  
  const containers = readdirSync(thingsGroupContainer);
  const thingsContainer = containers.find(dir => 
    dir.includes('JLMPQHK86H.com.culturedcode.ThingsMac')
  );
  
  if (!thingsContainer) {
    throw new Error('Things container not found. Please ensure Things.app is installed and has been launched at least once.');
  }
  
  const containerPath = join(thingsGroupContainer, thingsContainer);
  const contents = readdirSync(containerPath);
  const thingsDataDir = contents.find(dir => dir.startsWith('ThingsData-'));
  
  if (!thingsDataDir) {
    throw new Error('ThingsData directory not found.');
  }
  
  const dbPath = join(containerPath, thingsDataDir, 'Things Database.thingsdatabase', 'main.sqlite');
  
  if (!existsSync(dbPath)) {
    throw new Error('Things database file not found.');
  }
  
  return dbPath;
}

function executeSqlQuery(dbPath: string, query: string): any[] {
  try {
    const result = execSync(`sqlite3 "${dbPath}" "${query}"`, { 
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024 // 50MB for large exports
    });
    
    if (!result.trim()) {
      return [];
    }
    
    return result.trim().split('\n').map(row => {
      return row.split('|');
    });
  } catch (error) {
    logger.error('SQL Query failed', { error: error instanceof Error ? error.message : error, query });
    return [];
  }
}

function formatDate(timestamp: string): string | null {
  if (!timestamp || timestamp === '' || timestamp === 'NULL') {
    return null;
  }
  
  try {
    const date = new Date((parseFloat(timestamp) + 978307200) * 1000);
    return date.toISOString();
  } catch {
    return null;
  }
}

function exportThingsData(params: any): any {
  const dbPath = findThingsDatabase();
  logger.info('Exporting Things database', { path: dbPath, params });
  
  // Build status filters
  let statusFilter = 'status = 0 AND trashed = 0'; // Open items only
  if (params.includeCompleted && params.includeTrash) {
    statusFilter = '1=1'; // All items
  } else if (params.includeCompleted) {
    statusFilter = 'trashed = 0'; // All non-trashed
  } else if (params.includeTrash) {
    statusFilter = 'status = 0'; // Open and trashed
  }
  
  const export_data: any = {
    export_info: {
      exported_at: new Date().toISOString(),
      source: 'Things MCP Server',
      database_path: dbPath,
      filters: {
        include_completed: params.includeCompleted,
        include_trash: params.includeTrash,
        minimal: params.minimal
      }
    }
  };
  
  // Export Areas
  const areasData = executeSqlQuery(dbPath, "SELECT uuid, title, visible, index1 FROM TMArea ORDER BY index1");
  export_data.areas = areasData.map(row => {
    const area: any = {
      id: row[0],
      title: row[1] || null,
      visible: row[2] === '1',
      sort_order: parseInt(row[3]) || 0
    };
    
    if (params.minimal) {
      return { id: area.id, title: area.title };
    }
    return area;
  });
  
  // Export Tags
  const tagsData = executeSqlQuery(dbPath, "SELECT uuid, title, shortcut, index1 FROM TMTag ORDER BY index1");
  export_data.tags = tagsData.map(row => {
    const tag: any = {
      id: row[0],
      title: row[1] || null,
      shortcut: row[2] || null,
      sort_order: parseInt(row[3]) || 0
    };
    
    if (params.minimal) {
      return { id: tag.id, title: tag.title };
    }
    return tag;
  });
  
  // Export Tasks and Projects
  const tasksQuery = params.minimal 
    ? `SELECT uuid, title, type, status, trashed, area, project FROM TMTask WHERE ${statusFilter} ORDER BY creationDate`
    : `SELECT uuid, title, notes, type, status, trashed, creationDate, userModificationDate, startDate, deadline, completionDate, area, project, checklistItemsCount, openChecklistItemsCount, index1 FROM TMTask WHERE ${statusFilter} ORDER BY creationDate`;
  
  const tasksData = executeSqlQuery(dbPath, tasksQuery);
  export_data.tasks = tasksData.map(row => {
    if (params.minimal) {
      return {
        id: row[0],
        title: row[1] || null,
        type: parseInt(row[2]) || 0, // 0=task, 1=project, 2=heading
        status: parseInt(row[3]) || 0, // 0=open, 3=completed, 2=canceled
        trashed: row[4] === '1',
        area_id: row[5] || null,
        project_id: row[6] || null
      };
    }
    
    const task: any = {
      id: row[0],
      title: row[1] || null,
      notes: row[2] || null,
      type: parseInt(row[3]) || 0,
      status: parseInt(row[4]) || 0,
      trashed: row[5] === '1',
      creation_date: formatDate(row[6]),
      modification_date: formatDate(row[7]),
      start_date: formatDate(row[8]),
      deadline: formatDate(row[9]),
      completion_date: formatDate(row[10]),
      area_id: row[11] || null,
      project_id: row[12] || null,
      checklist_items_total: parseInt(row[13]) || 0,
      checklist_items_open: parseInt(row[14]) || 0,
      sort_order: parseInt(row[15]) || 0
    };
    
    return task;
  });
  
  // Export Task-Tag relationships
  const taskTagData = executeSqlQuery(dbPath, "SELECT tasks, tags FROM TMTaskTag");
  export_data.task_tags = taskTagData.map(row => ({
    task_id: row[0],
    tag_id: row[1]
  }));
  
  // Export Checklist Items (if not minimal)
  if (!params.minimal) {
    const checklistQuery = `SELECT uuid, title, status, creationDate, task FROM TMChecklistItem WHERE task IN (SELECT uuid FROM TMTask WHERE ${statusFilter}) ORDER BY creationDate`;
    const checklistData = executeSqlQuery(dbPath, checklistQuery);
    export_data.checklist_items = checklistData.map(row => ({
      id: row[0],
      title: row[1] || null,
      status: parseInt(row[2]) || 0, // 0=open, 3=completed
      creation_date: formatDate(row[3]),
      task_id: row[4]
    }));
  }
  
  // Add summary statistics
  export_data.summary = {
    total_areas: export_data.areas.length,
    total_tags: export_data.tags.length,
    total_items: export_data.tasks.length,
    total_tasks: export_data.tasks.filter((t: any) => t.type === 0).length,
    total_projects: export_data.tasks.filter((t: any) => t.type === 1).length,
    total_headings: export_data.tasks.filter((t: any) => t.type === 2).length,
    open_items: export_data.tasks.filter((t: any) => t.status === 0 && !t.trashed).length,
    completed_items: export_data.tasks.filter((t: any) => t.status === 3).length,
    trashed_items: export_data.tasks.filter((t: any) => t.trashed).length
  };
  
  if (!params.minimal) {
    export_data.summary.total_checklist_items = export_data.checklist_items?.length || 0;
    export_data.summary.total_task_tag_relationships = export_data.task_tags.length;
  }
  
  return export_data;
}

export function registerExportJsonTool(server: McpServer): void {
  server.tool(
    'export_json',
    'Export complete Things database as structured JSON for debugging, backup, or data processing.',
    exportJsonSchema.shape,
    async (params) => {
      try {
        // Validate macOS platform
        if (process.platform !== 'darwin') {
          throw new Error('Things database access is only available on macOS');
        }

        logger.info('Exporting Things database to JSON', { 
          includeCompleted: params.includeCompleted,
          includeTrash: params.includeTrash,
          minimal: params.minimal,
          prettify: params.prettify
        });
        
        const data = exportThingsData(params);
        const jsonOutput = params.prettify ? 
          JSON.stringify(data, null, 2) : 
          JSON.stringify(data);
        
        return {
          content: [{
            type: "text",
            text: jsonOutput
          }]
        };
      } catch (error) {
        logger.error('Failed to export Things database', { 
          error: error instanceof Error ? error.message : error 
        });
        throw error;
      }
    }
  );
}