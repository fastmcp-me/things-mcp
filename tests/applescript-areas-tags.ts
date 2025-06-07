#!/usr/bin/env node

import { AppleScriptTester } from './applescript-debug.js';

async function testAreasAndTags() {
  console.log('🏷️ Testing Areas and Tags AppleScripts');
  
  const tester = new AppleScriptTester();

  // Test 1: Count areas
  await tester.runTest(
    'Count all areas',
    'tell application "Things3" to return count of every area'
  );

  // Test 2: Get first area name
  await tester.runTest(
    'Get first area name',
    `tell application "Things3"
      set areaList to every area
      if (count of areaList) > 0 then
        return name of item 1 of areaList
      else
        return "No areas found"
      end if
    end tell`
  );

  // Test 3: Simple area info
  await tester.runTest(
    'Simple area info',
    `tell application "Things3"
      set areaList to every area
      if (count of areaList) > 0 then
        set firstArea to item 1 of areaList
        set areaName to name of firstArea
        set areaId to id of firstArea
        return "ID: " & areaId & ", Name: " & areaName
      else
        return "No areas found"
      end if
    end tell`
  );

  // Test 4: Area with pipe format
  await tester.runTest(
    'Area with pipe format',
    `tell application "Things3"
      set areaList to every area
      if (count of areaList) > 0 then
        set firstArea to item 1 of areaList
        set areaId to id of firstArea
        set areaName to name of firstArea
        
        set areaTags to ""
        try
          set tagList to tags of firstArea
          repeat with i from 1 to count of tagList
            set tagName to name of item i of tagList
            if areaTags is "" then
              set areaTags to tagName
            else
              set areaTags to areaTags & "," & tagName
            end if
          end repeat
        end try
        
        return areaId & "|" & areaName & "|" & areaTags
      else
        return "No areas found"
      end if
    end tell`
  );

  // Test 5: Count tags
  await tester.runTest(
    'Count all tags',
    'tell application "Things3" to return count of every tag'
  );

  // Test 6: Get first tag name
  await tester.runTest(
    'Get first tag name',
    `tell application "Things3"
      set tagList to every tag
      if (count of tagList) > 0 then
        return name of item 1 of tagList
      else
        return "No tags found"
      end if
    end tell`
  );

  // Test 7: Simple tag info
  await tester.runTest(
    'Simple tag info',
    `tell application "Things3"
      set tagList to every tag
      if (count of tagList) > 0 then
        set firstTag to item 1 of tagList
        set tagName to name of firstTag
        set tagId to id of firstTag
        return "ID: " & tagId & ", Name: " & tagName
      else
        return "No tags found"
      end if
    end tell`
  );

  // Test 8: Tag with pipe format
  await tester.runTest(
    'Tag with pipe format',
    `tell application "Things3"
      set tagList to every tag
      if (count of tagList) > 0 then
        set firstTag to item 1 of tagList
        set tagId to id of firstTag
        set tagName to name of firstTag
        
        return tagId & "|" & tagName
      else
        return "No tags found"
      end if
    end tell`
  );

  // Test 9: Multiple areas with newline format
  await tester.runTest(
    'Multiple areas with newlines',
    `tell application "Things3"
      set areaList to every area
      set areaData to ""
      set areaCount to count of areaList
      
      if areaCount > 0 then
        set maxCount to 3
        if areaCount < maxCount then set maxCount to areaCount
        
        repeat with i from 1 to maxCount
          set area to item i of areaList
          set areaId to id of area
          set areaName to name of area
          
          set areaTags to ""
          try
            set tagList to tags of area
            repeat with j from 1 to count of tagList
              set tagName to name of item j of tagList
              if areaTags is "" then
                set areaTags to tagName
              else
                set areaTags to areaTags & "," & tagName
              end if
            end repeat
          end try
          
          set areaEntry to areaId & "|" & areaName & "|" & areaTags
          
          if areaData is "" then
            set areaData to areaEntry
          else
            set areaData to areaData & "\n" & areaEntry
          end if
        end repeat
      else
        set areaData to "No areas found"
      end if
      
      return areaData
    end tell`
  );

  // Test 10: Multiple tags with newline format
  await tester.runTest(
    'Multiple tags with newlines',
    `tell application "Things3"
      set tagList to every tag
      set tagData to ""
      set tagCount to count of tagList
      
      if tagCount > 0 then
        set maxCount to 5
        if tagCount < maxCount then set maxCount to tagCount
        
        repeat with i from 1 to maxCount
          set tag to item i of tagList
          set tagId to id of tag
          set tagName to name of tag
          
          set tagEntry to tagId & "|" & tagName
          
          if tagData is "" then
            set tagData to tagEntry
          else
            set tagData to tagData & "\n" & tagEntry
          end if
        end repeat
      else
        set tagData to "No tags found"
      end if
      
      return tagData
    end tell`
  );

  tester.printSummary();
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testAreasAndTags().catch(console.error);
}

export { testAreasAndTags };