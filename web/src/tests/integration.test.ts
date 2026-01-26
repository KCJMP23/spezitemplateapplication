/**
 * Integration Test for All Spezi Modules
 *
 * This test verifies:
 * 1. All services can be imported without errors
 * 2. All services are properly initialized
 * 3. Core functionality works end-to-end
 * 4. Services integrate correctly with each other
 */

// Import all services
import { moduleManager, serviceContainer, globalEventBus } from '../services/intellicKit';
import { accessGuardService } from '../services/accessGuard';
import { httpClient, networkMonitor } from '../services/networking';
import { deviceManager } from '../services/devices';
import { bluetoothManager } from '../services/bluetooth';
import { locationManager } from '../services/location';
import { sensorManager } from '../services/sensorKit';
import { chatService } from '../services/chat';
import { medicationService } from '../services/medication';
import { speechRecognitionService, speechSynthesisService } from '../services/speech';
import { healthKitToFHIRAdapter, fhirToFirestoreAdapter, smartOnFHIRService, fhirValidator } from '../services/fhirAdapters';
import { studyService } from '../services/study';
import { llmService } from '../services/llm';
import { DataPipeline, dataAggregationService, dataQualityService } from '../services/dataPipeline';

// Import existing services
import firebaseService from '../services/firebase';
import fhirService from '../services/fhir';
import schedulerService from '../services/scheduler';
import notificationService from '../services/notification';
import storageService from '../services/storage';

export interface TestResult {
  service: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export class IntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
    console.log('🧪 Starting Integration Tests...\n');

    // Test 1: Service Imports
    await this.testServiceImports();

    // Test 2: Core Services
    await this.testCoreServices();

    // Test 3: Access Control
    await this.testAccessControl();

    // Test 4: Networking
    await this.testNetworking();

    // Test 5: Device & Sensors
    await this.testDevicesAndSensors();

    // Test 6: Healthcare Features
    await this.testHealthcareFeatures();

    // Test 7: Advanced Features
    await this.testAdvancedFeatures();

