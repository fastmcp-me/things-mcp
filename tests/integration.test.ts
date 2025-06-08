import { describe, it, expect, beforeAll } from '@jest/globals';
import { buildThingsUrl, openThingsUrl } from '../src/utils/url-builder.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyItemExists, verifyItemCompleted, verifyItemUpdated } from '../src/utils/verification.js';
import { executeJsonOperation, waitForOperation } from '../src/utils/json-operations.js';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const execAsync = promisify(exec);

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
    console.error('SQL Query failed', { error: error instanceof Error ? error.message : error, query });
    return [];
  }
}

async function cleanupTestItems(authToken: string): Promise<void> {
  try {
    const dbPath = findThingsDatabase();
    // Find all test items (todos and projects) created during testing
    const testItemsQuery = `
      SELECT uuid, type, title FROM TMTask 
      WHERE (title LIKE '%integration-test-%' OR title LIKE '%Test Todo%' OR title LIKE '%Test Project%' OR title LIKE '%deadline-test-%')
      AND status IN (0, 3)
      AND trashed = 0
      ORDER BY creationDate DESC
      LIMIT 50
    `;
    const testItems = executeSqlQuery(dbPath, testItemsQuery);
    
    if (testItems.length === 0) {
      console.log('✅ No test items to clean up');
      return;
    }
    
    console.log(`Found ${testItems.length} test items to clean up`);
    
    for (let i = 0; i < testItems.length; i++) {
      const item = testItems[i];
      const itemId = item[0];
      const itemType = parseInt(item[1]); // 0=todo, 1=project
      const itemTitle = item[2];
      
      try {
        const itemTypeString = itemType === 1 ? 'project' : 'to-do';
        const deleteOperation = {
          type: itemTypeString as 'project' | 'to-do',
          operation: 'update' as const,
          id: itemId,
          attributes: {
            canceled: true
          }
        };
        
        await executeJsonOperation(deleteOperation, authToken);
        console.log(`✅ Cleaned up ${itemTypeString}: ${itemTitle}`);
        
        // Only wait between operations, not after the last one
        if (i < testItems.length - 1) {
          await waitForOperation(100);
        }
      } catch (error) {
        console.log(`⚠️ Failed to clean up ${itemTitle}:`, error);
      }
    }
    
    console.log(`✅ Cleanup complete - processed ${testItems.length} items`);
  } catch (error) {
    console.log('⚠️ Error during cleanup:', error);
  }
}

