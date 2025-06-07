#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

class AppleScriptTester {
  private results: TestResult[] = [];

  async runTest(name: string, script: string): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`\n🧪 Running test: ${name}`);
    console.log(`📝 Script: ${script.trim()}`);
    
    try {
      const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "\\'")}'`);
      const duration = Date.now() - startTime;
      
      if (stderr) {
        console.log(`⚠️  Warning: ${stderr}`);
      }
      
      console.log(`✅ Success (${duration}ms)`);
      console.log(`📤 Output: ${stdout.trim()}`);
      
      const result: TestResult = {
        name,
        success: true,
        output: stdout.trim(),
        duration
      };
      
      this.results.push(result);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.log(`❌ Failed (${duration}ms)`);
      console.log(`💥 Error: ${errorMessage}`);
      
      const result: TestResult = {
        name,
        success: false,
        error: errorMessage,
        duration
      };
      
      this.results.push(result);
      return result;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${this.results.reduce((sum, r) => sum + r.duration, 0)}ms`);
    
    if (failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
  }
}

async function main() {
  console.log('🚀 Starting AppleScript Debug Tests');
  
  const tester = new AppleScriptTester();

  // Test 1: Basic connectivity
  await tester.runTest(
    'Basic Things3 connectivity',
    'tell application "Things3" to get name'
  );

  // Test 2: Check if Things3 is running
  await tester.runTest(
    'Check Things3 running status', 
    'tell application "System Events" to (name of processes) contains "Things3"'
  );

  // Test 3: Simple string return
  await tester.runTest(
    'Simple string return',
    'return "Hello World"'
  );

  // Test 4: Simple variable assignment
  await tester.runTest(
    'Variable assignment',
    'set testVar to "test value"\nreturn testVar'
  );

  // Test 5: Simple record creation
  await tester.runTest(
    'Simple record creation',
    'set testRecord to {name:"test", value:123}\nreturn testRecord'
  );

  // Test 6: String concatenation
  await tester.runTest(
    'String concatenation',
    'set str1 to "Hello"\nset str2 to "World"\nreturn str1 & " " & str2'
  );

  // Test 7: JSON-like string building
  await tester.runTest(
    'JSON string building',
    'set name to "Test Item"\nset id to "123"\nreturn "{\\"name\\":\\"" & name & "\\",\\"id\\":\\"" & id & "\\"}"'
  );

  tester.printSummary();
}

// ES module check for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { AppleScriptTester };