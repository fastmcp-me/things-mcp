import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';

interface ThingsTask {
  id: string;
  title: string;
  notes?: string;
  type: 'task' | 'project' | 'heading';
  creationDate?: string;
  startDate?: string;
  deadline?: string;
  area?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
  checklistItems?: {
    total: number;
    open: number;
  };
  tasks?: ThingsTask[];
  thingsUrl: string;
}

interface ThingsArea {
  id: string;
  name: string;
  visible?: boolean;
  projects?: ThingsTask[];
  tasks?: ThingsTask[];
  thingsUrl: string;
}

interface ThingsTag {
  id: string;
  name: string;
  shortcut?: string;
  taskCount: number;
  thingsUrl: string;
}

interface ThingsSummary {
  summary: {
    totalOpenTasks: number;
    totalActiveProjects: number;
    totalAreas: number;
    totalTags: number;
    lastUpdated: string;
  };
  areas?: ThingsArea[];
  inboxTasks?: ThingsTask[];
  todayTasks?: ThingsTask[];
  projects?: ThingsTask[];
  tags?: ThingsTag[];
  urls: {
    showToday: string;
    showInbox: string;
    showProjects: string;
    showAreas: string;
  };
}

const summarySchema = z.object({
  format: z.enum(['markdown', 'json'])
    .optional()
    .default('markdown')
    .describe('Output format for the summary. Use "markdown" for readable formatted summary (default) or "json" for structured data that can be processed by other tools'),
  includeCompleted: z.boolean()
    .optional()
    .default(false)
    .describe('Include completed tasks and projects in the summary (default: false). When true, shows recently completed items for reference'),
  areas: z.array(z.string())
    .optional()
    .describe('Filter to show only specific areas by name (e.g., ["Work", "Personal"]). If not provided, shows all areas'),
  tags: z.array(z.string())
    .optional()
    .describe('Filter to show only tasks/projects with specific tags (e.g., ["urgent", "review"]). If not provided, shows all items'),
  projects: z.array(z.string())
    .optional()
    .describe('Filter to show only specific projects by name. If not provided, shows all projects'),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date in YYYY-MM-DD format'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date in YYYY-MM-DD format')
  })
    .optional()
    .describe('Filter items by creation date, start date, or deadline within the specified range'),
  includeInactive: z.boolean()
    .optional()
    .default(false)
    .describe('Include inactive/hidden areas and empty projects in the summary (default: false)')
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
      maxBuffer: 10 * 1024 * 1024
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