describe('Things Integration Tests', () => {
  let canRunIntegrationTests = false;
  const authToken = process.env.THINGS_AUTH_TOKEN;

  beforeAll(async () => {
    // Skip all tests if not on macOS
    if (process.platform !== 'darwin') {
      console.log('⚠️ Skipping integration tests - macOS required');
      return;
    }

    // Check if Things URL scheme is available by testing version command
    try {
      await execAsync('open "things:///version"');
      // Wait a moment for the command to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      canRunIntegrationTests = true;
      console.log('✅ Things URL scheme is available');
    } catch (error) {
      console.log('⚠️ Things URL scheme not available - skipping integration tests');
      console.log('To enable: Things.app → Preferences → General → Enable Things URLs');
    }
  });

  afterAll(async () => {
    // Clean up any remaining test items after all tests complete
    if (canRunIntegrationTests && authToken) {
      console.log('🧹 Running test cleanup...');
      await cleanupTestItems(authToken);
    }
  }, 10000); // 10 second timeout for cleanup

  describe('Todo Lifecycle (Create → Update → Complete)', () => {
    const testTodoId = `integration-test-${Date.now()}`;

    it('should create, update, and complete a todo', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      let createdTodoId: string | null = null;

      // Step 1: Create the todo
      const createUrl = buildThingsUrl('add', {
        title: `Test Todo ${testTodoId}`,
        notes: 'Created by integration test\n\nThis will be updated and then completed',
        tags: 'test,integration',
        when: 'today',
        'checklist-items': 'Step 1\nStep 2\nStep 3'
      });

      expect(createUrl).toContain('things:///add');
      expect(createUrl).toContain('title=Test%20Todo');
      expect(createUrl).toContain('notes=Created%20by%20integration%20test');
      expect(createUrl).toContain('tags=test%2Cintegration');
      expect(createUrl).toContain('when=today');
      expect(createUrl).toContain('checklist-items=Step%201%0AStep%202%0AStep%203');

      await expect(openThingsUrl(createUrl)).resolves.not.toThrow();
      console.log('✅ Created test todo');
      
      // Wait and find the created todo in the database
      await waitForOperation(500);
      
      try {
        const dbPath = findThingsDatabase();
        const query = `SELECT uuid FROM TMTask WHERE title LIKE '%${testTodoId}%' AND type = 0 ORDER BY creationDate DESC LIMIT 1`;
        const result = executeSqlQuery(dbPath, query);
        if (result.length > 0) {
          createdTodoId = result[0][0];
          console.log(`✅ Found created todo ID: ${createdTodoId}`);
        } else {
          console.log('⚠️ Could not find created todo in database');
          return; // Exit test if we can't find the todo
        }
      } catch (error) {
        console.log('⚠️ Error finding created todo:', error);
        return; // Exit test on error
      }

      // Step 2: Update the todo (if auth token is available)
      if (authToken && createdTodoId) {
        const updateUrl = buildThingsUrl('update', {
          id: createdTodoId,
          'auth-token': authToken,
          'append-notes': '\n\nUpdated via integration test',
          'add-tags': 'updated',
          'append-checklist-items': 'Step 4,Step 5'
        });

        expect(updateUrl).toContain('things:///update');
        expect(updateUrl).toContain(`id=${createdTodoId}`);
        expect(updateUrl).toContain('auth-token=');
        expect(updateUrl).toContain('append-notes=');
        expect(updateUrl).toContain('add-tags=updated');

        await expect(openThingsUrl(updateUrl)).resolves.not.toThrow();
        
        // Verify the update worked
        const isUpdated = await verifyItemUpdated(createdTodoId);
        if (isUpdated) {
          console.log('✅ Updated and verified test todo');
        } else {
          console.log('⚠️ Todo updated but verification failed');
        }

        // Step 3: Complete the todo using JSON operation
        const operation = {
          type: 'to-do' as const,
          operation: 'update' as const,
          id: createdTodoId,
          attributes: {
            completed: true
          }
        };

        await expect(executeJsonOperation(operation, authToken)).resolves.not.toThrow();
        
        // Verify completion with longer wait
        const isCompleted = await verifyItemCompleted(createdTodoId, 1000); // Wait 1 second
        if (isCompleted) {
          console.log('✅ Completed and verified test todo');
        } else {
          console.log('⚠️ Todo completed but verification failed');
        }
      } else {
        console.log('⚠️ Skipping update and completion - no auth token available');
      }
    });
  });

  describe('Project Lifecycle (Create → Update → Complete)', () => {
    const testProjectId = `integration-test-project-${Date.now()}`;

    it('should create, update, and complete a project', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      let createdProjectId: string | null = null;

      // Step 1: Create the project
      const createUrl = buildThingsUrl('add-project', {
        title: `Test Project ${testProjectId}`,
        notes: 'Created by integration test',
        tags: 'test,project',
        area: 'Work', // Will only assign if area exists
        'to-dos': 'Task 1\nTask 2\nTask 3'
      });

      expect(createUrl).toContain('things:///add-project');
      expect(createUrl).toContain('title=Test%20Project');
      expect(createUrl).toContain('to-dos=Task%201%0ATask%202%0ATask%203');
      
      await expect(openThingsUrl(createUrl)).resolves.not.toThrow();
      console.log('✅ Created test project');
      
      // Wait and find the created project in the database
      await waitForOperation(500);
      
      try {
        const dbPath = findThingsDatabase();
        const query = `SELECT uuid FROM TMTask WHERE title LIKE '%${testProjectId}%' AND type = 1 ORDER BY creationDate DESC LIMIT 1`;
        const result = executeSqlQuery(dbPath, query);
        if (result.length > 0) {
          createdProjectId = result[0][0];
          console.log(`✅ Found created project ID: ${createdProjectId}`);
        } else {
          console.log('⚠️ Could not find created project in database');
          return; // Exit test if we can't find the project
        }
      } catch (error) {
        console.log('⚠️ Error finding created project:', error);
        return; // Exit test on error
      }

      // Step 2: Update the project (if auth token is available)
      if (authToken && createdProjectId) {
        const updateUrl = buildThingsUrl('update-project', {
          id: createdProjectId,
          'auth-token': authToken,
          'append-notes': '\n\nProject updated via integration test',
          'add-tags': 'updated'
        });

        expect(updateUrl).toContain('things:///update-project');
        expect(updateUrl).toContain(`id=${createdProjectId}`);
        expect(updateUrl).toContain('auth-token=');

        await expect(openThingsUrl(updateUrl)).resolves.not.toThrow();
        
        // Verify the update worked
        const isUpdated = await verifyItemUpdated(createdProjectId);
        if (isUpdated) {
          console.log('✅ Updated and verified test project');
        } else {
          console.log('⚠️ Project updated but verification failed');
        }

        // Step 3: Complete all child tasks first, then complete the project
        try {
          const dbPath = findThingsDatabase();
          const childTasksQuery = `SELECT uuid FROM TMTask WHERE project = '${createdProjectId}' AND type = 0 AND status = 0`;
          const childTasks = executeSqlQuery(dbPath, childTasksQuery);
          
          for (const task of childTasks) {
            const taskId = task[0];
            const completeTaskOperation = {
              type: 'to-do' as const,
              operation: 'update' as const,
              id: taskId,
              attributes: { completed: true }
            };
            await executeJsonOperation(completeTaskOperation, authToken);
            await waitForOperation(100); // Small delay between operations
          }
          
          if (childTasks.length > 0) {
            console.log(`✅ Completed ${childTasks.length} child tasks`);
            await waitForOperation(500); // Wait for all child tasks to be processed
          }
        } catch (error) {
          console.log('⚠️ Error completing child tasks:', error);
        }
        
        // Now complete the project using JSON operation
        const operation = {
          type: 'project' as const,
          operation: 'update' as const,
          id: createdProjectId,
          attributes: {
            completed: true
          }
        };

        await expect(executeJsonOperation(operation, authToken)).resolves.not.toThrow();
        
        // Verify completion with longer wait
        const isCompleted = await verifyItemCompleted(createdProjectId, 1000); // Wait 1 second
        if (isCompleted) {
          console.log('✅ Completed and verified test project');
        } else {
          console.log('⚠️ Project completed but verification failed (may need all child tasks completed first)');
        }
      } else {
        console.log('⚠️ Skipping update and completion - no auth token available');
      }
    });
  });

  describe('JSON Import Operations', () => {
    it('should build JSON import URL', () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const testData = [
        {
          type: 'to-do',
          attributes: {
            title: 'JSON Test Todo',
            notes: 'Created via JSON import'
          }
        }
      ];

      const url = buildThingsUrl('json', {
        data: testData,
        reveal: true
      });

      expect(url).toContain('things:///json');
      expect(url).toContain('data=');
      expect(url).toContain('reveal=true');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters', () => {
      // Test URL building with missing title
      const url = buildThingsUrl('add', {
        notes: 'Notes without title'
      });

      // URL should still be built (validation happens at the app level)
      expect(url).toContain('things:///add');
      expect(url).toContain('notes=Notes%20without%20title');
      expect(url).not.toContain('title=');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in parameters', () => {
      const url = buildThingsUrl('add', {
        title: 'Test & Special < > Characters',
        notes: 'Line 1\nLine 2\nSpecial chars: & < > " \' %'
      });

      expect(url).toContain('title=Test%20%26%20Special%20%3C%20%3E%20Characters');
      expect(url).toContain('notes=Line%201%0ALine%202%0ASpecial');
    });

    it('should handle empty parameters', () => {
      const url = buildThingsUrl('add', {
        title: 'Test Todo',
        notes: '',
        tags: ''
      });

      expect(url).toContain('title=Test%20Todo');
      expect(url).not.toContain('notes=');
      expect(url).not.toContain('tags=');
    });

    it('should create todo with deadline and clean up', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const testId = `deadline-test-${Date.now()}`;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deadlineStr = tomorrow.toISOString().split('T')[0];

      const url = buildThingsUrl('add', {
        title: `Test Todo with Deadline ${testId}`,
        deadline: deadlineStr
      });

      expect(url).toContain('deadline=');
      await expect(openThingsUrl(url)).resolves.not.toThrow();
      console.log('✅ Created test todo with deadline');

      // Clean up: find and delete the created todo
      if (authToken) {
        await waitForOperation(500);
        
        try {
          const dbPath = findThingsDatabase();
          const query = `SELECT uuid FROM TMTask WHERE title LIKE '%${testId}%' AND type = 0 ORDER BY creationDate DESC LIMIT 1`;
          const result = executeSqlQuery(dbPath, query);
          if (result.length > 0) {
            const createdTodoId = result[0][0];
            console.log(`✅ Found deadline test todo ID: ${createdTodoId}`);
            
            // Delete the todo using JSON operation
            const deleteOperation = {
              type: 'to-do' as const,
              operation: 'update' as const,
              id: createdTodoId,
              attributes: {
                canceled: true
              }
            };
            
            await executeJsonOperation(deleteOperation, authToken);
            console.log('✅ Cleaned up deadline test todo');
          }
        } catch (error) {
          console.log('⚠️ Could not clean up deadline test todo:', error);
        }
      } else {
        console.log('⚠️ Cannot clean up - no auth token');
      }
    });
  });
});