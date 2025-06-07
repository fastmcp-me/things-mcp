import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { registerAddTodoTool } from '../src/tools/add-todo.js';
import { registerAddProjectTool } from '../src/tools/add-project.js';
import { registerUpdateTodoTool } from '../src/tools/update-todo.js';
import { registerUpdateProjectTool } from '../src/tools/update-project.js';

describe('Things MCP Server', () => {
  beforeAll(() => {
    if (process.platform !== 'darwin') {
      console.log('⚠️ Skipping tests on non-macOS platform');
      return;
    }
  });
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({
      name: 'test-things-mcp',
      version: '1.0.0'
    });
  });

  it('should create server instance', () => {
    if (process.platform !== 'darwin') {
      console.log('Skipping macOS-specific test');
      return;
    }
    expect(server).toBeDefined();
  });

  it('should register add todo tool', () => {
    if (process.platform !== 'darwin') {
      console.log('Skipping macOS-specific test');
      return;
    }
    expect(() => registerAddTodoTool(server)).not.toThrow();
  });

  it('should register add project tool', () => {
    if (process.platform !== 'darwin') {
      console.log('Skipping macOS-specific test');
      return;
    }
    expect(() => registerAddProjectTool(server)).not.toThrow();
  });

  it('should register update todo tool', () => {
    if (process.platform !== 'darwin') {
      console.log('Skipping macOS-specific test');
      return;
    }
    expect(() => registerUpdateTodoTool(server)).not.toThrow();
  });

  it('should register update project tool', () => {
    if (process.platform !== 'darwin') {
      console.log('Skipping macOS-specific test');
      return;
    }
    expect(() => registerUpdateProjectTool(server)).not.toThrow();
  });
});