#!/usr/bin/env node

import { listAreas, listTags } from '../src/utils/applescript.js';

async function testAreasTagsFunctions() {
  console.log('🔍 Testing listAreas and listTags functions directly...');
  
  try {
    console.log('\n📋 Testing listAreas...');
    const areas = await listAreas();
    console.log(`✅ Success: Found ${areas.length} areas`);
    
    if (areas.length > 0) {
      console.log('📋 First area:', JSON.stringify(areas[0], null, 2));
    }
    
    console.log('\n🏷️ Testing listTags...');
    const tags = await listTags();
    console.log(`✅ Success: Found ${tags.length} tags`);
    
    if (tags.length > 0) {
      console.log('🏷️ First tag:', JSON.stringify(tags[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testAreasTagsFunctions().catch(console.error);
}