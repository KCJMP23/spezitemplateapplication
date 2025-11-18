/**
 * Import Verification Script
 *
 * Verifies all Spezi module services can be imported without errors
 */

console.log('🔍 Verifying all Spezi module imports...\n');

const imports: Array<{ name: string; status: 'success' | 'failed'; error?: string }> = [];

// Test each import
try {
  require('../services/speziKit');
  imports.push({ name: 'SpeziKit', status: 'success' });
  console.log('✓ SpeziKit');
} catch (error) {
  imports.push({ name: 'SpeziKit', status: 'failed', error: (error as Error).message });
  console.log('✗ SpeziKit:', (error as Error).message);
}

try {
  require('../services/accessGuard');
  imports.push({ name: 'AccessGuard', status: 'success' });
  console.log('✓ AccessGuard');
} catch (error) {
  imports.push({ name: 'AccessGuard', status: 'failed', error: (error as Error).message });
  console.log('✗ AccessGuard:', (error as Error).message);
}

try {
  require('../services/networking');
  imports.push({ name: 'Networking', status: 'success' });
  console.log('✓ Networking');
} catch (error) {
  imports.push({ name: 'Networking', status: 'failed', error: (error as Error).message });
  console.log('✗ Networking:', (error as Error).message);
}

try {
  require('../services/devices');
  imports.push({ name: 'Devices', status: 'success' });
  console.log('✓ Devices');
} catch (error) {
  imports.push({ name: 'Devices', status: 'failed', error: (error as Error).message });
  console.log('✗ Devices:', (error as Error).message);
}

try {
  require('../services/bluetooth');
  imports.push({ name: 'Bluetooth', status: 'success' });
  console.log('✓ Bluetooth');
} catch (error) {
  imports.push({ name: 'Bluetooth', status: 'failed', error: (error as Error).message });
  console.log('✗ Bluetooth:', (error as Error).message);
}

try {
  require('../services/location');
  imports.push({ name: 'Location', status: 'success' });
  console.log('✓ Location');
} catch (error) {
  imports.push({ name: 'Location', status: 'failed', error: (error as Error).message });
  console.log('✗ Location:', (error as Error).message);
}

try {
  require('../services/sensorKit');
  imports.push({ name: 'SensorKit', status: 'success' });
  console.log('✓ SensorKit');
} catch (error) {
  imports.push({ name: 'SensorKit', status: 'failed', error: (error as Error).message });
  console.log('✗ SensorKit:', (error as Error).message);
}

try {
  require('../services/chat');
  imports.push({ name: 'Chat', status: 'success' });
  console.log('✓ Chat');
} catch (error) {
  imports.push({ name: 'Chat', status: 'failed', error: (error as Error).message });
  console.log('✗ Chat:', (error as Error).message);
}

try {
  require('../services/medication');
  imports.push({ name: 'Medication', status: 'success' });
  console.log('✓ Medication');
} catch (error) {
  imports.push({ name: 'Medication', status: 'failed', error: (error as Error).message });
  console.log('✗ Medication:', (error as Error).message);
}

try {
  require('../services/speech');
  imports.push({ name: 'Speech', status: 'success' });
  console.log('✓ Speech');
} catch (error) {
  imports.push({ name: 'Speech', status: 'failed', error: (error as Error).message });
  console.log('✗ Speech:', (error as Error).message);
}

try {
  require('../services/fhirAdapters');
  imports.push({ name: 'FHIR Adapters', status: 'success' });
  console.log('✓ FHIR Adapters');
} catch (error) {
  imports.push({ name: 'FHIR Adapters', status: 'failed', error: (error as Error).message });
  console.log('✗ FHIR Adapters:', (error as Error).message);
}

try {
  require('../services/study');
  imports.push({ name: 'Study', status: 'success' });
  console.log('✓ Study');
} catch (error) {
  imports.push({ name: 'Study', status: 'failed', error: (error as Error).message });
  console.log('✗ Study:', (error as Error).message);
}

try {
  require('../services/llm');
  imports.push({ name: 'LLM', status: 'success' });
  console.log('✓ LLM');
} catch (error) {
  imports.push({ name: 'LLM', status: 'failed', error: (error as Error).message });
  console.log('✗ LLM:', (error as Error).message);
}

try {
  require('../services/dataPipeline');
  imports.push({ name: 'DataPipeline', status: 'success' });
  console.log('✓ DataPipeline');
} catch (error) {
  imports.push({ name: 'DataPipeline', status: 'failed', error: (error as Error).message });
  console.log('✗ DataPipeline:', (error as Error).message);
}

// Check existing services
try {
  require('../services/firebase');
  imports.push({ name: 'Firebase', status: 'success' });
  console.log('✓ Firebase');
} catch (error) {
  imports.push({ name: 'Firebase', status: 'failed', error: (error as Error).message });
  console.log('✗ Firebase:', (error as Error).message);
}

try {
  require('../services/scheduler');
  imports.push({ name: 'Scheduler', status: 'success' });
  console.log('✓ Scheduler');
} catch (error) {
  imports.push({ name: 'Scheduler', status: 'failed', error: (error as Error).message });
  console.log('✗ Scheduler:', (error as Error).message);
}

try {
  require('../services/notification');
  imports.push({ name: 'Notification', status: 'success' });
  console.log('✓ Notification');
} catch (error) {
  imports.push({ name: 'Notification', status: 'failed', error: (error as Error).message });
  console.log('✗ Notification:', (error as Error).message);
}

try {
  require('../services/storage');
  imports.push({ name: 'Storage', status: 'success' });
  console.log('✓ Storage');
} catch (error) {
  imports.push({ name: 'Storage', status: 'failed', error: (error as Error).message });
  console.log('✗ Storage:', (error as Error).message);
}

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