function formatDate(timestamp: string): string {
  if (!timestamp || timestamp === '' || timestamp === 'NULL') {
    return '';
  }
  
  try {
    const date = new Date((parseFloat(timestamp) + 978307200) * 1000);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function generateThingsUrl(type: 'show' | 'update', id?: string, params?: Record<string, string>): string {
  let url = `things:///${type}`;
  
  if (id) {
    url += `?id=${encodeURIComponent(id)}`;
  }
  
  if (params) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (id) {
      url += `&${paramString}`;
    } else {
      url += `?${paramString}`;
    }
  }
  
  return url;
}

function compressObject(obj: any): any {
  if (Array.isArray(obj)) {
    const filtered = obj.map(compressObject).filter(item => item !== null && item !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  
  if (obj && typeof obj === 'object') {
    const compressed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const compressedValue = compressObject(value);
      
      if (compressedValue === null || 
          compressedValue === undefined || 
          compressedValue === '' ||
          (Array.isArray(compressedValue) && compressedValue.length === 0) ||
          (key === 'checklistItems' && compressedValue.total === 0 && compressedValue.open === 0)) {
        continue;
      }
      
      compressed[key] = compressedValue;
    }
    
    return Object.keys(compressed).length > 0 ? compressed : undefined;
  }
  
  return obj;
}

function getThingsSummary(params: any): ThingsSummary {
  const dbPath = findThingsDatabase();
  logger.info('Found Things database', { path: dbPath });
  
  // Build status filter
  let statusFilter = 'status = 0 AND trashed = 0';
  if (params.includeCompleted) {
    statusFilter = 'trashed = 0';
  }
  
  // Get all areas
  const areasData = executeSqlQuery(dbPath, "SELECT uuid, title, visible FROM TMArea");
  const areas: ThingsArea[] = areasData.map(row => {
    const area: any = {
      id: row[0],
      name: row[1] || 'Unnamed Area',
      thingsUrl: generateThingsUrl('show', row[0])
    };
    
    if (row[2] === '1') area.visible = true;
    
    return area;
  });
  
  // Filter areas if specified
  let filteredAreas = areas;
  if (params.areas && params.areas.length > 0) {
    filteredAreas = areas.filter(area => params.areas.includes(area.name));
  }
  
  // Get all tags
  const tagsData = executeSqlQuery(dbPath, "SELECT uuid, title, shortcut FROM TMTag");
  const tags: ThingsTag[] = tagsData.map(row => ({
    id: row[0],
    name: row[1] || 'Unnamed Tag',
    shortcut: row[2] || undefined,
    taskCount: 0,
    thingsUrl: generateThingsUrl('show', undefined, { filter: row[1] })
  }));
  
  // Get open tasks and projects
  const tasksData = executeSqlQuery(dbPath, 
    `SELECT uuid, title, notes, type, creationDate, startDate, deadline, area, project, checklistItemsCount, openChecklistItemsCount FROM TMTask WHERE ${statusFilter}`
  );
  
  // Create a map for quick lookup of project names
  const projectMap = new Map();
  tasksData.forEach(row => {
    if (row[3] === '1') {
      projectMap.set(row[0], row[1]);
    }
  });
  
  const allTasks: ThingsTask[] = tasksData.map(row => {
    const taskType = row[3] === '0' ? 'task' : row[3] === '1' ? 'project' : 'heading';
    
    const areaInfo = areas.find(area => area.id === row[7]);
    const projectName = row[8] ? projectMap.get(row[8]) : null;
    
    const task: any = {
      id: row[0],
      title: row[1] || 'Untitled',
      type: taskType,
      thingsUrl: generateThingsUrl('show', row[0])
    };
    
    if (row[2]) task.notes = row[2];
    
    const creationDate = formatDate(row[4]);
    if (creationDate) task.creationDate = creationDate;
    
    const startDate = formatDate(row[5]);
    if (startDate) task.startDate = startDate;
    
    const deadline = formatDate(row[6]);
    if (deadline) task.deadline = deadline;
    
    if (areaInfo) task.area = { id: areaInfo.id, name: areaInfo.name };
    if (projectName) task.project = { id: row[8], name: projectName };
    
    const checklistTotal = parseInt(row[9]) || 0;
    const checklistOpen = parseInt(row[10]) || 0;
    if (checklistTotal > 0 || checklistOpen > 0) {
      task.checklistItems = { total: checklistTotal, open: checklistOpen };
    }
    
    return task;
  });
  
  // Get task-tag relationships
  const taskTagData = executeSqlQuery(dbPath, "SELECT tasks, tags FROM TMTaskTag");
  taskTagData.forEach(row => {
    const task = allTasks.find(t => t.id === row[0]);
    const tag = tags.find(t => t.id === row[1]);
    if (task && tag) {
      if (!task.tags) task.tags = [];
      task.tags.push({ id: tag.id, name: tag.name });
      tag.taskCount++;
    }
  });
  
  // Apply tag filtering
  let filteredTasks = allTasks;
  if (params.tags && params.tags.length > 0) {
    filteredTasks = allTasks.filter(task => 
      task.tags && task.tags.some(tag => params.tags.includes(tag.name))
    );
  }
  
  // Apply project filtering
  if (params.projects && params.projects.length > 0) {
    filteredTasks = filteredTasks.filter(task => 
      (task.type === 'project' && params.projects.includes(task.title)) ||
      (task.project && params.projects.includes(task.project.name))
    );
  }
  
  // Apply date range filtering
  if (params.dateRange) {
    filteredTasks = filteredTasks.filter(task => {
      const dates = [task.creationDate, task.startDate, task.deadline].filter(Boolean);
      return dates.some(date => {
        if (date && params.dateRange.from && date < params.dateRange.from) return false;
        if (date && params.dateRange.to && date > params.dateRange.to) return false;
        return true;
      });
    });
  }
  
  // Separate tasks by type
  const projects = filteredTasks.filter(task => task.type === 'project');
  const tasks = filteredTasks.filter(task => task.type === 'task');
  const inboxTasks = tasks.filter(task => !task.area && !task.project);
  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.startDate === today;
  });
  
  // Organize tasks by area and add project tasks
  filteredAreas.forEach(area => {
    const areaProjects = projects.filter(project => project.area?.id === area.id);
    const areaTasks = tasks.filter(task => task.area?.id === area.id && !task.project);
    
    if (areaProjects.length > 0) area.projects = areaProjects;
    if (areaTasks.length > 0) area.tasks = areaTasks;
  });
  
  // Add tasks to their respective projects
  projects.forEach(project => {
    const projectTasks = tasks.filter(task => task.project?.id === project.id);
    if (projectTasks.length > 0) {
      (project as any).tasks = projectTasks;
    }
  });
  
  // Filter areas and tags based on includeInactive
  const activeAreas = params.includeInactive ? 
    filteredAreas : 
    filteredAreas.filter(area => 
      (area.projects && area.projects.length > 0) || 
      (area.tasks && area.tasks.length > 0)
    );
  
  const activeTags = params.includeInactive ? 
    tags : 
    tags.filter(tag => tag.taskCount > 0);
  
  const summary: any = {
    summary: {
      totalOpenTasks: tasks.length,
      totalActiveProjects: projects.length,
      totalAreas: activeAreas.length,
      totalTags: activeTags.length,
      lastUpdated: new Date().toISOString()
    },
    urls: {
      showToday: generateThingsUrl('show', undefined, { list: 'today' }),
      showInbox: generateThingsUrl('show', undefined, { list: 'inbox' }),
      showProjects: generateThingsUrl('show', undefined, { list: 'projects' }),
      showAreas: generateThingsUrl('show', undefined, { list: 'areas' })
    }
  };
  
  // Only add sections that have content
  if (activeAreas.length > 0) summary.areas = activeAreas;
  if (inboxTasks.length > 0) summary.inboxTasks = inboxTasks;
  if (todayTasks.length > 0) summary.todayTasks = todayTasks;
  if (projects.length > 0) summary.projects = projects;
  if (activeTags.length > 0) summary.tags = activeTags;
  
  return compressObject(summary);
}

