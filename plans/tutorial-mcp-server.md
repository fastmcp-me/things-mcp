# Complete Guide: Setting Up a TypeScript MCP Server

## Table of Contents
1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Core Implementation](#core-implementation)
5. [Transport Options](#transport-options)
6. [Error Handling & Debugging](#error-handling--debugging)
7. [Authentication & Security](#authentication--security)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Best Practices](#best-practices)
11. [Advanced Topics](#advanced-topics)

## Introduction

The Model Context Protocol (MCP) is an open standard that enables seamless integration between LLM applications and external data sources/tools. TypeScript is an excellent choice for building MCP servers due to its strong typing, modern async capabilities, and the mature official SDK.

### Key Benefits of Using TypeScript for MCP:
- **Type Safety**: Catch errors at compile time
- **Excellent IDE Support**: Auto-completion and refactoring
- **Modern JavaScript Features**: Async/await, ES modules
- **Official SDK Support**: First-class TypeScript SDK from Anthropic

## Quick Start

### Prerequisites
- Node.js 20 or higher
- TypeScript 5.0 or later
- npm or pnpm package manager

### 1. Create a New Project

```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
```

### 2. Install Dependencies

```bash
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript @types/node
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
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
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 4. Update package.json

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-mcp-server": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js",
    "dev": "tsc --watch",
    "start": "node build/index.js",
    "inspector": "npx @modelcontextprotocol/inspector build/index.js"
  },
  "files": ["build"]
}
```

## Project Structure

### Recommended Directory Layout

```
my-mcp-server/
├── src/
│   ├── index.ts           # Main entry point
│   ├── tools/             # Tool implementations
│   │   ├── calculator.ts
│   │   └── weather.ts
│   ├── resources/         # Resource providers
│   │   └── files.ts
│   ├── prompts/           # Prompt templates
│   │   └── templates.ts
│   ├── utils/             # Utility functions
│   │   ├── logger.ts
│   │   └── validation.ts
│   └── types/             # TypeScript type definitions
│       └── index.ts
├── build/                 # Compiled output
├── tests/                 # Test files
├── .env                   # Environment variables
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

## Core Implementation

### Basic Server Setup

Create `src/index.ts`:

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the server instance
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0"
});

// Define a tool
server.addTool({
  name: "calculate",
  description: "Perform basic arithmetic operations",
  inputSchema: z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number()
  }),
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case "add": return { result: a + b };
      case "subtract": return { result: a - b };
      case "multiply": return { result: a * b };
      case "divide": 
        if (b === 0) throw new Error("Division by zero");
        return { result: a / b };
    }
  }
});

// Define a resource
server.addResource({
  name: "config",
  description: "Server configuration",
  uri: "config://settings",
  async read() {
    return {
      mimeType: "application/json",
      text: JSON.stringify({
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0"
      }, null, 2)
    };
  }
});

// Define a prompt
server.addPrompt({
  name: "analyze_data",
  description: "Analyze data with specific parameters",
  arguments: [
    { name: "data_type", description: "Type of data to analyze", required: true }
  ],
  async render({ data_type }) {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze the following ${data_type} data and provide insights...`
          }
        }
      ]
    };
  }
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP server started successfully");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
```

### Modular Tool Implementation

Create `src/tools/weather.ts`:

```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerWeatherTool(server: McpServer) {
  server.addTool({
    name: "get_weather",
    description: "Get current weather for a location",
    inputSchema: z.object({
      location: z.string().describe("City name or coordinates"),
      units: z.enum(["celsius", "fahrenheit"]).optional()
    }),
    execute: async ({ location, units = "celsius" }) => {
      // In production, call a real weather API
      const mockWeather = {
        location,
        temperature: units === "celsius" ? 22 : 72,
        condition: "Partly cloudy",
        humidity: 65,
        units
      };
      
      return {
        weather: mockWeather,
        timestamp: new Date().toISOString()
      };
    }
  });
}
```

## Transport Options

MCP supports three transport mechanisms:

### 1. Standard Input/Output (stdio) - Local

Best for: Desktop applications, CLI tools, local development

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. Streamable HTTP - Remote/Production

Best for: Cloud deployment, multi-user access, scalable applications

```typescript
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

// Session management for stateful servers
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  
  if (!sessionId) {
    // New session - create transport and generate ID
    const newSessionId = crypto.randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId
    });
    
    transports[newSessionId] = transport;
    res.setHeader('Mcp-Session-Id', newSessionId);
    
    await server.connect(transport);
  } else if (transports[sessionId]) {
    // Existing session
    const transport = transports[sessionId];
    await transport.handleRequest(req, res, req.body);
  } else {
    res.status(400).json({
      error: "Invalid session ID"
    });
  }
});

