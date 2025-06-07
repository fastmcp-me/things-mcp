import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export interface ThingsTodo {
  id: string;
  name: string;
  notes?: string;
  project?: string;
  area?: string;
  tags: string[];
  completionDate?: Date;
  dueDate?: Date;
  status: 'open' | 'completed' | 'canceled';
  creationDate: Date;
  modificationDate: Date;
}

export interface ThingsProject {
  id: string;
  name: string;
  notes?: string;
  area?: string;
  tags: string[];
  completionDate?: Date;
  dueDate?: Date;
  status: 'open' | 'completed' | 'canceled';
  creationDate: Date;
  modificationDate: Date;
}

export interface ThingsArea {
  id: string;
  name: string;
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
  let script = `
    tell application "Things3"
      set todoList to every to do
      set todoData to {}
      
      repeat with todo in todoList
        set todoInfo to {id:(id of todo), name:(name of todo), notes:(notes of todo), status:(status of todo), creationDate:(creation date of todo), modificationDate:(modification date of todo)}
        
        try
          set todoInfo to todoInfo & {project:(name of project of todo)}
        on error
          set todoInfo to todoInfo & {project:""}
        end try
        
        try
          set todoInfo to todoInfo & {area:(name of area of todo)}
        on error
          set todoInfo to todoInfo & {area:""}
        end try
        
        try
          set todoInfo to todoInfo & {dueDate:(due date of todo)}
        on error
          set todoInfo to todoInfo & {dueDate:""}
        end try
        
        try
          set todoInfo to todoInfo & {completionDate:(completion date of todo)}
        on error
          set todoInfo to todoInfo & {completionDate:""}
        end try
        
        try
          set tagNames to {}
          repeat with tag in (tags of todo)
            set tagNames to tagNames & (name of tag)
          end repeat
          set todoInfo to todoInfo & {tags:tagNames}
        on error
          set todoInfo to todoInfo & {tags:{}}
        end try
        
        set todoData to todoData & {todoInfo}
      end repeat
      
      return todoData
    end tell
  `;

  // Apply status filter if specified
  if (options.status && options.status !== 'all') {
    script = script.replace('every to do', `every to do whose status is ${options.status}`);
  }

  const result = await executeAppleScript(script);
  return parseAppleScriptTodoList(result);
}

export async function listProjects(options: ListOptions = {}): Promise<ThingsProject[]> {
  let script = `
    tell application "Things3"
      set projectList to every project
      set projectData to {}
      
      repeat with proj in projectList
        set projectInfo to {id:(id of proj), name:(name of proj), notes:(notes of proj), status:(status of proj), creationDate:(creation date of proj), modificationDate:(modification date of proj)}
        
        try
          set projectInfo to projectInfo & {area:(name of area of proj)}
        on error
          set projectInfo to projectInfo & {area:""}
        end try
        
        try
          set projectInfo to projectInfo & {dueDate:(due date of proj)}
        on error
          set projectInfo to projectInfo & {dueDate:""}
        end try
        
        try
          set projectInfo to projectInfo & {completionDate:(completion date of proj)}
        on error
          set projectInfo to projectInfo & {completionDate:""}
        end try
        
        try
          set tagNames to {}
          repeat with tag in (tags of proj)
            set tagNames to tagNames & (name of tag)
          end repeat
          set projectInfo to projectInfo & {tags:tagNames}
        on error
          set projectInfo to projectInfo & {tags:{}}
        end try
        
        set projectData to projectData & {projectInfo}
      end repeat
      
      return projectData
    end tell
  `;

  // Apply status filter if specified
  if (options.status && options.status !== 'all') {
    script = script.replace('every project', `every project whose status is ${options.status}`);
  }

  const result = await executeAppleScript(script);
  return parseAppleScriptProjectList(result);
}

export async function listAreas(): Promise<ThingsArea[]> {
  const script = `
    tell application "Things3"
      set areaList to every area
      set areaData to {}
      
      repeat with area in areaList
        set areaInfo to {id:(id of area), name:(name of area)}
        
        try
          set tagNames to {}
          repeat with tag in (tags of area)
            set tagNames to tagNames & (name of tag)
          end repeat
          set areaInfo to areaInfo & {tags:tagNames}
        on error
          set areaInfo to areaInfo & {tags:{}}
        end try
        
        set areaData to areaData & {areaInfo}
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
      set tagData to {}
      
      repeat with tag in tagList
        set tagInfo to {id:(id of tag), name:(name of tag)}
        set tagData to tagData & {tagInfo}
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

// Helper functions to parse AppleScript output
function parseAppleScriptTodoList(output: string): ThingsTodo[] {
  // AppleScript output parsing is complex - for now return empty array
  // In practice, would need to handle AppleScript's record format
  logger.warn('Todo list parsing not yet implemented', { output });
  return [];
}

function parseAppleScriptProjectList(output: string): ThingsProject[] {
  // AppleScript output parsing is complex - for now return empty array
  logger.warn('Project list parsing not yet implemented', { output });
  return [];
}

function parseAppleScriptAreaList(output: string): ThingsArea[] {
  // AppleScript output parsing is complex - for now return empty array
  logger.warn('Area list parsing not yet implemented', { output });
  return [];
}

function parseAppleScriptTagList(output: string): ThingsTag[] {
  // AppleScript output parsing is complex - for now return empty array
  logger.warn('Tag list parsing not yet implemented', { output });
  return [];
}