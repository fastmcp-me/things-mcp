# Complete Guide to Testing MCP Servers with TypeScript

## Table of Contents
1. [Introduction](#introduction)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Unit Testing MCP Servers](#unit-testing-mcp-servers)
4. [Integration Testing](#integration-testing)
5. [Testing Tools and Utilities](#testing-tools-and-utilities)
6. [Mocking and Stubbing Strategies](#mocking-and-stubbing-strategies)
7. [End-to-End Testing](#end-to-end-testing)
8. [CI/CD Integration](#cicd-integration)
9. [Performance and Load Testing](#performance-and-load-testing)
10. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
11. [Best Practices and Common Patterns](#best-practices-and-common-patterns)
12. [Example Test Suite](#example-test-suite)

## Introduction

The Model Context Protocol (MCP) is an open standard that enables seamless integration between Large Language Models (LLMs) and external data sources or tools. Testing MCP servers is crucial for ensuring reliability, maintaining code quality, and preventing regressions. This guide provides a comprehensive approach to testing MCP servers built with TypeScript.

### Why Testing MCP Servers is Important

- **Early Bug Detection**: Catch errors before they reach production
- **Code Quality**: Ensure your server handles various scenarios correctly
- **Documentation**: Tests serve as living documentation of expected behavior
- **Confidence in Changes**: Refactor and add features without fear of breaking existing functionality
- **Integration Reliability**: Verify that your server works correctly with MCP clients

## Testing Environment Setup

### Prerequisites

```bash
# Install Node.js (v20.18.1 or higher)
node --version

# Install TypeScript
npm install --save-dev typescript @types/node

# Install testing dependencies
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/jest-dom
npm install --save-dev supertest @types/supertest
```

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── tools/
│   │   └── calculator.ts
│   ├── resources/
│   │   └── data-provider.ts
│   └── prompts/
│       └── templates.ts
├── tests/
│   ├── unit/
│   │   ├── tools/
│   │   │   └── calculator.test.ts
│   │   └── server.test.ts
│   ├── integration/
│   │   └── mcp-server.test.ts
│   └── e2e/
│       └── client-server.test.ts
├── jest.config.js
├── tsconfig.json
└── package.json
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### TypeScript Configuration for Tests

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "build"]
}
```

## Unit Testing MCP Servers

### Testing Server Initialization

```typescript
// tests/unit/server.test.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from '../../src/server';

describe('MCP Server Initialization', () => {
  let server: Server;

  beforeEach(() => {
    server = createMCPServer();
  });

  afterEach(async () => {
    await server.close();
  });

  test('should create server with correct metadata', () => {
    expect(server.name).toBe('my-mcp-server');
    expect(server.version).toBe('1.0.0');
  });

  test('should have required capabilities', () => {
    const capabilities = server.getCapabilities();
    expect(capabilities).toHaveProperty('tools');
    expect(capabilities).toHaveProperty('resources');
    expect(capabilities).toHaveProperty('prompts');
  });
});
```

### Testing Tools

```typescript
// tests/unit/tools/calculator.test.ts
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { handleCalculatorTool } from '../../../src/tools/calculator';

describe('Calculator Tool', () => {
  describe('add operation', () => {
    test('should add two positive numbers', async () => {
      const request = {
        params: {
          name: 'calculator_add',
          arguments: { a: 5, b: 3 }
        }
      };

      const result = await handleCalculatorTool(request);
      
      expect(result.content).toEqual([
        {
          type: 'text',
          text: 'Result: 8'
        }
      ]);
    });

    test('should handle negative numbers', async () => {
      const request = {
        params: {
          name: 'calculator_add',
          arguments: { a: -5, b: 3 }
        }
      };

      const result = await handleCalculatorTool(request);
      
      expect(result.content[0].text).toBe('Result: -2');
    });

    test('should throw error for invalid arguments', async () => {
      const request = {
        params: {
          name: 'calculator_add',
          arguments: { a: 'invalid', b: 3 }
        }
      };

      await expect(handleCalculatorTool(request)).rejects.toThrow('Invalid arguments');
    });
  });
});
```

### Testing Resources

```typescript
// tests/unit/resources/data-provider.test.ts
import { handleResourceRequest } from '../../../src/resources/data-provider';

describe('Data Provider Resource', () => {
  test('should return resource list', async () => {
    const resources = await handleResourceRequest({
      params: { uri: 'data://list' }
    });

    expect(resources).toHaveProperty('resources');
    expect(Array.isArray(resources.resources)).toBe(true);
    expect(resources.resources.length).toBeGreaterThan(0);
  });

  test('should return specific resource content', async () => {
    const result = await handleResourceRequest({
      params: { uri: 'data://users/123' }
    });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0]).toHaveProperty('uri', 'data://users/123');
    expect(result.contents[0]).toHaveProperty('text');
  });

  test('should handle non-existent resources', async () => {
    const result = await handleResourceRequest({
      params: { uri: 'data://invalid' }
    });

    expect(result.contents).toHaveLength(0);
  });
});
```

## Integration Testing

### Using MCP Test Client

```typescript
// tests/integration/mcp-server.test.ts
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('MCP Server Integration Tests', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    client = new MCPTestClient({
      serverCommand: 'node',
      serverArgs: [path.join(__dirname, '../../build/index.js')],
    });
    await client.init();
  });

  afterAll(async () => {
    await client.cleanup();
  });

  test('should list available tools', async () => {
    const tools = await client.listTools();
    
    expect(tools).toContainEqual(
      expect.objectContaining({
        name: 'calculator_add',
        description: 'Add two numbers',
        inputSchema: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            a: { type: 'number' },
            b: { type: 'number' }
          })
        })
      })
    );
  });

  test('should execute calculator tool', async () => {
    await client.assertToolCall(
      'calculator_add',
      { a: 10, b: 20 },
      (result) => {
        expect(result.content[0].text).toBe('Result: 30');
      }
    );
  });

  test('should handle concurrent tool calls', async () => {
    const promises = Array.from({ length: 10 }, (_, i) => 
      client.callTool('calculator_add', { a: i, b: i })
    );

    const results = await Promise.all(promises);
    
    results.forEach((result, i) => {
      expect(result.content[0].text).toBe(`Result: ${i * 2}`);
    });
  });
});
```

### Testing Transport Mechanisms

```typescript
// tests/integration/transports.test.ts
describe('Transport Integration Tests', () => {
  describe('STDIO Transport', () => {
    test('should handle stdio communication', async () => {
      const { spawn } = require('child_process');
      const serverProcess = spawn('node', ['build/index.js']);
      
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      serverProcess.stdin.write(JSON.stringify(request) + '\n');

      const response = await new Promise((resolve) => {
        serverProcess.stdout.once('data', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toHaveProperty('tools');

      serverProcess.kill();
    });
  });

  describe('HTTP/SSE Transport', () => {
    test('should handle HTTP streaming', async () => {
      const request = require('supertest');
      const app = require('../../src/http-server');

      const response = await request(app)
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.result).toHaveProperty('tools');
    });
  });
});
```

## Testing Tools and Utilities

### MCP Inspector

Use the MCP Inspector for visual testing and debugging:

```json
// package.json scripts
{
  "scripts": {
    "test:inspector": "npx @modelcontextprotocol/inspector build/index.js",
    "test:dev": "npx fastmcp dev src/server.ts"
  }
}
```

### Mock MCP Server for Testing

```typescript
// tests/mocks/mock-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export class MockMCPServer {
  private server: Server;
  private responses: Map<string, any> = new Map();

  constructor() {
    this.server = new Server({
      name: 'mock-server',
      version: '1.0.0'
    });
    this.setupHandlers();
  }

  mockToolResponse(toolName: string, response: any) {
    this.responses.set(toolName, response);
  }

  private setupHandlers() {
    this.server.setRequestHandler('tools/call', async (request) => {
      const toolName = request.params.name;
      const mockResponse = this.responses.get(toolName);
      
      if (mockResponse) {
        return mockResponse;
      }
      
      throw new Error(`No mock response for tool: ${toolName}`);
    });
  }
}
```

## Mocking and Stubbing Strategies

### Using ts-mockito

```typescript
// tests/unit/services/external-api.test.ts
import { mock, when, instance, verify } from 'ts-mockito';
import { ExternalAPIService } from '../../../src/services/external-api';
import { WeatherTool } from '../../../src/tools/weather';

describe('Weather Tool with Mocked API', () => {
  let mockedAPIService: ExternalAPIService;
  let weatherTool: WeatherTool;

  beforeEach(() => {
    mockedAPIService = mock(ExternalAPIService);
    weatherTool = new WeatherTool(instance(mockedAPIService));
  });

  test('should return weather data', async () => {
    const mockWeatherData = {
      temperature: 25,
      condition: 'sunny',
      humidity: 60
    };

    when(mockedAPIService.fetchWeather('London')).thenResolve(mockWeatherData);

    const result = await weatherTool.execute({ city: 'London' });

    expect(result.content[0].text).toContain('Temperature: 25°C');
    expect(result.content[0].text).toContain('Condition: sunny');
    verify(mockedAPIService.fetchWeather('London')).once();
  });
});
```

### Mocking File System Operations

```typescript
// tests/unit/resources/file-resource.test.ts
import { vol } from 'memfs';
import { FileResource } from '../../../src/resources/file-resource';

jest.mock('fs/promises');

describe('File Resource', () => {
  beforeEach(() => {
    vol.reset();
  });

  test('should read file content', async () => {
    vol.fromJSON({
      '/data/test.txt': 'Hello, MCP!'
    });

    const resource = new FileResource();
    const content = await resource.read('file:///data/test.txt');

    expect(content).toBe('Hello, MCP!');
  });
});
```

## End-to-End Testing

### Testing with Real MCP Clients

```typescript
// tests/e2e/claude-desktop-integration.test.ts
describe('Claude Desktop Integration', () => {
  test('should work with Claude Desktop client', async () => {
    // Start your MCP server
    const serverProcess = spawn('node', ['build/index.js']);

    // Configure Claude Desktop programmatically (if possible)
    // or use pre-configured test environment
    const claudeConfig = {
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['build/index.js']
        }
      }
    };

    // Simulate client requests
    const client = new MCPTestClient({
      transport: 'stdio',
      serverProcess
    });

    // Test various scenarios
    const tools = await client.listTools();
    expect(tools).toHaveLength(5);

    // Cleanup
    serverProcess.kill();
  });
});
```

### Scenario-Based Testing

```typescript
// tests/e2e/scenarios/data-processing.test.ts
describe('Data Processing Scenario', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    client = new MCPTestClient({
      serverCommand: 'node',
      serverArgs: ['build/index.js']
    });
    await client.init();
  });

  test('complete data processing workflow', async () => {
    // 1. Upload data
    const uploadResult = await client.callTool('data_upload', {
      content: 'sample,data\n1,2\n3,4',
      filename: 'test.csv'
    });
    expect(uploadResult.content[0].text).toContain('uploaded successfully');

    // 2. Process data
    const processResult = await client.callTool('data_process', {
      filename: 'test.csv',
      operation: 'sum_columns'
    });
    expect(processResult.content[0].text).toContain('Result: [4, 6]');

    // 3. Export results
    const exportResult = await client.callTool('data_export', {
      format: 'json'
    });
    expect(JSON.parse(exportResult.content[0].text)).toEqual({
      results: [4, 6]
    });
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: MCP Server Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella

  integration:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build MCP Server
      run: |
        npm ci
        npm run build
    
    - name: Test with MCP Inspector
      run: |
        timeout 30s npx @modelcontextprotocol/inspector build/index.js || true
    
    - name: Run E2E tests
      run: npm run test:e2e

  deploy:
    needs: [test, integration]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and publish
      run: |
        npm ci
        npm run build
        npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test:unit",
      "pre-push": "npm run test:integration"
    }
  }
}
```

## Performance and Load Testing

### Benchmarking Tool Performance

```typescript
// tests/performance/benchmark.test.ts
import { performance } from 'perf_hooks';
import { MCPTestClient } from 'mcp-test-client';

