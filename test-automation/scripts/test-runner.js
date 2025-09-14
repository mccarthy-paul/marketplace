#!/usr/bin/env node

import { TestAutomationAgent } from '../lib/TestAutomationAgent.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Juno Marketplace Test Automation       ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const agent = new TestAutomationAgent({
    parallel: options.parallel,
    headless: options.headless,
    coverage: options.coverage
  });

  try {
    await agent.initialize();

    let results;
    
    if (options.all) {
      results = await agent.runAllTests();
    } else if (options.suite) {
      results = await agent.runTestSuite(options.suite, options);
    } else {
      console.log('No test suite specified. Use --all or --suite=<name>');
      process.exit(1);
    }

    if (options.report) {
      await agent.generateReport();
    }

    await agent.cleanup();

    const success = Object.values(results).every(r => r.success !== false);
    
    if (success) {
      console.log('\n✨ All tests passed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function parseArgs(args) {
  const options = {
    all: false,
    suite: null,
    parallel: false,
    headless: true,
    coverage: false,
    report: false
  };

  for (const arg of args) {
    if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--suite=')) {
      options.suite = arg.split('=')[1];
    } else if (arg === '--parallel') {
      options.parallel = true;
    } else if (arg === '--headed') {
      options.headless = false;
    } else if (arg === '--coverage') {
      options.coverage = true;
    } else if (arg === '--report') {
      options.report = true;
    } else if (arg === '--help') {
      showHelp();
      process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: test-runner.js [options]

Options:
  --all              Run all test suites
  --suite=<name>     Run specific test suite (marketplace, admin, api, e2e, integration)
  --parallel         Run tests in parallel
  --headed           Run browser tests in headed mode (not headless)
  --coverage         Generate code coverage report
  --report           Generate test report after execution
  --help             Show this help message

Examples:
  test-runner.js --all
  test-runner.js --suite=marketplace --coverage
  test-runner.js --suite=e2e --headed
  `);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});