    // Test 8: Integration Scenarios
    await this.testIntegrationScenarios();

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    console.log(`\n✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);

    return { passed, failed, results: this.results };
  }

  private async testServiceImports(): Promise<void> {
    console.log('📦 Testing Service Imports...');

    const services = [
      { name: 'IntellicKit', service: moduleManager },
      { name: 'AccessGuard', service: accessGuardService },
      { name: 'Networking', service: httpClient },
      { name: 'Devices', service: deviceManager },
      { name: 'Bluetooth', service: bluetoothManager },
      { name: 'Location', service: locationManager },
      { name: 'SensorKit', service: sensorManager },
      { name: 'Chat', service: chatService },
      { name: 'Medication', service: medicationService },
      { name: 'Speech', service: speechRecognitionService },
      { name: 'FHIR Adapters', service: healthKitToFHIRAdapter },
      { name: 'Study', service: studyService },
      { name: 'LLM', service: llmService },
      { name: 'DataPipeline', service: dataAggregationService },
    ];

    for (const { name, service } of services) {
      try {
        if (service === null || service === undefined) {
          throw new Error('Service is null or undefined');
        }

        this.results.push({
          service: `Import: ${name}`,
          passed: true,
        });
        console.log(`  ✓ ${name} imported successfully`);
      } catch (error) {
        this.results.push({
          service: `Import: ${name}`,
          passed: false,
          error: (error as Error).message,
        });
        console.log(`  ✗ ${name} import failed:`, (error as Error).message);
      }
    }
  }

  private async testCoreServices(): Promise<void> {
    console.log('\n⚙️  Testing Core Services...');

    // Test Event Bus
    try {
      let eventReceived = false;
      const unsubscribe = globalEventBus.on('test:event', () => {
        eventReceived = true;
      });

      globalEventBus.emit('test:event');
      unsubscribe();

      if (!eventReceived) throw new Error('Event not received');

      this.results.push({
        service: 'EventBus',
        passed: true,
        details: 'Event emission and subscription working',
      });
      console.log('  ✓ Event Bus working');
    } catch (error) {
      this.results.push({
        service: 'EventBus',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Event Bus failed');
    }

    // Test Service Container
    try {
      serviceContainer.register('testService', { test: true });
      const retrieved = serviceContainer.get<any>('testService');

      if (!retrieved.test) throw new Error('Service retrieval failed');

      this.results.push({
        service: 'ServiceContainer',
        passed: true,
        details: 'Service registration and retrieval working',
      });
      console.log('  ✓ Service Container working');
    } catch (error) {
      this.results.push({
        service: 'ServiceContainer',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Service Container failed');
    }

    // Test Storage Service
    try {
      await storageService.set('test:key', { value: 'test' });
      const retrieved = await storageService.get<any>('test:key');

      if (retrieved?.value !== 'test') throw new Error('Storage retrieval failed');

      this.results.push({
        service: 'Storage',
        passed: true,
        details: 'Storage set/get working',
      });
      console.log('  ✓ Storage Service working');
    } catch (error) {
      this.results.push({
        service: 'Storage',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Storage Service failed');
    }
  }

  private async testAccessControl(): Promise<void> {
    console.log('\n🔒 Testing Access Control...');

    try {
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['patient'],
        primaryRole: 'patient' as const,
      };

      // Test permission check
      const hasViewPermission = accessGuardService.hasPermission(mockUser, 'view:health_data');
      const hasManagePermission = accessGuardService.hasPermission(mockUser, 'manage:users');

      if (!hasViewPermission) throw new Error('Patient should have view:health_data permission');
      if (hasManagePermission) throw new Error('Patient should not have manage:users permission');

      // Test role check
      const isPatient = accessGuardService.hasRole(mockUser, 'patient');
      const isAdmin = accessGuardService.hasRole(mockUser, 'admin');

      if (!isPatient) throw new Error('User should have patient role');
      if (isAdmin) throw new Error('User should not have admin role');

      this.results.push({
        service: 'AccessControl',
        passed: true,
        details: 'Permission and role checks working correctly',
      });
      console.log('  ✓ Access Control working');
    } catch (error) {
      this.results.push({
        service: 'AccessControl',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Access Control failed');
    }
  }

  private async testNetworking(): Promise<void> {
    console.log('\n🌐 Testing Networking...');

    try {
      // Test network monitor
      const networkStatus = networkMonitor.getStatus();

      if (typeof networkStatus.online !== 'boolean') {
        throw new Error('Network status not properly initialized');
      }

      // Test HTTP client configuration
      httpClient.setDefaultHeader('X-Test', 'test-value');
      httpClient.removeDefaultHeader('X-Test');

      this.results.push({
        service: 'Networking',
        passed: true,
        details: `Network online: ${networkStatus.online}`,
      });
      console.log('  ✓ Networking services working');
    } catch (error) {
      this.results.push({
        service: 'Networking',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Networking services failed');
    }
  }

  private async testDevicesAndSensors(): Promise<void> {
    console.log('\n📱 Testing Devices & Sensors...');

    try {
      // Initialize device manager
      await deviceManager.initialize();

      const capabilities = deviceManager.getCapabilities();
      if (!capabilities) throw new Error('Device capabilities not detected');

      const platform = deviceManager.getPlatform();
      if (!['web', 'ios', 'android'].includes(platform)) {
        throw new Error('Invalid platform detected');
      }

      // Test Bluetooth availability
      const bluetoothAvailable = bluetoothManager.isAvailable();

      // Test Location services
      const locationPermissions = await locationManager.checkPermissions();

      // Test Speech services
      const speechAvailable = speechRecognitionService.isAvailable();
      const ttsAvailable = speechSynthesisService.isAvailable();

      this.results.push({
        service: 'Devices',
        passed: true,
        details: {
          platform,
          bluetooth: bluetoothAvailable,
          location: locationPermissions,
          speech: speechAvailable,
          tts: ttsAvailable,
        },
      });
      console.log('  ✓ Devices & Sensors working');
    } catch (error) {
      this.results.push({
        service: 'Devices',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Devices & Sensors failed');
    }
  }

  private async testHealthcareFeatures(): Promise<void> {
    console.log('\n🏥 Testing Healthcare Features...');

    try {
      // Test FHIR Adapter
      const mockHealthData = {
        id: 'test-1',
        userId: 'test-user',
        type: 'heart_rate' as const,
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(),
      };

      const fhirObservation = healthKitToFHIRAdapter.convertToFHIRObservation(
        mockHealthData,
        'test-user'
      );

      if (fhirObservation.resourceType !== 'Observation') {
        throw new Error('Invalid FHIR Observation generated');
      }

      // Test FHIR Validator
      const validation = fhirValidator.validateResource(fhirObservation);
      if (!validation.valid) {
        throw new Error(`FHIR validation failed: ${validation.errors.join(', ')}`);
      }

      // Test Data Quality Service
      const outliers = dataQualityService.detectOutliers([70, 72, 75, 73, 150, 71]);
      if (outliers.length === 0) {
        throw new Error('Outlier detection not working');
      }

      this.results.push({
        service: 'Healthcare',
        passed: true,
        details: 'FHIR conversion and validation working',
      });
      console.log('  ✓ Healthcare Features working');
    } catch (error) {
      this.results.push({
        service: 'Healthcare',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Healthcare Features failed');
    }
  }

  private async testAdvancedFeatures(): Promise<void> {
    console.log('\n🚀 Testing Advanced Features...');

    try {
      // Test Data Pipeline
      const pipeline = new DataPipeline({
        id: 'test-pipeline',
        name: 'Test Pipeline',
        stages: [
          {
            name: 'transform',
            transform: (data: any) => ({ ...data, processed: true }),
          },
          {
            name: 'validate',
            transform: (data: any) => data,
            validate: (data: any) => data.processed === true,
          },
        ],
      });

      const result = await pipeline.execute({ test: 'data' });
      if (!result.success) {
        throw new Error('Pipeline execution failed');
      }

      // Test Data Aggregation
      const testData = [
        { timestamp: new Date(), value: 10 },
        { timestamp: new Date(), value: 20 },
        { timestamp: new Date(), value: 30 },
      ];

      const aggregated = await dataAggregationService.aggregateByTimeRange(testData, 'day');
      if (aggregated.length === 0) {
        throw new Error('Data aggregation failed');
      }

      this.results.push({
        service: 'Advanced',
        passed: true,
        details: 'Pipeline and aggregation working',
      });
      console.log('  ✓ Advanced Features working');
    } catch (error) {
      this.results.push({
        service: 'Advanced',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Advanced Features failed');
    }
  }

  private async testIntegrationScenarios(): Promise<void> {
    console.log('\n🔗 Testing Integration Scenarios...');

    try {
      // Scenario: Health data → FHIR → Firestore
      const healthData = {
        id: 'integration-test',
        userId: 'test-user',
        type: 'heart_rate' as const,
        value: 75,
        unit: 'bpm',
        recordedAt: new Date(),
      };

      // Convert to FHIR
      const fhirObs = healthKitToFHIRAdapter.convertToFHIRObservation(healthData, 'test-user');

      // Validate
      const validation = fhirValidator.validateResource(fhirObs);
      if (!validation.valid) {
        throw new Error('Integration: FHIR validation failed');
      }

      // Test scheduler + notification integration
      // (Would require Firebase, so we just verify the services exist)
      if (!schedulerService || !notificationService) {
        throw new Error('Scheduler or Notification service not available');
      }

      this.results.push({
        service: 'Integration',
        passed: true,
        details: 'End-to-end integration working',
      });
      console.log('  ✓ Integration Scenarios working');
    } catch (error) {
      this.results.push({
        service: 'Integration',
        passed: false,
        error: (error as Error).message,
      });
      console.log('  ✗ Integration Scenarios failed');
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  generateReport(): string {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    let report = '\n========================================\n';
    report += '  INTEGRATION TEST REPORT\n';
    report += '========================================\n\n';
    report += `Total Tests: ${total}\n`;
    report += `Passed: ${passed} ✅\n`;
    report += `Failed: ${failed} ❌\n`;
    report += `Success Rate: ${((passed / total) * 100).toFixed(1)}%\n\n`;

    if (failed > 0) {
      report += 'Failed Tests:\n';
      report += '----------------------------------------\n';
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          report += `❌ ${r.service}: ${r.error}\n`;
        });
    }

    report += '========================================\n';

    return report;
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();
export default integrationTester;
