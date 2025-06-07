#!/usr/bin/env node

import { testTodoScripts } from './applescript-todos.js';
import { testComplexScripts } from './applescript-complex.js';
import { testProjectScripts } from './applescript-projects.js';
import { AppleScriptTester } from './applescript-debug.js';

async function runAllTests() {
  console.log('🚀 Starting Comprehensive AppleScript Test Suite');
  console.log('='.repeat(60));
  
  // Check if we're on macOS
  if (process.platform !== 'darwin') {
    console.log('❌ These tests can only run on macOS');
    process.exit(1);
  }

  // Check if Things3 is available
  const tester = new AppleScriptTester();
  console.log('🔍 Checking Things3 availability...');
  
  try {
    await tester.runTest(
      'Things3 availability check',
      'tell application "Things3" to get version'
    );
    console.log('✅ Things3 is available');
  } catch (error) {
    console.log('❌ Things3 is not available or not installed');
    console.log('Please ensure Things.app is installed and running');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  
  try {
    // Run basic connectivity tests first
    console.log('📋 Phase 1: Basic AppleScript Tests');
    const basicTester = new AppleScriptTester();
    
    await basicTester.runTest(
      'Basic string return',
      'return "Test successful"'
    );
    
    await basicTester.runTest(
      'Things3 name',
      'tell application "Things3" to get name'
    );
    
    await basicTester.runTest(
      'Things3 version',
      'tell application "Things3" to get version'
    );
    
    basicTester.printSummary();
    
    // Run todo tests
    console.log('\n' + '='.repeat(60));
    console.log('📋 Phase 2: Todo Tests');
    await testTodoScripts();
    
    // Run complex tests
    console.log('\n' + '='.repeat(60));
    console.log('📋 Phase 3: Complex Data Extraction Tests');
    await testComplexScripts();
    
    // Run project tests
    console.log('\n' + '='.repeat(60));
    console.log('📋 Phase 4: Project Tests');
    await testProjectScripts();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All test phases completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Add command line options
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AppleScript Test Runner for Things MCP

Usage: npm run test:applescript [options]

Options:
  --help, -h     Show this help message
  --todos        Run only todo tests
  --projects     Run only project tests
  --complex      Run only complex data extraction tests
  --basic        Run only basic connectivity tests

Examples:
  npm run test:applescript              # Run all tests
  npm run test:applescript -- --todos   # Run only todo tests
  npm run test:applescript -- --basic   # Run only basic tests
  `);
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--basic')) {
    const tester = new AppleScriptTester();
    await tester.runTest('Basic test', 'return "Hello World"');
    await tester.runTest('Things3 test', 'tell application "Things3" to get name');
    tester.printSummary();
  } else if (args.includes('--todos')) {
    await testTodoScripts();
  } else if (args.includes('--projects')) {
    await testProjectScripts();
  } else if (args.includes('--complex')) {
    await testComplexScripts();
  } else {
    await runAllTests();
  }
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}