# Troubleshooting

Common issues and solutions for the Things MCP Server.

## Installation Issues

### npm Package Not Found

**Problem**: `npm: package '@wenbopan/things-mcp' not found`

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Use full package name
npx @wenbopan/things-mcp

# Check npm registry
npm config get registry
npm config set registry https://registry.npmjs.org/
```

### Permission Errors

**Problem**: Permission denied when installing globally

**Solutions**:
```bash
# Use npx instead of global install
npx @wenbopan/things-mcp

# Or fix npm permissions (macOS)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use node version manager
brew install nvm
nvm install node
```

## Configuration Issues

### MCP Server Not Loading

**Problem**: AI assistant doesn't recognize the MCP server

**Solutions**:

1. **Check configuration file location**:
   ```bash
   # Claude Desktop
   ls ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Cursor IDE
   ls ~/.cursor/mcp.json
   ls .cursor/mcp.json
   ```

2. **Validate JSON syntax**:
   ```bash
   # Check for JSON errors
   cat ~/.config/claude/config.json | jq .
   ```

3. **Verify configuration format**:
   ```json
   {
     "mcpServers": {
       "things": {
         "command": "npx",
         "args": ["@wenbopan/things-mcp"],
         "env": {
           "THINGS_AUTH_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

4. **Restart AI assistant completely**:
   - Quit application entirely
   - Wait 5 seconds
   - Restart application

### Authorization Token Issues

**Problem**: "THINGS_AUTH_TOKEN required" error

**Solutions**:

1. **Enable Things URLs**:
   - Open Things.app
   - Go to **Things → Preferences → General**
   - Check **"Enable Things URLs"**
   - Copy the authorization token

2. **Set token in configuration**:
   ```json
   {
     "env": {
       "THINGS_AUTH_TOKEN": "your-actual-token-here"
     }
   }
   ```

3. **Verify token format**:
   - Token should be a long alphanumeric string
   - No spaces or special characters
   - Generated fresh from Things.app preferences

## Runtime Issues

### "Things.app not found" Error

**Problem**: Cannot locate Things.app on system

**Solutions**:

1. **Install Things.app**:
   ```bash
   # Check if Things is installed
   ls /Applications/Things3.app
   
   # Download from Mac App Store if missing
   open "macappstore://apps.apple.com/app/things-3/id904280696"
   ```

2. **Launch Things.app at least once**:
   - Open Things.app manually
   - Allow it to create database
   - Close and try MCP operation again

### Database Access Errors

**Problem**: "Things database not found" or permission errors

**Solutions**:

1. **Check database location**:
   ```bash
   # Find Things database
   find ~/Library/Group\ Containers -name "*ThingsMac*" -type d 2>/dev/null
   ```

2. **Ensure Things.app has run**:
   - Launch Things.app
   - Create at least one task
   - Quit Things.app
   - Try MCP operation

3. **Check permissions**:
   ```bash
   # Terminal needs Full Disk Access for database reading
   # System Preferences → Security & Privacy → Privacy → Full Disk Access
   # Add Terminal.app or your AI assistant
   ```

### Platform Compatibility

**Problem**: "macOS required" error on non-Mac systems

**Explanation**: Things.app is macOS-only, so the MCP server only functions on macOS.

**Workarounds**:
- Use macOS virtual machine
- Use remote macOS development environment
- Consider alternative task management MCP servers

## Tool-Specific Issues

### Task Creation Fails

**Problem**: Tasks not appearing in Things.app

**Debugging Steps**:

1. **Test URL scheme manually**:
   ```bash
   open "things:///add?title=Test%20Task"
   ```

2. **Check Things.app is responding**:
   - Ensure Things.app is running
   - Try creating task manually in Things.app
   - Check for system dialog requesting permissions

3. **Verify parameters**:
   ```typescript
   // Valid date formats
   "when": "today"           // ✓ Valid
   "when": "2024-01-15"      // ✓ Valid
   "when": "next week"       // ✗ Invalid
   
   // Valid deadline format
   "deadline": "2024-01-15"  // ✓ Valid
   "deadline": "tomorrow"    // ✗ Invalid
   ```

### Update Operations Fail

**Problem**: Cannot update existing tasks

**Debugging Steps**:

1. **Verify authorization token**:
   ```bash
   echo $THINGS_AUTH_TOKEN
   ```

2. **Check task ID format**:
   ```typescript
   // Valid UUID format
   "id": "A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
   ```

3. **Test with things_summary first**:
   ```typescript
   // Get valid task IDs
   {
     "format": "json"
   }
   ```

### Summary Tool Issues

**Problem**: Empty or incomplete summaries

**Debugging Steps**:

1. **Check database permissions**:
   ```bash
   # Test SQLite access
   find ~/Library/Group\ Containers -name "main.sqlite" -exec sqlite3 {} "SELECT COUNT(*) FROM TMTask;" \;
   ```

2. **Verify Things data exists**:
   - Open Things.app
   - Confirm tasks and projects exist
   - Check that items aren't all completed

3. **Test with different filters**:
   ```typescript
   // Include completed items
   {
     "includeCompleted": true,
     "format": "json"
   }
   ```

## AI Assistant Integration Issues

### Claude Desktop

**Problem**: MCP tools not appearing

**Solutions**:
1. Check config file location: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Ensure JSON is valid
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

### Cursor IDE

**Problem**: MCP server not connecting

**Solutions**:
1. Create `.cursor/mcp.json` in project root or globally
2. Verify Cursor has MCP support enabled
3. Check Cursor console for connection errors
4. Try reloading Cursor window

## Performance Issues

### Slow Summary Generation

**Problem**: Summary takes too long to generate

**Solutions**:

1. **Filter data**:
   ```typescript
   {
     "areas": ["Work"],           // Limit to specific areas
     "includeCompleted": false    // Exclude completed items
   }
   ```

2. **Use JSON format for large datasets**:
   ```typescript
   {
     "format": "json"  // Faster than markdown formatting
   }
   ```

3. **Check database size**:
   ```bash
   # Find large Things databases
   find ~/Library/Group\ Containers -name "main.sqlite" -exec du -h {} \;
   ```

### Memory Usage

**Problem**: High memory consumption

**Solutions**:
- Restart MCP server periodically
- Use filtered queries instead of full exports
- Monitor Node.js process memory usage

## Development Issues

### Build Errors

**Problem**: TypeScript compilation fails

**Solutions**:
```bash
# Clean build
rm -rf build/
npm run build

# Check TypeScript version
npx tsc --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Test Failures

**Problem**: Tests failing on macOS

**Solutions**:
```bash
# Run specific test
npm test -- --testNamePattern="URL Builder"

# Check Things.app installation
ls /Applications/Things3.app

# Verify test database access
npm test -- tests/integration.test.ts --verbose
```

### ES Module Issues

**Problem**: Import/export errors

**Solutions**:
```typescript
// Use .js extensions for TypeScript imports
import { tool } from './utils/tool.js';  // ✓ Correct
import { tool } from './utils/tool';     // ✗ Wrong

// Check package.json
"type": "module"  // Required for ES modules
```

## Getting Additional Help

### Debug Mode

Enable verbose logging:
```bash
export LOG_LEVEL=debug
npx @wenbopan/things-mcp
```

### System Information

Collect system info for bug reports:
```bash
# System details
sw_vers
node --version
npm --version

# Things.app version
system_profiler SPApplicationsDataType | grep -A 3 "Things"

# Database location
find ~/Library/Group\ Containers -name "*ThingsMac*" 2>/dev/null
```

### Reporting Issues

When reporting issues, include:

1. **System Information**:
   - macOS version
   - Node.js version
   - Things.app version
   - AI assistant type and version

2. **Configuration**:
   - MCP configuration (remove sensitive tokens)
   - Environment variables
   - Installation method

3. **Error Details**:
   - Complete error message
   - Steps to reproduce
   - Expected vs actual behavior

4. **Debug Output**:
   - Enable debug logging
   - Include relevant log entries
   - Sanitize personal information

### Support Channels

- **GitHub Issues**: [https://github.com/BMPixel/things-mcp/issues](https://github.com/BMPixel/things-mcp/issues)
- **Documentation**: [https://github.com/BMPixel/things-mcp/docs](https://github.com/BMPixel/things-mcp/docs)
- **MCP Community**: Model Context Protocol community resources

### Emergency Recovery

If the MCP server becomes completely unresponsive:

1. **Remove from AI assistant configuration**
2. **Restart AI assistant**
3. **Clear npm cache**: `npm cache clean --force`
4. **Reinstall**: `npm uninstall -g @wenbopan/things-mcp && npx @wenbopan/things-mcp`
5. **Reconfigure with minimal settings**