app.listen(3000);
```

### 3. Server-Sent Events (SSE) - Deprecated

Note: SSE transport is deprecated. Use Streamable HTTP for new implementations.

## Error Handling & Debugging

### Structured Error Handling

```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

server.addTool({
  name: "risky_operation",
  // ... schema definition
  execute: async (params) => {
    try {
      // Validate input
      if (!params.data) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Data parameter is required"
        );
      }
      
      // Perform operation
      const result = await performOperation(params.data);
      return { success: true, result };
      
    } catch (error) {
      // Log error details
      logger.error("Operation failed", {
        tool: "risky_operation",
        params,
        error: error.message
      });
      
      // Return user-friendly error
      if (error instanceof McpError) {
        throw error;
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        "Operation failed. Please try again."
      );
    }
  }
});
```

### Logging Best Practices

Create `src/utils/logger.ts`:

```typescript
export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  private log(level: string, message: string, data?: any) {
    // Always log to stderr for MCP servers
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data
    }));
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  error(message: string, data?: any) {
    this.log('error', message, data);
  }
  
  debug(message: string, data?: any) {
    if (process.env.DEBUG) {
      this.log('debug', message, data);
    }
  }
}
```

### Using MCP Inspector

The MCP Inspector is an essential debugging tool:

```bash
# Install and run the inspector
npx @modelcontextprotocol/inspector build/index.js

# For TypeScript files directly (requires tsx)
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# With custom ports
CLIENT_PORT=8080 SERVER_PORT=9000 npx @modelcontextprotocol/inspector build/index.js
```

## Authentication & Security

### API Key Authentication (Simple)

```typescript
server.addTool({
  name: "secure_operation",
  // ... schema
  execute: async (params, { authInfo }) => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || authInfo?.apiKey !== apiKey) {
      throw new McpError(
        ErrorCode.Unauthorized,
        "Invalid API key"
      );
    }
    
    // Perform secure operation
  }
});
```

### OAuth 2.0 Implementation (Production)

For production deployments, implement OAuth 2.0:

```typescript
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';

const app = express();

const oauthProvider = new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    revocationUrl: "https://api.github.com/applications/{client_id}/token"
  },
  verifyAccessToken: async (token) => {
    // Verify token with GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    const user = await response.json();
    return {
      token,
      clientId: process.env.GITHUB_CLIENT_ID,
      scopes: ["user:email", "repo"]
    };
  }
});

app.use('/auth', mcpAuthRouter({
  provider: oauthProvider,
  issuerUrl: new URL("https://myserver.com"),
  baseUrl: new URL("https://myserver.com/auth")
}));
```

## Testing

### Unit Testing with Jest

```typescript
// tests/tools/calculator.test.ts
import { describe, it, expect } from '@jest/globals';
import { calculateTool } from '../../src/tools/calculator';

describe('Calculator Tool', () => {
  it('should add numbers correctly', async () => {
    const result = await calculateTool.execute({
      operation: 'add',
      a: 5,
      b: 3
    });
    
    expect(result.result).toBe(8);
  });
  
  it('should handle division by zero', async () => {
    await expect(calculateTool.execute({
      operation: 'divide',
      a: 10,
      b: 0
    })).rejects.toThrow('Division by zero');
  });
});
```

### Integration Testing

```typescript
// tests/integration/server.test.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

describe('MCP Server Integration', () => {
  let server: McpServer;
  let transport: InMemoryTransport;
  
  beforeEach(async () => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0"
    });
    
    transport = new InMemoryTransport();
    await server.connect(transport);
  });
  
  it('should handle tool calls', async () => {
    const response = await transport.request({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "calculate",
        arguments: { operation: "add", a: 5, b: 3 }
      },
      id: 1
    });
    
    expect(response.result).toEqual({ result: 8 });
  });
});
```

## Production Deployment

### Environment Configuration

Create `.env.production`:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
API_KEY=your-secure-api-key
DATABASE_URL=postgres://user:pass@host:5432/db
ALLOWED_ORIGINS=https://app.example.com,https://api.example.com
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "build/index.js"]
```

### Cloud Deployment Options

#### 1. Cloudflare Workers
Best for: Edge deployment, automatic scaling, global distribution

