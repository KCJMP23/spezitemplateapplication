/**
 * Module Verification Script
 *
 * Verifies all Spezi module services exist and can be type-checked
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying all Spezi modules...\n');

const modules = [
  { name: 'IntellicKit', path: '../services/intellicKit.ts' },
  { name: 'AccessGuard', path: '../services/accessGuard.ts' },
  { name: 'Networking', path: '../services/networking.ts' },
  { name: 'Devices', path: '../services/devices.ts' },
  { name: 'Bluetooth', path: '../services/bluetooth.ts' },
  { name: 'Location', path: '../services/location.ts' },
  { name: 'SensorKit', path: '../services/sensorKit.ts' },
  { name: 'Chat', path: '../services/chat.ts' },
  { name: 'Medication', path: '../services/medication.ts' },
  { name: 'Speech', path: '../services/speech.ts' },
  { name: 'FHIR Adapters', path: '../services/fhirAdapters.ts' },
  { name: 'Study', path: '../services/study.ts' },
  { name: 'LLM', path: '../services/llm.ts' },
  { name: 'DataPipeline', path: '../services/dataPipeline.ts' },
  { name: 'Firebase', path: '../services/firebase.ts' },
  { name: 'Scheduler', path: '../services/scheduler.ts' },
  { name: 'Notification', path: '../services/notification.ts' },
  { name: 'Storage', path: '../services/storage.ts' },
];

let passed = 0;
let failed = 0;

// Check 1: File existence
console.log('📁 Checking file existence...\n');
for (const module of modules) {
  const filePath = join(__dirname, module.path);
  if (existsSync(filePath)) {
    console.log(`✓ ${module.name}`);
    passed++;
  } else {
    console.log(`✗ ${module.name} - File not found`);
    failed++;
  }
}

// Check 2: TypeScript compilation
console.log('\n🔧 Running TypeScript type-check...\n');
try {
  execSync('npm run type-check', {
    cwd: join(__dirname, '../..'),
    stdio: 'pipe',
  });
  console.log('✓ TypeScript compilation successful\n');
} catch (error: any) {
  console.log('✗ TypeScript compilation failed\n');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log('Module Verification Summary:');
console.log(`Total modules: ${modules.length}`);
console.log(`Files found: ${passed}/${modules.length} ✅`);
console.log(`Type-check: ${failed === 0 ? 'Passed' : 'Failed'} ${failed === 0 ? '✅' : '❌'}`);
console.log('='.repeat(50));

if (failed > 0 || passed !== modules.length) {
  console.log('\n❌ Some verifications failed');
  process.exit(1);
} else {
  console.log('\n✅ All modules verified successfully!');
  process.exit(0);
}
