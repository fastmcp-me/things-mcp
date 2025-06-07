You are instructed to perform the following tasks.

1. Remove useless tools, including `json_import`, `search` and `show`.
2. Fix the space rendering. For now, using space in field (e.g. 'New Task' title in add_todo) will show as 'New+Task'. The space should be rendered as space.
3. Implement some new tools to help LLM view information from the Things.app database.
    - `list_todos` to list all tasks (not done by default) in the database. Options can filter tasks by type, project, area, status, date, tags, etc.
    - `list_project`, `list_tags`, `list_areas`, in the same way.
    - `remove_todo` and `remove_project`.
    - To do this, the URL scheme may be not enough. Please first visit the apple script documentation to first design all apple script functions if needed. https://culturedcode.com/things/download/Things3AppleScriptGuide.pdf
4. Optimize the prompt design to make LLM easier to find proper tools and use them. You perform the optimization according to @reference/prompt-guideline.md


After each task, you should make a proper commit and update CLAUDE.md if necessary.