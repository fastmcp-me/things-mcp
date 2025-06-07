import { describe, it, expect, beforeAll } from '@jest/globals';
import { buildThingsUrl, openThingsUrl } from '../src/utils/url-builder.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Things Integration Tests', () => {
  let canRunIntegrationTests = false;

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

  describe('Todo Operations', () => {
    const testTodoId = `test-todo-${Date.now()}`;

    it('should create a new todo', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const url = buildThingsUrl('add', {
        title: `Test Todo ${testTodoId}`,
        notes: 'Created by integration test',
        tags: 'test,integration',
        when: 'today'
      });

      expect(url).toContain('things:///add');
      expect(url).toContain('title=Test%20Todo');
      expect(url).toContain('notes=Created%20by%20integration%20test');
      expect(url).toContain('tags=test%2Cintegration');
      expect(url).toContain('when=today');

      // Execute the URL (this will create the todo in Things)
      await expect(openThingsUrl(url)).resolves.not.toThrow();
    });

    it('should create a todo with checklist items', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const url = buildThingsUrl('add', {
        title: `Test Todo with Checklist ${testTodoId}`,
        'checklist-items': 'Item 1\nItem 2\nItem 3'
      });

      expect(url).toContain('checklist-items=Item%201%0AItem%202%0AItem%203');
      await expect(openThingsUrl(url)).resolves.not.toThrow();
    });

    it('should handle todo with deadline', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deadlineStr = tomorrow.toISOString().split('T')[0];

      const url = buildThingsUrl('add', {
        title: `Test Todo with Deadline ${testTodoId}`,
        deadline: deadlineStr
      });

      expect(url).toContain('deadline=');
      await expect(openThingsUrl(url)).resolves.not.toThrow();
    });
  });

  describe('Project Operations', () => {
    const testProjectId = `test-project-${Date.now()}`;

    it('should create a new project', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const url = buildThingsUrl('add-project', {
        title: `Test Project ${testProjectId}`,
        notes: 'Created by integration test',
        tags: 'test,project',
        'to-dos': 'Task 1\nTask 2\nTask 3'
      });

      expect(url).toContain('things:///add-project');
      expect(url).toContain('title=Test%20Project');
      expect(url).toContain('to-dos=Task%201%0ATask%202%0ATask%203');
      
      await expect(openThingsUrl(url)).resolves.not.toThrow();
    });

    it('should create project with area assignment', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const url = buildThingsUrl('add-project', {
        title: `Test Project in Area ${testProjectId}`,
        area: 'Personal', // Assuming 'Personal' area exists
        when: 'someday'
      });

      expect(url).toContain('area=Personal');
      expect(url).toContain('when=someday');
      
      await expect(openThingsUrl(url)).resolves.not.toThrow();
    });
  });

  describe('Update Operations', () => {
    it('should require auth token for updates', () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      // This test just verifies URL construction for updates
      const url = buildThingsUrl('update', {
        id: 'test-id',
        title: 'Updated Title',
        'auth-token': 'test-token'
      });

      expect(url).toContain('things:///update');
      expect(url).toContain('id=test-id');
      expect(url).toContain('title=Updated%20Title');
      expect(url).toContain('auth-token=test-token');
    });

    it('should build update project URL', () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const url = buildThingsUrl('update-project', {
        id: 'project-id',
        completed: true,
        'auth-token': 'test-token'
      });

      expect(url).toContain('things:///update-project');
      expect(url).toContain('completed=true');
    });
  });

  describe('Show Operations', () => {
    it('should build show URLs for different views', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const views = ['today', 'inbox', 'anytime', 'upcoming', 'someday'];
      
      for (const view of views) {
        const url = buildThingsUrl('show', { list: view });
        expect(url).toContain(`things:///show?list=${view}`);
        
        // Test opening each view
        await expect(openThingsUrl(url)).resolves.not.toThrow();
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });

    it('should handle search operations', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      const url = buildThingsUrl('search', { query: 'test' });
      expect(url).toContain('things:///search?query=test');
      
      await expect(openThingsUrl(url)).resolves.not.toThrow();
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
    it('should handle invalid URLs gracefully', async () => {
      if (!canRunIntegrationTests) {
        console.log('Skipping - Things URL scheme not enabled');
        return;
      }

      // Test with malformed URL
      const invalidUrl = 'things:///invalid-command';
      
      // This should not throw, but the operation may fail silently
      await expect(openThingsUrl(invalidUrl)).resolves.not.toThrow();
    });

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
});