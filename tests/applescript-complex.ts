#!/usr/bin/env node

import { AppleScriptTester } from './applescript-debug.js';

async function testComplexScripts() {
  console.log('🔬 Testing Complex Todo Data Extraction');
  
  const tester = new AppleScriptTester();

  // Test 1: Todo with project information
  await tester.runTest(
    'Todo with project info',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        
        set todoProject to ""
        try
          set todoProject to name of project of firstTodo
        on error
          set todoProject to ""
        end try
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"project\\":\\"" & todoProject & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 2: Todo with area information
  await tester.runTest(
    'Todo with area info',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        
        set todoArea to ""
        try
          set todoArea to name of area of firstTodo
        on error
          set todoArea to ""
        end try
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"area\\":\\"" & todoArea & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 3: Todo with date information
  await tester.runTest(
    'Todo with dates',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        
        set creationDate to creation date of firstTodo as string
        set modificationDate to modification date of firstTodo as string
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"created\\":\\"" & creationDate & "\\",\\"modified\\":\\"" & modificationDate & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 4: Todo with tags (single tag test)
  await tester.runTest(
    'Todo tags test',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set firstTodo to item 1 of todoList
        set todoName to name of firstTodo
        set todoId to id of firstTodo
        
        set todoTags to ""
        try
          set tagList to tags of firstTodo
          set tagCount to count of tagList
          
          if tagCount > 0 then
            repeat with i from 1 to tagCount
              set tagName to name of item i of tagList
              if todoTags is "" then
                set todoTags to tagName
              else
                set todoTags to todoTags & "," & tagName
              end if
            end repeat
          end if
        on error
          set todoTags to ""
        end try
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"tags\\":\\"" & todoTags & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 5: Complete todo information (matches our fixed applescript)
  await tester.runTest(
    'Complete todo info',
    `tell application "Things3"
      set todoList to every to do
      if (count of todoList) > 0 then
        set todo to item 1 of todoList
        
        set todoId to id of todo
        set todoName to name of todo
        set todoNotes to ""
        try
          set todoNotes to notes of todo
        end try
        set todoStatus to status of todo as string
        set todoCreationDate to creation date of todo as string
        set todoModificationDate to modification date of todo as string
        
        set todoProject to ""
        try
          set todoProject to name of project of todo
        end try
        
        set todoArea to ""
        try
          set todoArea to name of area of todo
        end try
        
        set todoDueDate to ""
        try
          set todoDueDate to due date of todo as string
        end try
        
        set todoCompletionDate to ""
        try
          set todoCompletionDate to completion date of todo as string
        end try
        
        set todoTags to ""
        try
          set tagList to tags of todo
          repeat with i from 1 to count of tagList
            set tagName to name of item i of tagList
            if todoTags is "" then
              set todoTags to tagName
            else
              set todoTags to todoTags & "," & tagName
            end if
          end repeat
        end try
        
        return "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"notes\\":\\"" & todoNotes & "\\",\\"status\\":\\"" & todoStatus & "\\",\\"project\\":\\"" & todoProject & "\\",\\"area\\":\\"" & todoArea & "\\",\\"dueDate\\":\\"" & todoDueDate & "\\",\\"completionDate\\":\\"" & todoCompletionDate & "\\",\\"tags\\":\\"" & todoTags & "\\",\\"creationDate\\":\\"" & todoCreationDate & "\\",\\"modificationDate\\":\\"" & todoModificationDate & "\\"}"
      else
        return "No todos found"
      end if
    end tell`
  );

  // Test 6: Multiple todos with pipe delimiter
  await tester.runTest(
    'Multiple todos with delimiter',
    `tell application "Things3"
      set todoList to every to do
      set todoData to ""
      set todoCount to count of todoList
      
      if todoCount > 0 then
        set maxCount to 2
        if todoCount < maxCount then set maxCount to todoCount
        repeat with i from 1 to maxCount
          set todo to item i of todoList
          set todoId to id of todo
          set todoName to name of todo
          set todoStatus to status of todo as string
          
          set todoEntry to "{\\"id\\":\\"" & todoId & "\\",\\"name\\":\\"" & todoName & "\\",\\"status\\":\\"" & todoStatus & "\\"}"
          
          if todoData is "" then
            set todoData to todoEntry
          else
            set todoData to todoData & "|" & todoEntry
          end if
        end repeat
      else
        set todoData to "No todos found"
      end if
      
      return todoData
    end tell`
  );

  tester.printSummary();
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testComplexScripts().catch(console.error);
}

export { testComplexScripts };