describe('Performance Benchmarks', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    client = new MCPTestClient({
      serverCommand: 'node',
      serverArgs: ['build/index.js']
    });
    await client.init();
  });

  test('tool execution performance', async () => {
    const iterations = 100;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await client.callTool('calculator_add', { a: i, b: i });
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);

    console.log(`Average execution time: ${avgTime.toFixed(2)}ms`);
    console.log(`Max execution time: ${maxTime.toFixed(2)}ms`);

    expect(avgTime).toBeLessThan(50); // Average should be under 50ms
    expect(maxTime).toBeLessThan(100); // Max should be under 100ms
  });
});
```

### Load Testing with Artillery

```yaml
# tests/load/artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "MCP Tool Execution"
    engine: "ws"
    flow:
      - send:
          json:
            jsonrpc: "2.0"
            id: "{{ $randomNumber() }}"
            method: "tools/call"
            params:
              name: "calculator_add"
              arguments:
                a: "{{ $randomNumber(1, 100) }}"
                b: "{{ $randomNumber(1, 100) }}"
      - think: 1
```

### Memory Leak Detection

```typescript
// tests/performance/memory-leak.test.ts
describe('Memory Leak Detection', () => {
  test('should not leak memory on repeated tool calls', async () => {
    const client = new MCPTestClient({
      serverCommand: 'node',
      serverArgs: ['build/index.js']
    });
    await client.init();

    const initialMemory = process.memoryUsage().heapUsed;
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Execute many operations
    for (let i = 0; i < 1000; i++) {
      await client.callTool('calculator_add', { a: i, b: i });
    }

    // Force garbage collection again
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    
    await client.cleanup();
  });
});
```

## Debugging and Troubleshooting

### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/build/**/*.js"],
      "env": {
        "DEBUG": "mcp:*",
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--watchAll=false"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Logging for Tests

```typescript
// src/utils/test-logger.ts
export class TestLogger {
  private logs: Array<{ level: string; message: string; timestamp: Date }> = [];

