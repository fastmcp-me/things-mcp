import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';
import { waitForOperation } from './json-operations.js';

interface TaskData {
  id: string;
  title: string | null;
  type: number;
  status: number;
  trashed: boolean;
  area_id: string | null;
  project_id: string | null;
}

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
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
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

/**
 * Verify that a task or project exists in the Things database
 * @param id The ID of the item to verify
 * @param waitMs Time to wait before checking (default: 100ms)
 * @returns The task data if found, null otherwise
 */
export async function verifyItemExists(id: string, waitMs: number = 100): Promise<TaskData | null> {
  // Wait for operation to complete
  await waitForOperation(waitMs);
  
  try {
    const dbPath = findThingsDatabase();
    const query = `SELECT uuid, title, type, status, trashed, area, project FROM TMTask WHERE uuid = '${id}'`;
    const result = executeSqlQuery(dbPath, query);
    
    if (result.length === 0) {
      return null;
    }
    
    const row = result[0];
    return {
      id: row[0],
      title: row[1] || null,
      type: parseInt(row[2]) || 0, // 0=task, 1=project, 2=heading
      status: parseInt(row[3]) || 0, // 0=open, 3=completed, 2=canceled
      trashed: row[4] === '1',
      area_id: row[5] || null,
      project_id: row[6] || null
    };
  } catch (error) {
    logger.error('Failed to verify item exists', { error: error instanceof Error ? error.message : error, id });
    return null;
  }
}

/**
 * Verify that a task or project has been completed
 * @param id The ID of the item to verify
 * @param waitMs Time to wait before checking (default: 100ms)
 * @returns True if the item is completed, false otherwise
 */
export async function verifyItemCompleted(id: string, waitMs: number = 100): Promise<boolean> {
  const item = await verifyItemExists(id, waitMs);
  return item !== null && item.status === 3; // 3 = completed
}

/**
 * Verify that a task or project has been updated with specific attributes
 * @param id The ID of the item to verify
 * @param expectedTitle The expected title (optional)
 * @param waitMs Time to wait before checking (default: 100ms)
 * @returns True if the item matches expectations, false otherwise
 */
export async function verifyItemUpdated(
  id: string, 
  expectedTitle?: string, 
  waitMs: number = 100
): Promise<boolean> {
  const item = await verifyItemExists(id, waitMs);
  
  if (!item) {
    return false;
  }
  
  if (expectedTitle && item.title !== expectedTitle) {
    return false;
  }
  
  return true;
}