/**
 * Integration Test Runner
 *
 * Run this file to execute comprehensive integration tests for all Spezi modules
 */

import { integrationTester } from './integration.test';

async function main() {
  console.log('\n🔬 Spezi Module Integration Test Suite');
  console.log('=====================================\n');

  try {
    const results = await integrationTester.runAllTests();

    console.log(integrationTester.generateReport());

    // Exit with appropriate code
    if (results.failed > 0) {
      console.error(`\n❌ ${results.failed} test(s) failed`);
      process.exit(1);
    } else {
      console.log(`\n✅ All ${results.passed} tests passed!`);
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default main;