  log(level: string, message: string) {
    const entry = {
      level,
      message,
      timestamp: new Date()
    };
    this.logs.push(entry);
    
    if (process.env.DEBUG) {
      console.log(`[${level}] ${message}`);
    }
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  assertLogged(level: string, messagePattern: string | RegExp) {
    const found = this.logs.some(log => 
      log.level === level && 
      (typeof messagePattern === 'string' 
        ? log.message.includes(messagePattern)
        : messagePattern.test(log.message))
    );
    
    if (!found) {
      throw new Error(`Expected log not found: ${level} - ${messagePattern}`);
    }
  }
}
```

### Error Scenario Testing

```typescript
// tests/unit/error-handling.test.ts
describe('Error Handling', () => {
  test('should handle network timeouts gracefully', async () => {
    const client = new MCPTestClient({
      serverCommand: 'node',
      serverArgs: ['build/index.js'],
      timeout: 100 // 100ms timeout
    });

    // Mock slow operation
    jest.spyOn(client, 'callTool').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    await expect(client.callTool('slow_operation', {}))
      .rejects.toThrow('Operation timed out');
  });

  test('should handle malformed requests', async () => {
    const response = await sendMalformedRequest({
      jsonrpc: '2.0',
      // Missing required 'method' field
      params: {}
    });

    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(-32600); // Invalid Request
  });
});
```

## Best Practices and Common Patterns

### 1. Test Organization

- **Arrange-Act-Assert (AAA) Pattern**: Structure tests clearly
- **One Assertion Per Test**: Keep tests focused
- **Descriptive Test Names**: Use clear, behavior-describing names

```typescript
describe('Calculator Tool', () => {
  test('should return sum when adding two positive integers', async () => {
    // Arrange
    const input = { a: 5, b: 3 };
    
    // Act
    const result = await calculator.add(input);
    
    // Assert
    expect(result).toBe(8);
  });
});
```

### 2. Test Data Management

```typescript
// tests/fixtures/test-data.ts
export const TestData = {
  validCalculatorInputs: [
    { a: 1, b: 2, expected: 3 },
    { a: -1, b: 1, expected: 0 },
    { a: 0, b: 0, expected: 0 }
  ],
  
  invalidCalculatorInputs: [
    { a: 'string', b: 2 },
    { a: null, b: 2 },
    { a: undefined, b: 2 }
  ]
};

// Usage in tests
TestData.validCalculatorInputs.forEach(({ a, b, expected }) => {
  test(`should add ${a} + ${b} = ${expected}`, async () => {
    const result = await calculator.add({ a, b });
    expect(result).toBe(expected);
  });
});
```

### 3. Async Testing Patterns

```typescript
// Proper async/await usage
test('should handle async operations', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// Testing rejected promises
test('should reject on error', async () => {
  await expect(failingOperation()).rejects.toThrow('Expected error');
});

// Testing event emitters
test('should emit events', async () => {
  const emitter = new EventEmitter();
  const promise = new Promise(resolve => {
    emitter.once('data', resolve);
  });
  
  emitter.emit('data', 'test');
  const result = await promise;
  
  expect(result).toBe('test');
});
```

### 4. Isolation and Cleanup

```typescript
describe('Resource Management', () => {
  let server: MCPServer;
  let client: MCPTestClient;

  beforeEach(async () => {
    server = await createTestServer();
    client = await createTestClient(server);
  });

  afterEach(async () => {
    // Always cleanup in reverse order
    await client?.disconnect();
    await server?.shutdown();
    
    // Clear any mocks
    jest.clearAllMocks();
    
    // Reset modules if needed
    jest.resetModules();
  });
});
```

### 5. Testing State Management

```typescript
class StatefulMCPServer {
  private state: Map<string, any> = new Map();

  async setState(key: string, value: any) {
    this.state.set(key, value);
  }

  async getState(key: string) {
    return this.state.get(key);
  }

  reset() {
    this.state.clear();
  }
}

describe('Stateful Operations', () => {
  let server: StatefulMCPServer;

  beforeEach(() => {
    server = new StatefulMCPServer();
  });

  test('should maintain state between operations', async () => {
    await server.setState('user', { id: 1, name: 'Test' });
    const user = await server.getState('user');
    expect(user).toEqual({ id: 1, name: 'Test' });
  });

  test('should isolate state between tests', async () => {
    const user = await server.getState('user');
    expect(user).toBeUndefined();
  });
});
```

## Example Test Suite

Here's a complete example of a well-structured test suite for an MCP server:

```typescript
// tests/complete-example.test.ts
import { MCPTestClient } from 'mcp-test-client';
import { MockMCPServer } from './mocks/mock-mcp-server';
import { TestLogger } from '../src/utils/test-logger';
import path from 'path';

describe('Weather MCP Server - Complete Test Suite', () => {
  let client: MCPTestClient;
  let mockServer: MockMCPServer;
  let logger: TestLogger;

  beforeAll(async () => {
    logger = new TestLogger();
    
    client = new MCPTestClient({
      serverCommand: 'node',
      serverArgs: [path.join(__dirname, '../build/index.js')],
      env: {
        LOG_LEVEL: 'debug',
        API_KEY: 'test-key'
      }
    });
    
    await client.init();
  });

  afterAll(async () => {
    await client.cleanup();
  });

  describe('Tool Discovery', () => {
    test('should list weather tool', async () => {
      const tools = await client.listTools();
      
      expect(tools).toContainEqual(
        expect.objectContaining({
          name: 'get_weather',
          description: expect.stringContaining('weather'),
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              city: expect.objectContaining({
                type: 'string',
                description: expect.any(String)
              })
            }),
            required: ['city']
          })
        })
      );
    });
  });

  describe('Weather Data Retrieval', () => {
    test('should return weather for valid city', async () => {
      await client.assertToolCall(
        'get_weather',
        { city: 'London' },
        (result) => {
          const text = result.content[0].text;
          expect(text).toMatch(/Temperature: \d+°C/);
          expect(text).toMatch(/Condition: \w+/);
          expect(text).toMatch(/Humidity: \d+%/);
        }
      );
    });

    test('should handle city not found', async () => {
      await client.assertToolCall(
        'get_weather',
        { city: 'InvalidCityName123' },
        (result) => {
          expect(result.content[0].text).toContain('City not found');
        }
      );
    });

    test('should validate input parameters', async () => {
      await expect(
        client.callTool('get_weather', { city: '' })
      ).rejects.toThrow('City name cannot be empty');
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time', async () => {
      const start = Date.now();
      await client.callTool('get_weather', { city: 'Paris' });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async () => {
      const cities = ['New York', 'Tokyo', 'Berlin', 'Sydney', 'Cairo'];
      const promises = cities.map(city => 
        client.callTool('get_weather', { city })
      );
      
      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result.content[0].text).toContain(cities[index]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Simulate API error by using invalid API key
      process.env.API_KEY = 'invalid-key';
      
      const result = await client.callTool('get_weather', { city: 'London' });
      
      expect(result.content[0].text).toContain('API error');
      expect(result.isError).toBe(true);
    });

    test('should timeout long-running requests', async () => {
      jest.setTimeout(5000);
      
      // Mock a slow API response
      const slowCity = 'SlowResponseCity';
      
      await expect(
        client.callTool('get_weather', { city: slowCity }, { timeout: 100 })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Logging and Monitoring', () => {
    test('should log tool executions', async () => {
      logger.clear();
      
      await client.callTool('get_weather', { city: 'London' });
      
      logger.assertLogged('info', 'Tool execution: get_weather');
      logger.assertLogged('debug', 'Input: {"city":"London"}');
    });
  });
});
```

## Conclusion

Testing MCP servers thoroughly requires a multi-layered approach combining unit tests, integration tests, and end-to-end tests. By following the patterns and practices outlined in this guide, you can ensure your MCP server is robust, reliable, and ready for production use.

Key takeaways:
- Start with comprehensive unit tests for individual components
- Use integration tests to verify server behavior with real transports
- Implement E2E tests to ensure compatibility with MCP clients
- Integrate testing into your CI/CD pipeline
- Monitor performance and watch for regressions
- Use proper mocking strategies to isolate components
- Always clean up resources and maintain test isolation

Remember that testing is not just about catching bugs—it's about building confidence in your code and providing documentation for how your server should behave. Invest time in creating a solid test suite, and it will pay dividends in the long run.