function generateMarkdownSummary(data: ThingsSummary): string {
  const lines: string[] = [];
  
  // Header
  lines.push('# Things Database Summary');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
  lines.push(`**Last Updated:** ${data.summary.lastUpdated}`);
  lines.push('');
  
  // Overview Statistics
  lines.push('## 📊 Overview');
  lines.push('');
  lines.push(`- **Open Tasks:** ${data.summary.totalOpenTasks}`);
  lines.push(`- **Active Projects:** ${data.summary.totalActiveProjects}`);
  lines.push(`- **Areas:** ${data.summary.totalAreas}`);
  lines.push(`- **Tags in Use:** ${data.summary.totalTags}`);
  lines.push('');
  
  // Today Tasks (high priority section)
  if (data.todayTasks && data.todayTasks.length > 0) {
    lines.push('## 🎯 Today');
    lines.push('');
    
    data.todayTasks.forEach(task => {
      let taskLine = `- [ ] **${task.title}**`;
      if (task.deadline) taskLine += ` 🔴 (due: ${task.deadline})`;
      lines.push(taskLine);
      lines.push(`  - *ID: ${task.id}*`);
      
      if (task.notes) {
        lines.push(`  - 📝 ${task.notes}`);
      }
      if (task.area) {
        lines.push(`  - 📁 Area: ${task.area.name}`);
      }
      if (task.project) {
        lines.push(`  - 📂 Project: ${task.project.name}`);
      }
      if (task.tags && task.tags.length > 0) {
        lines.push(`  - 🏷️ Tags: ${task.tags.map(t => `#${t.name}`).join(', ')}`);
      }
      if (task.checklistItems && task.checklistItems.total > 0) {
        lines.push(`  - ✅ Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
      }
    });
    lines.push('');
  }
  
  // Inbox Tasks
  if (data.inboxTasks && data.inboxTasks.length > 0) {
    lines.push('## 📥 Inbox');
    lines.push('');
    
    data.inboxTasks.forEach(task => {
      let taskLine = `- [ ] **${task.title}**`;
      if (task.startDate) taskLine += ` 📅 (scheduled: ${task.startDate})`;
      if (task.deadline) taskLine += ` 🔴 (due: ${task.deadline})`;
      lines.push(taskLine);
      lines.push(`  - *ID: ${task.id}*`);
      
      if (task.notes) {
        lines.push(`  - 📝 ${task.notes}`);
      }
      if (task.tags && task.tags.length > 0) {
        lines.push(`  - 🏷️ Tags: ${task.tags.map(t => `#${t.name}`).join(', ')}`);
      }
      if (task.checklistItems && task.checklistItems.total > 0) {
        lines.push(`  - ✅ Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
      }
    });
    lines.push('');
  }
  
  // Areas
  if (data.areas && data.areas.length > 0) {
    lines.push('## 📁 Areas');
    lines.push('');
    
    data.areas.forEach(area => {
      lines.push(`### ${area.name}`);
      lines.push(`*ID: ${area.id}*`);
      if (area.visible === false) {
        lines.push('*Status: Hidden area*');
      }
      lines.push('');
      
      // Area projects
      if (area.projects && area.projects.length > 0) {
        lines.push('**📂 Projects:**');
        area.projects.forEach(project => {
          lines.push(`- [ ] **${project.title}**`);
          lines.push(`  - *ID: ${project.id}*`);
          if (project.notes) {
            lines.push(`  - 📝 ${project.notes}`);
          }
          if (project.startDate) {
            lines.push(`  - 📅 Scheduled: ${project.startDate}`);
          }
          if (project.deadline) {
            lines.push(`  - 🔴 Due: ${project.deadline}`);
          }
          if (project.tags && project.tags.length > 0) {
            lines.push(`  - 🏷️ Tags: ${project.tags.map(t => `#${t.name}`).join(', ')}`);
          }
          
          // Project tasks
          if (project.tasks && project.tasks.length > 0) {
            lines.push('  - **Tasks:**');
            project.tasks.forEach(task => {
              let taskLine = `    - [ ] ${task.title}`;
              if (task.startDate) taskLine += ` 📅 (${task.startDate})`;
              if (task.deadline) taskLine += ` 🔴 (due: ${task.deadline})`;
              lines.push(taskLine);
              
              if (task.notes) {
                lines.push(`      - 📝 ${task.notes}`);
              }
              if (task.tags && task.tags.length > 0) {
                lines.push(`      - 🏷️ ${task.tags.map(t => `#${t.name}`).join(', ')}`);
              }
              if (task.checklistItems && task.checklistItems.total > 0) {
                lines.push(`      - ✅ ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
              }
            });
          }
        });
        lines.push('');
      }
      
      // Area tasks
      if (area.tasks && area.tasks.length > 0) {
        lines.push('**📋 Tasks:**');
        area.tasks.forEach(task => {
          let taskLine = `- [ ] ${task.title}`;
          if (task.startDate) taskLine += ` 📅 (${task.startDate})`;
          if (task.deadline) taskLine += ` 🔴 (due: ${task.deadline})`;
          lines.push(taskLine);
          
          if (task.notes) {
            lines.push(`  - 📝 ${task.notes}`);
          }
          if (task.tags && task.tags.length > 0) {
            lines.push(`  - 🏷️ Tags: ${task.tags.map(t => `#${t.name}`).join(', ')}`);
          }
          if (task.checklistItems && task.checklistItems.total > 0) {
            lines.push(`  - ✅ Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
          }
        });
        lines.push('');
      }
    });
  }
  
  // Standalone Projects
  if (data.projects && data.projects.length > 0) {
    const standaloneProjects = data.projects.filter(p => !p.area);
    if (standaloneProjects.length > 0) {
      lines.push('## 📂 Projects');
      lines.push('');
      
      standaloneProjects.forEach(project => {
        lines.push(`### ${project.title}`);
        lines.push(`*ID: ${project.id}*`);
        if (project.notes) {
          lines.push(`📝 ${project.notes}`);
        }
        
        if (project.startDate) {
          lines.push(`📅 **Start:** ${project.startDate}`);
        }
        if (project.deadline) {
          lines.push(`🔴 **Due:** ${project.deadline}`);
        }
        if (project.tags && project.tags.length > 0) {
          lines.push(`🏷️ **Tags:** ${project.tags.map(t => `#${t.name}`).join(', ')}`);
        }
        lines.push('');
        
        // Project tasks
        if (project.tasks && project.tasks.length > 0) {
          lines.push('**📋 Tasks:**');
          project.tasks.forEach(task => {
            let taskLine = `- [ ] ${task.title}`;
            if (task.startDate) taskLine += ` 📅 (${task.startDate})`;
            if (task.deadline) taskLine += ` 🔴 (due: ${task.deadline})`;
            lines.push(taskLine);
            
            if (task.notes) {
              lines.push(`  - 📝 ${task.notes}`);
            }
            if (task.tags && task.tags.length > 0) {
              lines.push(`  - 🏷️ ${task.tags.map(t => `#${t.name}`).join(', ')}`);
            }
            if (task.checklistItems && task.checklistItems.total > 0) {
              lines.push(`  - ✅ Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
            }
          });
          lines.push('');
        }
      });
    }
  }
  
  // Tags
  if (data.tags && data.tags.length > 0) {
    lines.push('## 🏷️ Tags');
    lines.push('');
    
    const sortedTags = [...data.tags].sort((a, b) => b.taskCount - a.taskCount);
    
    sortedTags.forEach(tag => {
      lines.push(`### #${tag.name}`);
      lines.push(`- **Task Count:** ${tag.taskCount}`);
      if (tag.shortcut) {
        lines.push(`- **Shortcut:** ${tag.shortcut}`);
      }
      lines.push(`- *ID: ${tag.id}*`);
      lines.push('');
    });
  }
  
  // Navigation URLs
  lines.push('## 🔗 Quick Navigation');
  lines.push('');
  lines.push(`- [📅 Today](${data.urls.showToday})`);
  lines.push(`- [📥 Inbox](${data.urls.showInbox})`);
  lines.push(`- [📂 Projects](${data.urls.showProjects})`);
  lines.push(`- [📁 Areas](${data.urls.showAreas})`);
  lines.push('');
  
  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Things MCP Server - Direct database access for comprehensive overview*');
  
  return lines.join('\n');
}

export function registerThingsSummaryTool(server: McpServer): void {
  server.tool(
    'things_summary',
    'Generate a comprehensive summary of your Things database with powerful filtering options. **This is the primary tool for accessing all your Things data** - it replaces individual list tools and provides a complete overview of tasks, projects, areas, and tags. Returns either formatted Markdown for easy reading or structured JSON for further processing. Direct database access ensures complete and accurate data.',
    summarySchema.shape,
    async (params) => {
      try {
        // Validate macOS platform
        if (process.platform !== 'darwin') {
          throw new Error('Things database access is only available on macOS');
        }

        logger.info('Generating Things summary', { 
          format: params.format, 
          filters: {
            areas: params.areas?.length || 0,
            tags: params.tags?.length || 0,
            projects: params.projects?.length || 0,
            includeCompleted: params.includeCompleted,
            includeInactive: params.includeInactive,
            dateRange: params.dateRange
          }
        });
        
        const data = getThingsSummary(params);
        
        if (params.format === 'json') {
          return {
            content: [{
              type: "text",
              text: JSON.stringify(data, null, 2)
            }]
          };
        } else {
          const markdown = generateMarkdownSummary(data);
          return {
            content: [{
              type: "text",
              text: markdown
            }]
          };
        }
      } catch (error) {
        logger.error('Failed to generate Things summary', { 
          error: error instanceof Error ? error.message : error 
        });
        throw error;
      }
    }
  );
}