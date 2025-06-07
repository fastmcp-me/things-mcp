import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { registerAddTodoTool } from '../src/tools/add-todo.js';
import { registerAddProjectTool } from '../src/tools/add-project.js';
import { registerUpdateTodoTool } from '../src/tools/update-todo.js';
import { registerUpdateProjectTool } from '../src/tools/update-project.js';

describe('Things MCP Server', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({
      name: 'test-things-mcp',
      version: '1.0.0'
    });
  });

  it('should create server instance', () => {
    expect(server).toBeDefined();
  });

  it('should register add todo tool', () => {
    expect(() => registerAddTodoTool(server)).not.toThrow();
  });

  it('should register add project tool', () => {
    expect(() => registerAddProjectTool(server)).not.toThrow();
  });

  it('should register update todo tool', () => {
    expect(() => registerUpdateTodoTool(server)).not.toThrow();
  });

  it('should register update project tool', () => {
    expect(() => registerUpdateProjectTool(server)).not.toThrow();
  });
});