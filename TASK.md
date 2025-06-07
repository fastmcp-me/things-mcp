You are instructed to perform the following tasks.

1. Rewrite the README for a more user oriented readme. Do not going to implementation details and give information on functionality, use case, and installation
    - Research online to find out how to install this on Claude Code Desktop, cursor, or other mainstream IDEs (consider mithstry)
    - Make sure to include a section on how to get the auth token for the Things app.
    - List some use cases for this tool.

2. Add a LICENCE file
3. Update the summary tool to remove emoji and last line of generated xxx. And use direct description of the tool instead of mention potential history changes (e.g. it replaces individual list tools and provides a complete overview of tasks, projects, areas, and tags)
4. Make all description more straightforward. remove "Requires THINGS_AUTH_TOKEN" remove adjs like "comprehensive" be straightforward clear, and direct.
5. Reorganize the tests/ to remove temporary test and only keep the essentials for testing the core functionality. Stop tests from running in an linux environment.
6. Add more comprehensive tests that tries add/update/cancel/complete/move todo and project. First check if the URL scheme is on. If not, skip the test.


After each task, you should make a proper commit and update CLAUDE.md if necessary.