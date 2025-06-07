#!/usr/bin/env node

import { AppleScriptTester } from './applescript-debug.js';

async function testProjectScripts() {
  console.log('📋 Testing Project-specific AppleScripts');
  
  const tester = new AppleScriptTester();

  // Test 1: Basic project count
  await tester.runTest(
    'Count all projects',
    'tell application "Things3" to return count of every project'
  );

  // Test 2: Get first project name only
  await tester.runTest(
    'Get first project name',
    `tell application "Things3"
      set projectList to every project
      if (count of projectList) > 0 then
        return name of item 1 of projectList
      else
        return "No projects found"
      end if
    end tell`
  );

  // Test 3: Simple project info
  await tester.runTest(
    'Simple project info',
    `tell application "Things3"
      set projectList to every project
      if (count of projectList) > 0 then
        set firstProject to item 1 of projectList
        set projName to name of firstProject
        set projId to id of firstProject
        set projStatus to status of firstProject as string
        
        return "ID: " & projId & ", Name: " & projName & ", Status: " & projStatus
      else
        return "No projects found"
      end if
    end tell`
  );

  // Test 4: Project with area information
  await tester.runTest(
    'Project with area info',
    `tell application "Things3"
      set projectList to every project
      if (count of projectList) > 0 then
        set firstProject to item 1 of projectList
        set projName to name of firstProject
        set projId to id of firstProject
        
        set projArea to ""
        try
          set projArea to name of area of firstProject
        on error
          set projArea to ""
        end try
        
        return "{\\"id\\":\\"" & projId & "\\",\\"name\\":\\"" & projName & "\\",\\"area\\":\\"" & projArea & "\\"}"
      else
        return "No projects found"
      end if
    end tell`
  );

  // Test 5: Complete project information (matches our fixed applescript)
  await tester.runTest(
    'Complete project info',
    `tell application "Things3"
      set projectList to every project
      if (count of projectList) > 0 then
        set proj to item 1 of projectList
        
        set projId to id of proj
        set projName to name of proj
        set projNotes to ""
        try
          set projNotes to notes of proj
        end try
        set projStatus to status of proj as string
        set projCreationDate to creation date of proj as string
        set projModificationDate to modification date of proj as string
        
        set projArea to ""
        try
          set projArea to name of area of proj
        end try
        
        set projDueDate to ""
        try
          set projDueDate to due date of proj as string
        end try
        
        set projCompletionDate to ""
        try
          set projCompletionDate to completion date of proj as string
        end try
        
        set projTags to ""
        try
          repeat with tag in (tags of proj)
            if projTags is "" then
              set projTags to name of tag
            else
              set projTags to projTags & "," & name of tag
            end if
          end repeat
        end try
        
        return "{\\"id\\":\\"" & projId & "\\",\\"name\\":\\"" & projName & "\\",\\"notes\\":\\"" & projNotes & "\\",\\"status\\":\\"" & projStatus & "\\",\\"area\\":\\"" & projArea & "\\",\\"dueDate\\":\\"" & projDueDate & "\\",\\"completionDate\\":\\"" & projCompletionDate & "\\",\\"tags\\":\\"" & projTags & "\\",\\"creationDate\\":\\"" & projCreationDate & "\\",\\"modificationDate\\":\\"" & projModificationDate & "\\"}"
      else
        return "No projects found"
      end if
    end tell`
  );

  // Test 6: Filter projects by status
  await tester.runTest(
    'Filter projects by open status',
    `tell application "Things3"
      set openProjects to every project whose status is open
      return "Found " & (count of openProjects) & " open projects"
    end tell`
  );

  // Test 7: Multiple projects with pipe delimiter
  await tester.runTest(
    'Multiple projects with delimiter',
    `tell application "Things3"
      set projectList to every project
      set projectData to ""
      set projectCount to count of projectList
      
      if projectCount > 0 then
        repeat with i from 1 to (if projectCount > 2 then 2 else projectCount)
          set proj to item i of projectList
          set projId to id of proj
          set projName to name of proj
          set projStatus to status of proj as string
          
          set projEntry to "{\\"id\\":\\"" & projId & "\\",\\"name\\":\\"" & projName & "\\",\\"status\\":\\"" & projStatus & "\\"}"
          
          if projectData is "" then
            set projectData to projEntry
          else
            set projectData to projectData & "|" & projEntry
          end if
        end repeat
      else
        set projectData to "No projects found"
      end if
      
      return projectData
    end tell`
  );

  // Test 8: Count areas and tags
  await tester.runTest(
    'Count areas',
    'tell application "Things3" to return count of every area'
  );

  await tester.runTest(
    'Count tags',
    'tell application "Things3" to return count of every tag'
  );

  tester.printSummary();
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testProjectScripts().catch(console.error);
}

export { testProjectScripts };