# Best Practices for Writing MCP Server Prompts and Descriptions

## Executive Summary

Model Context Protocol (MCP) servers expose capabilities to AI models through three primary components: **Tools**, **Resources**, and **Prompts**. The quality of descriptions for these components directly impacts how effectively AI models can discover, understand, and utilize your server's functionality. This report provides comprehensive guidelines based on analysis of successful MCP implementations, prompt engineering research, and real-world examples.

**Key Takeaways:**
- Clear, actionable descriptions are more important than technical completeness
- Structure and consistency across descriptions improve AI comprehension
- Follow established naming conventions and patterns from successful servers
- Test descriptions with actual AI models to ensure proper understanding
- Security considerations should be embedded in description design

## Table of Contents

1. [Understanding MCP Components](#understanding-mcp-components)
2. [Core Principles for MCP Descriptions](#core-principles)
3. [Writing Effective Tool Descriptions](#tool-descriptions)
4. [Crafting Resource Descriptions](#resource-descriptions)
5. [Designing MCP Prompts](#mcp-prompts)
6. [Naming Conventions](#naming-conventions)
7. [Common Patterns and Anti-Patterns](#patterns)
8. [Testing and Validation](#testing)
9. [Security Considerations](#security)
10. [Real-World Examples](#examples)
11. [Implementation Checklist](#checklist)

## 1. Understanding MCP Components {#understanding-mcp-components}

### Tools
- **Purpose**: Enable AI to perform actions and side effects
- **Examples**: Creating files, sending emails, executing queries
- **Key Elements**: Name, description, input schema, annotations

### Resources
- **Purpose**: Provide read-only data access to AI
- **Examples**: Configuration files, documentation, system state
- **Key Elements**: Name, description, URI pattern, MIME type

### Prompts
- **Purpose**: Offer reusable templates for common AI interactions
- **Examples**: Analysis templates, report generators, workflow guides
- **Key Elements**: Name, description, arguments, message templates

## 2. Core Principles for MCP Descriptions {#core-principles}

### 2.1 Clarity Over Cleverness
```typescript
// ❌ Poor: Clever but unclear
{
  name: "fs_op",
  description: "Performs filesystem manipulation"
}

// ✅ Good: Clear and specific
{
  name: "read_file",
  description: "Read the complete contents of a file from the file system"
}
```

### 2.2 Action-Oriented Language
Use active verbs that clearly indicate what the tool does:
- **Tools**: Start with action verbs (create, read, update, delete, search, analyze)
- **Resources**: Use noun phrases that describe what is provided
- **Prompts**: Use descriptive phrases that explain the interaction pattern

### 2.3 Specificity and Context
Provide enough context for the AI to understand when and how to use each component:

```typescript
// ❌ Poor: Too vague
{
  description: "Manages data"
}

// ✅ Good: Specific and contextual
{
  description: "Search for files by name pattern within allowed directories, returning paths and metadata for matching files"
}
```

### 2.4 Consistency Across Components
Maintain consistent terminology, formatting, and structure throughout your server:
- Use the same terms for similar concepts
- Follow a standard description format
- Apply consistent parameter naming

## 3. Writing Effective Tool Descriptions {#tool-descriptions}

### 3.1 Tool Description Structure

A well-structured tool description should include:
1. **Primary Action**: What the tool does
2. **Input Context**: What information is needed
3. **Output Expectation**: What will be returned
4. **Constraints/Limitations**: Any restrictions or special considerations

### 3.2 Tool Description Template

```typescript
{
  name: "action_target",
  description: "[Action verb] [what it operates on] [key details]. [Input requirements]. [Output format]. [Important constraints].",
  inputSchema: {
    type: "object",
    properties: {
      param_name: {
        type: "string",
        description: "Clear description of what this parameter controls"
      }
    }
  },
  annotations: {
    title: "Human-Friendly Tool Name",
    readOnlyHint: true,  // No side effects
    destructiveHint: false,  // Doesn't delete/modify critical data
    idempotentHint: true,  // Same input = same result
    openWorldHint: false  // Doesn't interact with external systems
  }
}
```

### 3.3 Real-World Tool Examples

#### File System Operations
```typescript
{
  name: "read_multiple_files",
  description: "Read the contents of multiple files simultaneously. Accepts an array of file paths and returns their contents in the same order. Non-existent files will return null values.",
  inputSchema: {
    type: "object",
    properties: {
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Array of absolute or relative file paths to read"
      }
    },
    required: ["paths"]
  }
}
```

#### API Integration
```typescript
{
  name: "search_repositories",
  description: "Search GitHub repositories by query string. Returns repository name, description, stars, and last update time. Results are sorted by relevance unless specified otherwise.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (supports GitHub search syntax)"
      },
      sort: {
        type: "string",
        enum: ["stars", "forks", "updated", "relevance"],
        description: "Sort order for results (default: relevance)"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (1-100, default: 30)"
      }
    },
    required: ["query"]
  }
}
```

### 3.4 Parameter Descriptions

Each parameter should have:
- **Clear purpose**: What the parameter controls
- **Format expectations**: Valid values, formats, or patterns
- **Default behavior**: What happens if omitted
- **Examples**: When helpful for complex formats

```typescript
{
  time_format: {
    type: "string",
    description: "Time format for output timestamps. Use 'iso' for ISO-8601 (2024-01-01T12:00:00Z), 'unix' for Unix timestamp (1704106800), or 'relative' for human-readable (2 hours ago). Default: 'iso'"
  }
}
```

## 4. Crafting Resource Descriptions {#resource-descriptions}

### 4.1 Resource Description Components

Resources should clearly communicate:
- **What data is provided**
- **Format of the data**
- **Update frequency or staleness**
- **Access patterns**

### 4.2 Resource Examples

```typescript
{
  name: "system_logs",
  description: "Real-time system logs from the application server, including error traces, warnings, and info messages. Updated continuously. Returns last 1000 lines by default.",
  uri: "logs://system/current",
  mimeType: "text/plain"
}

{
  name: "api_documentation", 
  description: "Complete API reference documentation in Markdown format, including all endpoints, parameters, and example requests/responses. Updated with each deployment.",
  uri: "docs://api/reference",
  mimeType: "text/markdown"
}
```

## 5. Designing MCP Prompts {#mcp-prompts}

### 5.1 Prompt Structure

MCP prompts are reusable templates that guide AI interactions. They should:
- Define clear interaction patterns
- Specify required and optional arguments
- Provide structured output formats
- Include usage examples

### 5.2 Effective Prompt Examples

```typescript
{
  name: "analyze_error_logs",
  description: "Analyze error logs to identify patterns, root causes, and provide actionable recommendations. Generates a structured report with severity assessment.",
  arguments: [
    {
      name: "time_range",
      description: "Time period to analyze (e.g., 'last 24 hours', '2024-01-01 to 2024-01-07')",
      required: true
    },
    {
      name: "service_name",
      description: "Specific service to focus on, or 'all' for system-wide analysis",
      required: false
    }
  ]
}

{
  name: "generate_test_cases",
  description: "Generate comprehensive test cases for a given function or API endpoint, including edge cases, error scenarios, and performance considerations.",
  arguments: [
    {
      name: "code_reference",
      description: "Function name, file path, or API endpoint to test",
      required: true
    },
    {
      name: "test_framework",
      description: "Testing framework to use (jest, pytest, mocha). Default: jest",
      required: false
    }
  ]
}
```

### 5.3 Message Templates

When implementing prompts, structure the message templates clearly:

```typescript
async render({ time_range, service_name }) {
  return {
    messages: [
      {
        role: "system",
        content: {
          type: "text",
          text: "You are a senior DevOps engineer specializing in log analysis and system debugging."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `Analyze the error logs from ${time_range} ${service_name ? `for service: ${service_name}` : 'across all services'}. 
          
          Provide:
          1. Executive summary of issues found
          2. Pattern analysis with frequency counts
          3. Root cause hypotheses
          4. Prioritized recommendations
          5. Monitoring suggestions to prevent recurrence`
        }
      }
    ]
  };
}
```

## 6. Naming Conventions {#naming-conventions}

### 6.1 General Rules

1. **Use snake_case** for names (following MCP specification examples)
2. **Be descriptive but concise** (2-4 words typically)
3. **Use standard verbs** for tools: create, read, update, delete, list, search, get, set
4. **Avoid abbreviations** unless universally understood (e.g., URL, API)
5. **Maintain consistency** across your server

### 6.2 Naming Patterns

#### Tools
```
action_target[_modifier]

Examples:
- read_file
- create_directory
- search_repositories
- update_user_profile
- delete_old_logs
```

#### Resources
```
data_type[_scope]

Examples:
- system_config
- user_preferences
- api_documentation
- error_logs_recent
```

#### Prompts
```
action_context[_output]

Examples:
- analyze_code_quality
- generate_weekly_report
- debug_performance_issue
- create_test_suite
```

## 7. Common Patterns and Anti-Patterns {#patterns}

### 7.1 Effective Patterns ✅

#### Progressive Disclosure
```typescript
// Start with essential information, add details as needed
{
  name: "query_database",
  description: "Execute SQL queries on the application database. Supports SELECT queries only for safety.",
  // More details in parameter descriptions
}
```

#### Explicit Constraints
```typescript
{
  description: "Upload files to cloud storage. Maximum file size: 100MB. Supported formats: PDF, DOCX, TXT, CSV. Files are scanned for malware before upload."
}
```

#### Output Format Clarity
```typescript
{
  description: "Parse CSV file and return data as JSON array. Each row becomes an object with column headers as keys. Empty cells return null values."
}
```

### 7.2 Anti-Patterns to Avoid ❌

#### Vague Descriptions
```typescript
// ❌ Avoid
{
  description: "Handles file operations"
}

// ✅ Better
{
  description: "Read, write, and delete files within the project directory with automatic backup creation"
}
```

#### Technical Jargon Overload
```typescript
// ❌ Avoid
{
  description: "Implements RFC-2822 compliant MIME multipart/form-data POST with chunked transfer encoding"
}

// ✅ Better
{
  description: "Upload files to the server with progress tracking. Supports large files through automatic chunking."
}
```

#### Missing Context
```typescript
// ❌ Avoid
{
  description: "Search for items"
}

// ✅ Better
{
  description: "Search for products in the inventory by name, SKU, or category. Returns matching items with pricing and availability."
}
```

## 8. Testing and Validation {#testing}

### 8.1 Description Testing Checklist

1. **Clarity Test**: Can a new developer understand what this does without additional context?
2. **Completeness Test**: Does it answer what, how, when, and why?
3. **AI Comprehension Test**: Does the AI model correctly identify when to use this tool/resource?
4. **Edge Case Coverage**: Are limitations and special cases mentioned?

### 8.2 Testing with MCP Inspector

Use the MCP Inspector to validate your descriptions:

```bash
# Test your server
npx @modelcontextprotocol/inspector build/index.js

# Verify that:
# 1. Tool names and descriptions appear correctly
# 2. Parameters are properly documented
# 3. Test invocations work as expected
```

### 8.3 AI Model Testing

Test with actual AI models to ensure proper understanding:

```typescript
// Test prompt for AI
const testPrompt = `
Given these available tools: ${JSON.stringify(tools, null, 2)}

Which tool would you use to:
1. Find all JavaScript files modified in the last week?
2. Create a backup of the database?
3. Send a notification to users?

Explain your reasoning.
`;
```

## 9. Security Considerations {#security}

### 9.1 Description Security

Your descriptions should:
- **Clearly indicate destructive operations**
- **Specify authorization requirements**
- **Mention data sensitivity**
- **Highlight external interactions**

### 9.2 Security-Conscious Examples

```typescript
{
  name: "delete_user_data",
  description: "Permanently delete all user data including profile, files, and activity history. THIS ACTION CANNOT BE UNDONE. Requires admin authorization. Triggers compliance audit log.",
  annotations: {
    destructiveHint: true,
    readOnlyHint: false
  }
}

{
  name: "execute_sql_query",
  description: "Execute read-only SQL queries on the analytics database. Queries are limited to SELECT statements. Results are automatically redacted for PII. Maximum 10,000 rows returned.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: true  // Connects to external database
  }
}
```

### 9.3 Prompt Injection Prevention

Design descriptions that are resistant to prompt injection:

```typescript
// Include safety instructions in system prompts
{
  name: "process_user_input",
  description: "Process and validate user-submitted content. Automatically sanitizes input to prevent code injection. HTML tags are escaped, SQL keywords are blocked."
}
```

## 10. Real-World Examples {#examples}

### 10.1 GitHub MCP Server

Analyzing GitHub's official MCP server reveals excellent patterns:

```typescript
{
  name: "create_issue",
  description: "Create a new issue in a GitHub repository",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (username or organization)"
      },
      repo: {
        type: "string", 
        description: "Repository name"
      },
      title: {
        type: "string",
        description: "Issue title"
      },
      body: {
        type: "string",
        description: "Issue description in Markdown"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Labels to apply to the issue"
      }
    },
    required: ["owner", "repo", "title"]
  }
}
```

**Key Observations:**
- Clear parameter names that match GitHub's terminology
- Optional parameters clearly distinguished from required
- Descriptions are concise but complete
- Format expectations specified (e.g., "in Markdown")

### 10.2 Filesystem Server

The filesystem server demonstrates safety-first descriptions:

```typescript
{
  name: "write_file",
  description: "Write content to a file in allowed directories only. Creates parent directories if needed. Overwrites existing files. Binary files should be base64 encoded.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "File path relative to allowed directories"
      },
      content: {
        type: "string",
        description: "Text content or base64-encoded binary data"
      },
      encoding: {
        type: "string",
        enum: ["utf8", "base64"],
        description: "Content encoding (default: utf8)"
      }
    }
  }
}
```

**Key Observations:**
- Safety constraints mentioned upfront
- Behavior clearly specified (overwrites, creates directories)
- Encoding options explained
- Default values indicated

## 11. Implementation Checklist {#checklist}

Use this checklist when creating MCP component descriptions:

### Pre-Implementation
- [ ] Define clear objectives for each tool/resource/prompt
- [ ] Research similar implementations for patterns
- [ ] Plan consistent naming scheme
- [ ] Consider security implications

### Description Writing
- [ ] Start with an action verb (tools) or clear noun (resources)
- [ ] Include primary function in first sentence
- [ ] Specify all constraints and limitations
- [ ] Document parameter formats and defaults
- [ ] Add examples for complex inputs
- [ ] Review for jargon and simplify

### Quality Checks
- [ ] Test with MCP Inspector
- [ ] Validate with actual AI model
- [ ] Review for consistency across components
- [ ] Check security considerations
- [ ] Ensure error cases are covered
- [ ] Verify descriptions match implementation

### Post-Implementation
- [ ] Document any special usage patterns
- [ ] Create example integrations
- [ ] Gather feedback from users
- [ ] Iterate based on AI model behavior

## Conclusion

Writing effective MCP server descriptions is both an art and a science. The key is to balance technical accuracy with clear communication, always keeping in mind that your primary audience is an AI model that needs to understand when and how to use your server's capabilities.

By following these best practices, you'll create MCP servers that:
- Are easily discoverable and understandable by AI models
- Provide safe and predictable functionality
- Scale well as your server grows
- Maintain consistency across all components

Remember that descriptions are often the first (and sometimes only) documentation that AI models see. Invest time in crafting them well, and you'll see the benefits in more accurate and appropriate usage of your MCP server.

### Key Takeaways

1. **Clarity trumps completeness** - Better to be clear about core functionality than exhaustive about edge cases
2. **Consistency is crucial** - Use the same patterns throughout your server
3. **Test with real AI models** - Descriptions that make sense to humans might confuse AI
4. **Security by design** - Build safety considerations into your descriptions
5. **Iterate based on usage** - Monitor how AI models use your tools and refine descriptions accordingly

The MCP ecosystem is rapidly evolving, and best practices will continue to develop. Stay engaged with the community, study successful implementations, and continuously refine your approach to create MCP servers that truly enhance AI capabilities.