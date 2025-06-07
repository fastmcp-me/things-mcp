#!/usr/bin/env node

import { AppleScriptTester } from './applescript-debug.js';

async function testTodoScripts() {
  console.log('🔍 Testing Todo-specific AppleScripts');
  
  const tester = new AppleScriptTester();

  // Test 1: Basic todo count
  await tester.runTest(
    'Count all todos',
    'tell application "Things3" to return count of every to do'
  );

  // Test 2: Get first todo name only
  await tester.runTest(
    'Get first todo name',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        return name of item 1 of todoList
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 3: Get first todo ID
  await tester.runTest(
    'Get first todo ID',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        return id of item 1 of todoList
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 4: Simple todo info extraction
  await tester.runTest(
    'Simple todo info',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        return "ID: " & todoId & ", Name: " & todoName
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 5: Multiple todos with simple format
  await tester.runTest(
    'Multiple todos simple format',
    `tell application "Things3"
      set todoList to every to do
      set todoData to ""
      set todoCount to count of todoList
      
      if todoCount > 0 then
        set maxCount to 3
        if todoCount < maxCount then set maxCount to todoCount
        
        repeat with i from 1 to maxCount
          set currentTodo to item i of todoList
          set todoName to name of currentTodo
          set todoId to id of currentTodo
          
          if todoData is "" then
            set todoData to todoId & ":" & todoName
          else
            set todoData to todoData & "|" & todoId & ":" & todoName
          end if
        end repeat
      else
        set todoData to "No todos found"
      end if
      
      return todoData
    end tell`
  );

  // Test 6: Single todo with JSON-like format
  await tester.runTest(
    'Single todo JSON format',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        set todoStatus to status of firstTodo as string
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"status\\":\\"" & todoStatus & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 7: Try to get notes safely
  await tester.runTest(
    'Todo with notes handling',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        
        set todoNotes to ""
        try
          set todoNotes to notes of firstTodo
        on error
          set todoNotes to ""
        end try
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"notes\\":\\"" & todoNotes & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 8: Filter by status
  await tester.runTest(
    'Filter todos by open status',
    `tell application "Things3"
      set openTodos to every to do whose status is open
      return "Found " & (count of openTodos) & " open todos"
    end tell`
  );

  tester.printSummary();
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testTodoScripts().catch(console.error);
}

export { testTodoScripts };