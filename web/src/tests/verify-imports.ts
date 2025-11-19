/**
 * Import Verification Script
 *
 * Verifies all Spezi module services can be imported without errors
 */

// Setup environment before importing modules
import './setup-env';

console.log('🔍 Verifying all Spezi module imports...\n');

const imports: Array<{ name: string; status: 'success' | 'failed'; error?: string }> = [];

// Helper function to test import
async function testImport(modulePath: string, name: string) {
  try {
    await import(modulePath);
    imports.push({ name, status: 'success' });
    console.log(`✓ ${name}`);
  } catch (error) {
    imports.push({ name, status: 'failed', error: (error as Error).message });
    console.log(`✗ ${name}:`, (error as Error).message);
  }
}

// Test all imports
await testImport('../services/intellicKit', 'IntellicKit');
await testImport('../services/accessGuard', 'AccessGuard');
await testImport('../services/networking', 'Networking');
await testImport('../services/devices', 'Devices');
await testImport('../services/bluetooth', 'Bluetooth');
await testImport('../services/location', 'Location');
await testImport('../services/sensorKit', 'SensorKit');
await testImport('../services/chat', 'Chat');
await testImport('../services/medication', 'Medication');
await testImport('../services/speech', 'Speech');
await testImport('../services/fhirAdapters', 'FHIR Adapters');
await testImport('../services/study', 'Study');
await testImport('../services/llm', 'LLM');
await testImport('../services/dataPipeline', 'DataPipeline');

// Check existing services
await testImport('../services/firebase', 'Firebase');
await testImport('../services/scheduler', 'Scheduler');
await testImport('../services/notification', 'Notification');
await testImport('../services/storage', 'Storage');

// Summary
const successful = imports.filter((i) => i.status === 'success').length;
const failed = imports.filter((i) => i.status === 'failed').length;

console.log('\n' + '='.repeat(50));
console.log(`Import Verification Summary:`);
console.log(`Total: ${imports.length}`);
console.log(`Successful: ${successful} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ Some imports failed. Please check the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ All imports successful!');
  process.exit(0);
}
