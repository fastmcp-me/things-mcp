# AppleScript Testing Suite

This directory contains independent test scripts to debug and validate AppleScript functionality with Things.app.

## Test Structure

### 1. Basic Tests (`applescript-debug.ts`)
- Things3 connectivity
- Basic AppleScript functionality
- String manipulation
- JSON building

### 2. Todo Tests (`applescript-todos.ts`)
- Simple todo listing
- Todo counting
- Basic todo information extraction
- Status filtering

### 3. Complex Tests (`applescript-complex.ts`)
- Complete todo data extraction
- Project/area relationships
- Tag handling
- Date information
- Multiple todos with delimiters

### 4. Project Tests (`applescript-projects.ts`)
- Project listing and counting
- Project information extraction
- Area relationships
- Status filtering

## Running Tests

```bash
# Run all tests
npm run test:applescript

# Run specific test categories
npm run test:applescript:basic      # Basic connectivity tests
npm run test:applescript:todos      # Todo-specific tests
npm run test:applescript:projects   # Project-specific tests
npm run test:applescript:complex    # Complex data extraction tests

# Get help
npm run test:applescript -- --help
```

## Test Output

Each test shows:
- ✅ Success/❌ Failure status
- ⏱️ Execution time
- 📤 AppleScript output
- 💥 Error messages (if any)
- 📊 Summary statistics

## Prerequisites

- macOS (AppleScript only works on macOS)
- Things.app installed and running
- Proper permissions for automation (System Preferences → Security & Privacy → Privacy → Automation)

## Debugging Tips

1. **Start Small**: Run basic tests first to ensure connectivity
2. **Incremental Testing**: Add complexity gradually
3. **Check Permissions**: Ensure automation permissions are granted
4. **Things3 Running**: Make sure Things.app is running before tests
5. **Error Analysis**: Check error messages for syntax issues

## Common Issues

- **Permission Denied**: Grant automation permissions in System Preferences
- **App Not Found**: Ensure Things.app is installed in Applications folder
- **Syntax Errors**: Check AppleScript syntax in individual test cases
- **Empty Results**: Ensure you have todos/projects in Things.app for testing

## Test Development

When adding new tests:
1. Start with the simplest possible script
2. Test incrementally
3. Handle errors gracefully with try/catch blocks
4. Use consistent JSON formatting for data extraction
5. Add appropriate error logging