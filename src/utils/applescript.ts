import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export interface ThingsTodo {
  id: string;
  name: string;
  notes?: string;
  project?: string;
  projectId?: string;
  area?: string;
  areaId?: string;
  tags: string[];
  completionDate?: Date;
  dueDate?: Date;
  activationDate?: Date;
  status: 'open' | 'completed' | 'canceled';
  creationDate: Date;
  modificationDate: Date;
  type: 'to-do';
}

export interface ThingsProject {
  id: string;
  name: string;
  notes?: string;
  area?: string;
  areaId?: string;
  tags: string[];
  completionDate?: Date;
  dueDate?: Date;
  activationDate?: Date;
  status: 'open' | 'completed' | 'canceled';
  creationDate: Date;
  modificationDate: Date;
  type: 'project';
}

export interface ThingsArea {
  id: string;
  name: string;
  notes?: string;
  tags: string[];
}

export interface ThingsTag {
  id: string;
  name: string;
}

export interface ListOptions {
  status?: 'open' | 'completed' | 'canceled' | 'all';
  project?: string;
  area?: string;
  tags?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
  modifiedAfter?: Date;
  limit?: number;
}

// Utility functions for TypeScript filtering
function applyTodoFilters(todos: ThingsTodo[], options: ListOptions): ThingsTodo[] {
  let filtered = todos;

  if (options.status && options.status !== 'all') {
    filtered = filtered.filter(todo => todo.status === options.status);
  }

  if (options.project) {
    filtered = filtered.filter(todo => 
      todo.project?.toLowerCase().includes(options.project!.toLowerCase())
    );
  }

  if (options.area) {
    filtered = filtered.filter(todo => 
      todo.area?.toLowerCase().includes(options.area!.toLowerCase())
    );
  }

  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter(todo => 
      options.tags!.every(tag => 
        todo.tags.some(todoTag => 
          todoTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  if (options.dueBefore) {
    filtered = filtered.filter(todo => 
      todo.dueDate && todo.dueDate < options.dueBefore!
    );
  }

  if (options.dueAfter) {
    filtered = filtered.filter(todo => 
      todo.dueDate && todo.dueDate > options.dueAfter!
    );
  }

  if (options.modifiedAfter) {
    filtered = filtered.filter(todo => 
      todo.modificationDate > options.modifiedAfter!
    );
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

function applyProjectFilters(projects: ThingsProject[], options: ListOptions): ThingsProject[] {
  let filtered = projects;

  if (options.status && options.status !== 'all') {
    filtered = filtered.filter(project => project.status === options.status);
  }

  if (options.area) {
    filtered = filtered.filter(project => 
      project.area?.toLowerCase().includes(options.area!.toLowerCase())
    );
  }

  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter(project => 
      options.tags!.every(tag => 
        project.tags.some(projectTag => 
          projectTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  if (options.dueBefore) {
    filtered = filtered.filter(project => 
      project.dueDate && project.dueDate < options.dueBefore!
    );
  }

  if (options.dueAfter) {
    filtered = filtered.filter(project => 
      project.dueDate && project.dueDate > options.dueAfter!
    );
  }

  if (options.modifiedAfter) {
    filtered = filtered.filter(project => 
      project.modificationDate > options.modifiedAfter!
    );
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export async function executeAppleScript(script: string): Promise<string> {
  if (process.platform !== 'darwin') {
    throw new Error('AppleScript is only supported on macOS');
  }

  try {
    const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "\\'")}'`);
    if (stderr) {
      logger.warn('AppleScript warning', { stderr });
    }
    return stdout.trim();
  } catch (error) {
    logger.error('AppleScript execution failed', { error: error instanceof Error ? error.message : error });
    throw error;
  }
}

export async function listTodos(options: ListOptions = {}): Promise<ThingsTodo[]> {
  const script = `
    tell application "Things3"
      set todoList to every to do
      set todoData to ""
      
      -- Process todos
      repeat with todo in todoList
        set todoId to id of todo
        set todoName to name of todo
        set todoNotes to ""
        try
          set todoNotes to notes of todo
        end try
        set todoStatus to status of todo as string
        set todoCreationDate to creation date of todo as string
        set todoModificationDate to modification date of todo as string
        
        set todoProject to ""
        set todoProjectId to ""
        try
          set todoProject to name of project of todo
          set todoProjectId to id of project of todo
        end try
        
        set todoArea to ""
        set todoAreaId to ""
        try
          set todoArea to name of area of todo
          set todoAreaId to id of area of todo
        end try
        
        set todoDueDate to ""
        try
          set dueDate to due date of todo
          if dueDate is not missing value then
            set todoDueDate to dueDate as string
          end if
        end try
        
        set todoScheduledDate to ""
        
        set todoActivationDate to ""
        try
          set activationDate to activation date of todo
          if activationDate is not missing value then
            set todoActivationDate to activationDate as string
          end if
        end try
        
        set todoCompletionDate to ""
        try
          set completionDate to completion date of todo
          if completionDate is not missing value then
            set todoCompletionDate to completionDate as string
          end if
        end try
        
        set todoDelegatedPerson to ""
        
        set todoListName to ""
        
        set todoTags to ""
        try
          set tagList to tags of todo
          repeat with i from 1 to count of tagList
            set tagName to name of item i of tagList
            if todoTags is "" then
              set todoTags to tagName
            else
              set todoTags to todoTags & "," & tagName
            end if
          end repeat
        end try
        
        set todoEntry to todoId & "|" & todoName & "|" & todoNotes & "|" & todoStatus & "|" & todoProject & "|" & todoProjectId & "|" & todoArea & "|" & todoAreaId & "|" & todoDueDate & "|" & todoScheduledDate & "|" & todoActivationDate & "|" & todoCompletionDate & "|" & todoDelegatedPerson & "|" & todoListName & "|" & todoTags & "|" & todoCreationDate & "|" & todoModificationDate
        
        if todoData is "" then
          set todoData to todoEntry
        else
          set todoData to todoData & "\n" & todoEntry
        end if
      end repeat
      
      return todoData
    end tell
  `;

  const result = await executeAppleScript(script);
  const todos = parseAppleScriptTodoList(result);
  return applyTodoFilters(todos, options);
}

export async function listProjects(options: ListOptions = {}): Promise<ThingsProject[]> {
  const script = `
    tell application "Things3"
      set projectList to every project
      set projectData to ""
      
      repeat with proj in projectList
        set projId to id of proj
        set projName to name of proj
        set projNotes to ""
        try
          set projNotes to notes of proj
        end try
        set projStatus to status of proj as string
        set projCreationDate to creation date of proj as string
        set projModificationDate to modification date of proj as string
        
        set projArea to ""
        set projAreaId to ""
        try
          set projArea to name of area of proj
          set projAreaId to id of area of proj
        end try
        
        set projDueDate to ""
        try
          set dueDate to due date of proj
          if dueDate is not missing value then
            set projDueDate to dueDate as string
          end if
        end try
        
        set projScheduledDate to ""
        
        set projActivationDate to ""
        try
          set activationDate to activation date of proj
          if activationDate is not missing value then
            set projActivationDate to activationDate as string
          end if
        end try
        
        set projCompletionDate to ""
        try
          set completionDate to completion date of proj
          if completionDate is not missing value then
            set projCompletionDate to completionDate as string
          end if
        end try
        
        set projDelegatedPerson to ""
        
        set projListName to ""
        
        set projTags to ""
        try
          set tagList to tags of proj
          repeat with i from 1 to count of tagList
            set tagName to name of item i of tagList
            if projTags is "" then
              set projTags to tagName
            else
              set projTags to projTags & "," & tagName
            end if
          end repeat
        end try
        
        set projEntry to projId & "|" & projName & "|" & projNotes & "|" & projStatus & "|" & projArea & "|" & projAreaId & "|" & projDueDate & "|" & projScheduledDate & "|" & projActivationDate & "|" & projCompletionDate & "|" & projDelegatedPerson & "|" & projListName & "|" & projTags & "|" & projCreationDate & "|" & projModificationDate
        
        if projectData is "" then
          set projectData to projEntry
        else
          set projectData to projectData & "\n" & projEntry
        end if
      end repeat
      
      return projectData
    end tell
  `;

  const result = await executeAppleScript(script);
  const projects = parseAppleScriptProjectList(result);
  return applyProjectFilters(projects, options);
}

export async function listAreas(): Promise<ThingsArea[]> {
  const script = `
    tell application "Things3"
      set areaList to every area
      set areaData to ""
      
      repeat with i from 1 to count of areaList
        set currentArea to item i of areaList
        set areaId to id of currentArea
        set areaName to name of currentArea
        
        set areaNotes to ""
        try
          set areaNotes to notes of currentArea
        end try
        
        set areaTags to ""
        try
          set tagList to tags of currentArea
          repeat with j from 1 to count of tagList
            set tagName to name of item j of tagList
            if areaTags is "" then
              set areaTags to tagName
            else
              set areaTags to areaTags & "," & tagName
            end if
          end repeat
        end try
        
        set areaEntry to areaId & "|" & areaName & "|" & areaNotes & "|" & areaTags
        
        if areaData is "" then
          set areaData to areaEntry
        else
          set areaData to areaData & "\n" & areaEntry
        end if
      end repeat
      
      return areaData
    end tell
  `;

  const result = await executeAppleScript(script);
  return parseAppleScriptAreaList(result);
}

export async function listTags(): Promise<ThingsTag[]> {
  const script = `
    tell application "Things3"
      set tagList to every tag
      set tagData to ""
      
      repeat with i from 1 to count of tagList
        set currentTag to item i of tagList
        set tagId to id of currentTag
        set tagName to name of currentTag
        
        set tagEntry to tagId & "|" & tagName
        
        if tagData is "" then
          set tagData to tagEntry
        else
          set tagData to tagData & "\n" & tagEntry
        end if
      end repeat
      
      return tagData
    end tell
  `;

  const result = await executeAppleScript(script);
  return parseAppleScriptTagList(result);
}

export async function deleteTodo(id: string): Promise<void> {
  const script = `
    tell application "Things3"
      delete to do id "${id}"
    end tell
  `;

  await executeAppleScript(script);
  logger.info('Todo deleted successfully', { id });
}

export async function deleteProject(id: string): Promise<void> {
  const script = `
    tell application "Things3"
      delete project id "${id}"
    end tell
  `;

  await executeAppleScript(script);
  logger.info('Project deleted successfully', { id });
}

// Helper function to parse AppleScript dates
function parseAppleScriptDate(dateString: string): Date | undefined {
  if (!dateString || dateString === '' || dateString === 'missing value') {
    return undefined;
  }
  
  try {
    // First try standard parsing
    let parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Try removing English day name and "at"
    const cleanedEnglishDate = dateString
      .replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*/i, '')
      .replace(/\sat\s/i, ' ');
    
    parsed = new Date(cleanedEnglishDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Try manual parsing for English "Month DD, YYYY at HH:MM:SS AM/PM" format
    const englishMatch = dateString.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (englishMatch) {
      const [, month, day, year, hour, minute, second, ampm] = englishMatch;
      const date = new Date(`${month} ${day}, ${year} ${hour}:${minute}:${second} ${ampm}`);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try parsing Chinese date format: "2025年6月6日 星期五 09:40:34"
    const chineseMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s+(?:星期[一二三四五六日])\s+(\d{1,2}):(\d{2}):(\d{2})/);
    if (chineseMatch) {
      const [, year, month, day, hour, minute, second] = chineseMatch;
      // Month is 0-indexed in JavaScript Date
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try parsing Chinese date format without weekday: "2025年6月6日 09:40:34"
    const chineseMatchNoWeekday = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2}):(\d{2})/);
    if (chineseMatchNoWeekday) {
      const [, year, month, day, hour, minute, second] = chineseMatchNoWeekday;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try parsing Chinese date format for midnight: "2025年7月1日 星期二 00:00:00"
    const chineseMidnightMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+星期[一二三四五六日])?\s+00:00:00/);
    if (chineseMidnightMatch) {
      const [, year, month, day] = chineseMidnightMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return undefined;
  } catch {
    return undefined;
  }
}

// Helper functions to parse AppleScript output
function parseAppleScriptTodoList(output: string): ThingsTodo[] {
  if (!output || output.trim() === '') {
    return [];
  }
  
  try {
    const entries = output.split('\n').filter(line => line.trim() !== '');
    const parsedTodos: ThingsTodo[] = [];
    
    for (const entry of entries) {
      try {
        const parts = entry.split('|');
        if (parts.length < 17) {
          logger.warn('Skipping entry with insufficient fields', { entry, fieldCount: parts.length });
          continue;
        }
        
        const [id, name, notes, status, project, projectId, area, areaId, dueDate, scheduledDate, activationDate, completionDate, delegatedPerson, listName, tags, creationDate, modificationDate] = parts;
        
        const todo: ThingsTodo = {
          id,
          name,
          notes: notes || undefined,
          project: project || undefined,
          projectId: projectId || undefined,
          area: area || undefined,
          areaId: areaId || undefined,
          tags: tags ? tags.split(',').filter(Boolean) : [],
          completionDate: parseAppleScriptDate(completionDate),
          dueDate: parseAppleScriptDate(dueDate),
          activationDate: parseAppleScriptDate(activationDate),
          status: status as 'open' | 'completed' | 'canceled',
          creationDate: parseAppleScriptDate(creationDate) || new Date(),
          modificationDate: parseAppleScriptDate(modificationDate) || new Date(),
          type: 'to-do' as const
        };
        
        parsedTodos.push(todo);
      } catch (entryError) {
        logger.warn('Failed to parse individual todo entry', { entry, error: entryError });
        // Continue with next entry instead of failing entire parse
      }
    }
    
    return parsedTodos;
  } catch (error) {
    logger.error('Failed to parse todo list output', { output: output.length > 1000 ? `${output.substring(0, 1000)}...` : output, error });
    return [];
  }
}

function parseAppleScriptProjectList(output: string): ThingsProject[] {
  if (!output || output.trim() === '') {
    return [];
  }
  
  try {
    const entries = output.split('\n').filter(line => line.trim() !== '');
    return entries.map(entry => {
      const parts = entry.split('|');
      if (parts.length < 15) {
        throw new Error(`Invalid entry format: ${entry}`);
      }
      
      const [id, name, notes, status, area, areaId, dueDate, scheduledDate, activationDate, completionDate, delegatedPerson, listName, tags, creationDate, modificationDate] = parts;
      
      return {
        id,
        name,
        notes: notes || undefined,
        area: area || undefined,
        areaId: areaId || undefined,
        tags: tags ? tags.split(',').filter(Boolean) : [],
        completionDate: parseAppleScriptDate(completionDate),
        dueDate: parseAppleScriptDate(dueDate),
        activationDate: parseAppleScriptDate(activationDate),
        status: status as 'open' | 'completed' | 'canceled',
        creationDate: parseAppleScriptDate(creationDate) || new Date(),
        modificationDate: parseAppleScriptDate(modificationDate) || new Date(),
        type: 'project' as const
      };
    });
  } catch (error) {
    logger.error('Failed to parse project list output', { output, error });
    return [];
  }
}

function parseAppleScriptAreaList(output: string): ThingsArea[] {
  if (!output || output.trim() === '') {
    return [];
  }
  
  try {
    const entries = output.split('\n').filter(line => line.trim() !== '');
    return entries.map(entry => {
      const parts = entry.split('|');
      if (parts.length < 4) {
        throw new Error(`Invalid area entry format: ${entry}`);
      }
      
      const [id, name, notes, tags] = parts;
      
      return {
        id,
        name,
        notes: notes || undefined,
        tags: tags ? tags.split(',').filter(Boolean) : []
      };
    });
  } catch (error) {
    logger.error('Failed to parse area list output', { output, error });
    return [];
  }
}

function parseAppleScriptTagList(output: string): ThingsTag[] {
  if (!output || output.trim() === '') {
    return [];
  }
  
  try {
    const entries = output.split('\n').filter(line => line.trim() !== '');
    return entries.map(entry => {
      const parts = entry.split('|');
      if (parts.length < 2) {
        throw new Error(`Invalid tag entry format: ${entry}`);
      }
      
      const [id, name] = parts;
      
      return {
        id,
        name
      };
    });
  } catch (error) {
    logger.error('Failed to parse tag list output', { output, error });
    return [];
  }
}