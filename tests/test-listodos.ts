#!/usr/bin/env node

import { listTodos } from '../src/utils/applescript.js';

async function testListTodos() {
  console.log('🔍 Testing listTodos function directly...');
  
  try {
    console.log('📋 Listing all todos...');
    const allTodos = await listTodos();
    console.log(`✅ Success: Found ${allTodos.length} todos`);
    
    if (allTodos.length > 0) {
      console.log('📋 First todo:', JSON.stringify(allTodos[0], null, 2));
    }
    
    console.log('\n📋 Listing open todos...');
    const openTodos = await listTodos({ status: 'open' });
    console.log(`✅ Success: Found ${openTodos.length} open todos`);
    
    if (openTodos.length > 0) {
      console.log('📋 First open todo:', JSON.stringify(openTodos[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testListTodos().catch(console.error);
}