```typescript
// src/cloudflare-worker.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export default {
  async fetch(request: Request): Promise<Response> {
    const server = new McpServer({
      name: "cloudflare-mcp",
      version: "1.0.0"
    });
    
    // Register tools...
    
    const transport = new StreamableHTTPServerTransport();
    await server.connect(transport);
    
    return transport.handleRequest(request);
  }
};
```

#### 2. Google Cloud Run
Best for: Containerized deployments, automatic scaling

```bash
# Build and deploy
gcloud run deploy mcp-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 3. Azure Functions
Best for: Microsoft ecosystem integration

```typescript
// src/azure-function.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const httpTrigger: AzureFunction = async function (
  context: Context, 
  req: HttpRequest
): Promise<void> {
  const server = new McpServer({
    name: "azure-mcp",
    version: "1.0.0"
  });
  
  // Handle MCP request...
};

export default httpTrigger;
```

## Best Practices

### 1. Type Safety
- Always use TypeScript's strict mode
- Define explicit types for all parameters and returns
- Use Zod or similar for runtime validation

### 2. Error Handling
- Never expose internal errors to users
- Log all errors with context
- Use structured error codes
- Implement retry logic for external services

### 3. Performance
- Use connection pooling for databases
- Implement caching where appropriate
- Monitor memory usage
- Use streaming for large responses

### 4. Security
- Always validate and sanitize inputs
- Use environment variables for secrets
- Implement rate limiting
- Enable CORS appropriately
- Use HTTPS in production

### 5. Code Organization
- Keep tools focused and single-purpose
- Use dependency injection
- Separate business logic from MCP handlers
- Write comprehensive tests

## Advanced Topics

### 1. Session Management

```typescript
class SessionManager {
  private sessions = new Map<string, SessionData>();
  
  createSession(userId: string): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      userId,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });
    return sessionId;
  }
  
  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = Date.now();
      return session;
    }
    return null;
  }
  
  cleanupSessions() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    for (const [id, session] of this.sessions) {
      if (now - session.lastAccessed > timeout) {
        this.sessions.delete(id);
      }
    }
  }
}
```

### 2. Tool Composition

```typescript
// Compose multiple tools into complex operations
server.addTool({
  name: "analyze_and_summarize",
  description: "Fetch data, analyze it, and create a summary",
  inputSchema: z.object({
    url: z.string().url(),
    analysisType: z.enum(["sentiment", "keywords", "summary"])
  }),
  execute: async ({ url, analysisType }) => {
    // Call fetch tool
    const fetchResult = await server.callTool("fetch_content", { url });
    
    // Call analysis tool
    const analysisResult = await server.callTool("analyze_text", {
      text: fetchResult.content,
      type: analysisType
    });
    
    // Call summary tool
    const summary = await server.callTool("create_summary", {
      data: analysisResult,
      format: "markdown"
    });
    
    return { summary };
  }
});
```

### 3. Streaming Responses

```typescript
server.addTool({
  name: "stream_data",
  description: "Stream large dataset",
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async function* ({ query }) {
    const totalRecords = 10000;
    const batchSize = 100;
    
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = await fetchBatch(query, i, batchSize);
      
      yield {
        progress: (i + batchSize) / totalRecords,
        data: batch
      };
    }
  }
});
```

### 4. Plugin Architecture

```typescript
interface McpPlugin {
  name: string;
  version: string;
  register(server: McpServer): void;
}

class PluginManager {
  private plugins: McpPlugin[] = [];
  
  async loadPlugin(path: string) {
    const plugin = await import(path);
    this.plugins.push(plugin.default);
  }
  
  registerAll(server: McpServer) {
    for (const plugin of this.plugins) {
      console.log(`Registering plugin: ${plugin.name} v${plugin.version}`);
      plugin.register(server);
    }
  }
}
```

## Conclusion

Building a TypeScript MCP server provides a robust, type-safe way to extend LLM capabilities. Key takeaways:

1. **Start Simple**: Begin with stdio transport for local development
2. **Use the Official SDK**: It handles protocol complexity for you
3. **Focus on Tools**: Design clear, focused tools that do one thing well
4. **Test Thoroughly**: Use MCP Inspector and automated tests
5. **Plan for Production**: Consider authentication, scaling, and monitoring early

## Resources

- [Official MCP Documentation](https://modelcontextprotocol.io)
- [TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Example Servers](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)

---

Remember: The MCP ecosystem is rapidly evolving. Always check the official documentation for the latest updates and best practices.