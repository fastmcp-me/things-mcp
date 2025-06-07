#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

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
  tasks?: ThingsTask[]; // For projects that contain tasks
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
  areas: ThingsArea[];
  inboxTasks: ThingsTask[];
  todayTasks: ThingsTask[];
  projects: ThingsTask[];
  tags: ThingsTag[];
  urls: {
    showToday: string;
    showInbox: string;
    showProjects: string;
    showAreas: string;
  };
}

function findThingsDatabase(): string {
  const homeDir = process.env.HOME || '/Users/' + process.env.USER;
  const thingsGroupContainer = join(homeDir, 'Library/Group Containers');
  
  if (!existsSync(thingsGroupContainer)) {
    throw new Error('Things group container not found');
  }
  
  const containers = readdirSync(thingsGroupContainer);
  const thingsContainer = containers.find(dir => 
    dir.includes('JLMPQHK86H.com.culturedcode.ThingsMac')
  );
  
  if (!thingsContainer) {
    throw new Error('Things container not found');
  }
  
  const containerPath = join(thingsGroupContainer, thingsContainer);
  const contents = readdirSync(containerPath);
  const thingsDataDir = contents.find(dir => dir.startsWith('ThingsData-'));
  
  if (!thingsDataDir) {
    throw new Error('ThingsData directory not found');
  }
  
  const dbPath = join(containerPath, thingsDataDir, 'Things Database.thingsdatabase', 'main.sqlite');
  
  if (!existsSync(dbPath)) {
    throw new Error('Things database file not found');
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
    console.error('SQL Query failed:', error);
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
      
      // Skip if value is empty, null, undefined, empty string, empty array, or zero counts for checklist
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

function getThingsSummary(): ThingsSummary {
  const dbPath = findThingsDatabase();
  console.error(`Found Things database at: ${dbPath}`);
  
  // Get all areas (simplified query)
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
  
  // Get all tags
  const tagsData = executeSqlQuery(dbPath, "SELECT uuid, title, shortcut FROM TMTag");
  const tags: ThingsTag[] = tagsData.map(row => ({
    id: row[0],
    name: row[1] || 'Unnamed Tag',
    shortcut: row[2] || undefined,
    taskCount: 0, // Will be calculated later
    thingsUrl: generateThingsUrl('show', undefined, { filter: row[1] })
  }));
  
  // Get open tasks and projects
  const tasksData = executeSqlQuery(dbPath, 
    "SELECT uuid, title, notes, type, creationDate, startDate, deadline, area, project, checklistItemsCount, openChecklistItemsCount FROM TMTask WHERE status = 0 AND trashed = 0"
  );
  
  // Create a map for quick lookup of project names
  const projectMap = new Map();
  tasksData.forEach(row => {
    if (row[3] === '1') { // If it's a project
      projectMap.set(row[0], row[1]);
    }
  });
  
  const allTasks: ThingsTask[] = tasksData.map(row => {
    const taskType = row[3] === '0' ? 'task' : row[3] === '1' ? 'project' : 'heading';
    
    // Find area name
    const areaInfo = areas.find(area => area.id === row[7]);
    
    // Find project name
    const projectName = row[8] ? projectMap.get(row[8]) : null;
    
    const task: any = {
      id: row[0],
      title: row[1] || 'Untitled',
      type: taskType,
      thingsUrl: generateThingsUrl('show', row[0])
    };
    
    // Only add fields that have values
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
  
  // Separate tasks by type
  const projects = allTasks.filter(task => task.type === 'project');
  const tasks = allTasks.filter(task => task.type === 'task');
  const inboxTasks = tasks.filter(task => !task.area && !task.project);
  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.startDate === today;
  });
  
  // Organize tasks by area and add project tasks
  areas.forEach(area => {
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
  
  // Clean empty areas
  const activeAreas = areas.filter(area => 
    (area.projects && area.projects.length > 0) || 
    (area.tasks && area.tasks.length > 0)
  );
  
  const activeTags = tags.filter(tag => tag.taskCount > 0);
  
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

function generateMarkdownSummary(): string {
  const data = getThingsSummary();
  const lines: string[] = [];
  
  // Header
  lines.push('# Things Database Summary');
  lines.push('');
  lines.push(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
  lines.push(`Last Updated: ${data.summary.lastUpdated}`);
  lines.push('');
  
  // Overview Statistics
  lines.push('## Overview');
  lines.push('');
  lines.push(`- **Open Tasks**: ${data.summary.totalOpenTasks}`);
  lines.push(`- **Active Projects**: ${data.summary.totalActiveProjects}`);
  lines.push(`- **Areas**: ${data.summary.totalAreas}`);
  lines.push(`- **Tags in Use**: ${data.summary.totalTags}`);
  lines.push('');
  
  // Areas
  if (data.areas && data.areas.length > 0) {
    lines.push('## Areas');
    lines.push('');
    
    data.areas.forEach(area => {
      lines.push(`### ${area.name}`);
      lines.push(`  - ID: ${area.id}`);
      if (area.visible === false) {
        lines.push('  - Status: Hidden area');
      }
      lines.push('');
      
      // Area projects
      if (area.projects && area.projects.length > 0) {
        lines.push('**Projects:**');
        area.projects.forEach(project => {
          lines.push(`- [ ] **${project.title}**`);
          lines.push(`  - ID: ${project.id}`);
          lines.push(`  - Type: ${project.type}`);
          if (project.notes) {
            lines.push(`  - Note: ${project.notes}`);
          }
          if (project.creationDate) {
            lines.push(`  - Created: ${project.creationDate}`);
          }
          if (project.startDate) {
            lines.push(`  - Scheduled: ${project.startDate}`);
          }
          if (project.deadline) {
            lines.push(`  - Due: ${project.deadline}`);
          }
          if (project.tags && project.tags.length > 0) {
            lines.push(`  - Tags: ${project.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
          }
          
          // Project tasks
          if (project.tasks && project.tasks.length > 0) {
            lines.push('  - **Tasks:**');
            project.tasks.forEach(task => {
              let taskLine = `    - [ ] ${task.title}`;
              if (task.startDate) taskLine += ` (scheduled: ${task.startDate})`;
              if (task.deadline) taskLine += ` (due: ${task.deadline})`;
              lines.push(taskLine);
              lines.push(`      - ID: ${task.id}`);
              
              if (task.notes) {
                lines.push(`      - Note: ${task.notes}`);
              }
              if (task.creationDate) {
                lines.push(`      - Created: ${task.creationDate}`);
              }
              if (task.area) {
                lines.push(`      - Area: ${task.area.name} (${task.area.id})`);
              }
              if (task.project) {
                lines.push(`      - Project: ${task.project.name} (${task.project.id})`);
              }
              if (task.tags && task.tags.length > 0) {
                lines.push(`      - Tags: ${task.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
              }
              if (task.checklistItems && (task.checklistItems.total > 0 || task.checklistItems.open > 0)) {
                lines.push(`      - Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
              }
            });
          }
        });
        lines.push('');
      }
      
      // Area tasks
      if (area.tasks && area.tasks.length > 0) {
        lines.push('**Tasks:**');
        area.tasks.forEach(task => {
          let taskLine = `- [ ] ${task.title}`;
          if (task.startDate) taskLine += ` (scheduled: ${task.startDate})`;
          if (task.deadline) taskLine += ` (due: ${task.deadline})`;
          lines.push(taskLine);
          lines.push(`  - ID: ${task.id}`);
          
          if (task.notes) {
            lines.push(`  - Note: ${task.notes}`);
          }
          if (task.creationDate) {
            lines.push(`  - Created: ${task.creationDate}`);
          }
          if (task.area) {
            lines.push(`  - Area: ${task.area.name} (${task.area.id})`);
          }
          if (task.project) {
            lines.push(`  - Project: ${task.project.name} (${task.project.id})`);
          }
          if (task.tags && task.tags.length > 0) {
            lines.push(`  - Tags: ${task.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
          }
          if (task.checklistItems && (task.checklistItems.total > 0 || task.checklistItems.open > 0)) {
            lines.push(`  - Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
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
      lines.push('## Projects');
      lines.push('');
      
      standaloneProjects.forEach(project => {
        lines.push(`### ${project.title}`);
        lines.push(`  - ID: ${project.id}`);
        lines.push(`  - Type: ${project.type}`);
        if (project.notes) {
          lines.push(`  - Note: ${project.notes}`);
        }
        
        if (project.creationDate) {
          lines.push(`  - Created: ${project.creationDate}`);
        }
        if (project.startDate) {
          lines.push(`  - Start: ${project.startDate}`);
        }
        if (project.deadline) {
          lines.push(`  - Due: ${project.deadline}`);
        }
        if (project.tags && project.tags.length > 0) {
          lines.push(`  - Tags: ${project.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
        }
        lines.push('');
        
        // Project tasks
        if (project.tasks && project.tasks.length > 0) {
          lines.push('**Tasks:**');
          project.tasks.forEach(task => {
            let taskLine = `- [ ] ${task.title}`;
            if (task.startDate) taskLine += ` (scheduled: ${task.startDate})`;
            if (task.deadline) taskLine += ` (due: ${task.deadline})`;
            lines.push(taskLine);
            lines.push(`  - ID: ${task.id}`);
            
            if (task.notes) {
              lines.push(`  - Note: ${task.notes}`);
            }
            if (task.creationDate) {
              lines.push(`  - Created: ${task.creationDate}`);
            }
            if (task.area) {
              lines.push(`  - Area: ${task.area.name} (${task.area.id})`);
            }
            if (task.project) {
              lines.push(`  - Project: ${task.project.name} (${task.project.id})`);
            }
            if (task.tags && task.tags.length > 0) {
              lines.push(`  - Tags: ${task.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
            }
            if (task.checklistItems && (task.checklistItems.total > 0 || task.checklistItems.open > 0)) {
              lines.push(`  - Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
            }
          });
          lines.push('');
        }
      });
    }
  }
  
  // Inbox Tasks
  if (data.inboxTasks && data.inboxTasks.length > 0) {
    lines.push('## Inbox');
    lines.push('');
    
    data.inboxTasks.forEach(task => {
      let taskLine = `- [ ] **${task.title}**`;
      if (task.startDate) taskLine += ` (scheduled: ${task.startDate})`;
      if (task.deadline) taskLine += ` (due: ${task.deadline})`;
      lines.push(taskLine);
      lines.push(`  - ID: ${task.id}`);
      
      if (task.notes) {
        lines.push(`  - Note: ${task.notes}`);
      }
      if (task.creationDate) {
        lines.push(`  - Created: ${task.creationDate}`);
      }
      if (task.area) {
        lines.push(`  - Area: ${task.area.name} (${task.area.id})`);
      }
      if (task.project) {
        lines.push(`  - Project: ${task.project.name} (${task.project.id})`);
      }
      if (task.tags && task.tags.length > 0) {
        lines.push(`  - Tags: ${task.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
      }
      if (task.checklistItems && (task.checklistItems.total > 0 || task.checklistItems.open > 0)) {
        lines.push(`  - Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
      }
    });
    lines.push('');
  }
  
  // Today Tasks
  if (data.todayTasks && data.todayTasks.length > 0) {
    lines.push('## Today');
    lines.push('');
    
    data.todayTasks.forEach(task => {
      let taskLine = `- [ ] **${task.title}**`;
      if (task.deadline) taskLine += ` (due: ${task.deadline})`;
      lines.push(taskLine);
      lines.push(`  - ID: ${task.id}`);
      
      if (task.notes) {
        lines.push(`  - Note: ${task.notes}`);
      }
      if (task.creationDate) {
        lines.push(`  - Created: ${task.creationDate}`);
      }
      if (task.startDate) {
        lines.push(`  - Start: ${task.startDate}`);
      }
      if (task.area) {
        lines.push(`  - Area: ${task.area.name} (${task.area.id})`);
      }
      if (task.project) {
        lines.push(`  - Project: ${task.project.name} (${task.project.id})`);
      }
      if (task.tags && task.tags.length > 0) {
        lines.push(`  - Tags: ${task.tags.map(t => `#${t.name} (${t.id})`).join(', ')}`);
      }
      if (task.checklistItems && (task.checklistItems.total > 0 || task.checklistItems.open > 0)) {
        lines.push(`  - Checklist: ${task.checklistItems.open}/${task.checklistItems.total} remaining`);
      }
    });
    lines.push('');
  }
  
  // Tags
  if (data.tags && data.tags.length > 0) {
    lines.push('## Tags');
    lines.push('');
    
    // Sort tags by usage count (descending)
    const sortedTags = [...data.tags].sort((a, b) => b.taskCount - a.taskCount);
    
    sortedTags.forEach(tag => {
      lines.push(`### #${tag.name}`);
      lines.push(`  - ID: ${tag.id}`);
      if (tag.shortcut) {
        lines.push(`  - Shortcut: ${tag.shortcut}`);
      }
      lines.push(`  - Task Count: ${tag.taskCount}`);
      lines.push('');
    });
  }
  
  // URLs section
  if (data.urls) {
    lines.push('## Navigation URLs');
    lines.push('');
    lines.push(`- Today: ${data.urls.showToday}`);
    lines.push(`- Inbox: ${data.urls.showInbox}`);
    lines.push(`- Projects: ${data.urls.showProjects}`);
    lines.push(`- Areas: ${data.urls.showAreas}`);
    lines.push('');
  }
  
  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Things Database Summary Tool*');
  
  return lines.join('\n');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const outputFormat = process.argv[2]; // Check for command line argument
    
    if (outputFormat === '--json') {
      const summary = getThingsSummary();
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const markdown = generateMarkdownSummary();
      console.log(markdown);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}