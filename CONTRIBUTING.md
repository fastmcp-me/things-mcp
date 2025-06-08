# Contributing to Things MCP

Thank you for your interest in contributing to the Things MCP server! This guide will help you get started.

## Development Setup

### Prerequisites
- **macOS** (Things.app requirement)
- **Node.js** 20 or higher
- **Things.app** installed and running

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/things-mcp.git
cd things-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development Commands

```bash
npm run build          # Compile TypeScript
npm run dev            # Watch mode for development
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm start             # Run the MCP server
```

## Contributing Guidelines

### Code Style
- Follow existing TypeScript conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Ensure proper error handling

### Testing
- Write tests for new features
- Ensure all tests pass before submitting
- Test on macOS with Things.app installed
- Include integration tests for MCP tools

### Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** with clear messages
6. **Push** to your fork
7. **Submit** a pull request

### Commit Messages
Use clear, descriptive commit messages:
```
Add support for recurring tasks

- Implement recurring task creation in add_todo tool
- Add recurrence parameter to Zod schema
- Update URL builder to handle recurrence patterns
- Add tests for recurring task functionality
```

## Architecture Overview

This MCP server uses:
- **URL Scheme**: For creating and updating Things items
- **AppleScript**: For reading Things database
- **SQLite Access**: For comprehensive data summaries
- **Zod Validation**: For parameter validation

Key files:
- `src/tools/`: MCP tool implementations
- `src/utils/`: Utility functions (URL building, auth, etc.)
- `src/types/`: TypeScript type definitions
- `tests/`: Test suites

## Publishing and Version Management

### Publishing Workflow

#### 1. Prepare for Release

```bash
# Ensure working directory is clean
git status

# Run tests to ensure everything works
npm test

# Build the project
npm run build
```

#### 2. Update Version Number

Use semantic versioning (MAJOR.MINOR.PATCH):
- **PATCH** (1.0.1): Bug fixes, small changes
- **MINOR** (1.1.0): New features, backward compatible
- **MAJOR** (2.0.0): Breaking changes

```bash
# Automatically bump version and create git tag
npm version patch    # For bug fixes (1.0.0 → 1.0.1)
npm version minor    # For new features (1.0.0 → 1.1.0)
npm version major    # For breaking changes (1.0.0 → 2.0.0)
```

This command:
- Updates `package.json` version
- Creates a git commit with the version change
- Creates a git tag (e.g., `v1.0.1`)

#### 3. Update Changelog (Optional but Recommended)

If you have a `CHANGES.md` file, update it with the new version:

```bash
# Edit CHANGES.md to document changes
# Then commit the update
git add CHANGES.md
git commit -m "Update changelog for v1.0.1"
```

#### 4. Publish to npm

```bash
# Publish the package
npm publish --access public

# If you have 2FA enabled, include OTP
npm publish --access public --otp=123456
```

#### 5. Push Changes to GitHub

```bash
# Push commits and tags to remote repository
git push origin main
git push origin --tags
```

### Quick Reference Commands

#### Complete Release Process

```bash
# 1. Ensure clean state
git status
npm test
npm run build

# 2. Version bump (choose one)
npm version patch   # Bug fixes
npm version minor   # New features  
npm version major   # Breaking changes

# 3. Publish
npm publish --access public

# 4. Push to GitHub
git push origin main --follow-tags
```

#### Emergency Patch

For urgent fixes:

```bash
# Quick patch without extensive testing (use cautiously)
npm version patch
npm publish --access public
git push origin main --follow-tags
```

### Version History Tracking

#### Git Tags
View all published versions:
```bash
git tag -l
```

#### npm Versions
Check published versions on npm:
```bash
npm view @wenbopan/things-mcp versions --json
```

### Rollback Procedures

#### Unpublish (within 24 hours)
```bash
# Only works within 24 hours of publishing
npm unpublish @wenbopan/things-mcp@1.0.1
```

#### Deprecate Version
```bash
# Mark version as deprecated (recommended over unpublishing)
npm deprecate @wenbopan/things-mcp@1.0.1 "This version has critical bugs, please upgrade"
```

### Pre-release Versions

For testing before official release:

```bash
# Create pre-release version
npm version prerelease --preid=beta  # 1.0.1-beta.0
npm publish --tag beta --access public

# Install pre-release
npm install -g @wenbopan/things-mcp@beta
```

### Automation Considerations

#### GitHub Actions (Future)
Consider setting up automated publishing:
- Trigger on git tag push
- Run tests automatically
- Publish to npm on success
- Create GitHub releases

#### Package.json Scripts
Add helpful scripts to `package.json`:

```json
{
  "scripts": {
    "release:patch": "npm version patch && npm publish --access public && git push --follow-tags",
    "release:minor": "npm version minor && npm publish --access public && git push --follow-tags",
    "release:major": "npm version major && npm publish --access public && git push --follow-tags"
  }
}
```

### Security Notes

- Always use 2FA for npm account
- Keep auth tokens secure
- Review changes before publishing
- Test in development environment first
- Consider using `npm pack` to inspect package contents before publishing

### Common Issues

#### Authentication
```bash
npm login     # Re-authenticate if needed
npm whoami    # Verify logged in user
```

#### Package Name Conflicts
- Use scoped packages: `@username/package-name`
- Ensure unique naming for public packages

#### Build Issues
```bash
# Clean build
rm -rf build node_modules
npm install
npm run build
```

## Getting Help

- **Issues**: Report bugs or request features via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check README.md for usage instructions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.