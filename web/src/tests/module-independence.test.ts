/**
 * Module Independence Test
 *
 * Verifies that modules can be enabled/disabled independently
 * and that dependencies are properly declared.
 */

import { MODULE_DEPENDENCIES, type ModuleConfig } from '../config/modules.config';

interface ModuleImport {
  module: keyof ModuleConfig;
  imports: string[];
  directDependencies: Array<keyof ModuleConfig>;
}

export class ModuleIndependenceTest {
  /**
   * Test module independence
   */
  testModuleIndependence(): {
    passed: boolean;
    results: Array<{
      module: string;
      independent: boolean;
      issues: string[];
    }>;
  } {
    const modules: Array<keyof ModuleConfig> = [
      'intellicKit',
      'accessGuard',
      'networking',
      'storage',
      'scheduler',
      'notifications',
      'devices',
      'bluetooth',
      'location',
      'sensorKit',
      'fhir',
      'fhirAdapters',
      'healthData',
      'questionnaire',
      'consent',
      'medication',
      'chat',
      'study',
      'llm',
      'dataPipeline',
      'speech',
      'intellicViews',
      'license',
    ];

    const results = modules.map((module) => this.analyzeModule(module));

    const passed = results.every((r) => r.independent);

    return { passed, results };
  }

  private analyzeModule(moduleName: keyof ModuleConfig): {
    module: string;
    independent: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check if module has declared dependencies
    const declaredDeps = MODULE_DEPENDENCIES[moduleName] || [];

    // Module should be independent or have minimal dependencies
    if (declaredDeps.length > 5) {
      issues.push(`High dependency count: ${declaredDeps.length} dependencies`);
    }

    // Check for circular dependencies (simplified check)
    const hasCircular = this.checkCircularDependencies(moduleName);
    if (hasCircular) {
      issues.push('Potential circular dependency detected');
    }

    return {
      module: moduleName,
      independent: issues.length === 0,
      issues,
    };
  }

  private checkCircularDependencies(moduleName: keyof ModuleConfig): boolean {
    const visited = new Set<keyof ModuleConfig>();
    const recursionStack = new Set<keyof ModuleConfig>();

    const hasCycle = (current: keyof ModuleConfig): boolean => {
      visited.add(current);
      recursionStack.add(current);

      const deps = MODULE_DEPENDENCIES[current] || [];

      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(current);
      return false;
    };

    return hasCycle(moduleName);
  }

  /**
   * Test configuration combinations
   */
  testConfigurationCombinations(): {
    passed: boolean;
    validCombinations: number;
    invalidCombinations: number;
    examples: Array<{
      name: string;
      valid: boolean;
      errors: string[];
    }>;
  } {
    const combinations = [
      {
        name: 'All enabled',
        config: this.createFullConfig(true),
      },
      {
        name: 'All disabled except intellicKit',
        config: {
          ...this.createFullConfig(false),
          intellicKit: true,
        },
      },
      {
        name: 'Core only',
        config: {
          ...this.createFullConfig(false),
          intellicKit: true,
          storage: true,
          fhir: true,
        },
      },
      {
        name: 'Patient features',
        config: {
          ...this.createFullConfig(false),
          intellicKit: true,
          storage: true,
          scheduler: true,
          notifications: true,
          fhir: true,
          healthData: true,
          medication: true,
        },
      },
      {
        name: 'Provider features',
        config: {
          ...this.createFullConfig(false),
          intellicKit: true,
          storage: true,
          accessGuard: true,
          fhir: true,
          fhirAdapters: true,
          dataPipeline: true,
        },
      },
    ];

    const results = combinations.map((combo) => {
      const validation = this.validateConfig(combo.config);
      return {
        name: combo.name,
        valid: validation.valid,
        errors: validation.errors,
      };
    });

    const validCombinations = results.filter((r) => r.valid).length;
    const invalidCombinations = results.filter((r) => !r.valid).length;

    return {
      passed: invalidCombinations === 0,
      validCombinations,
      invalidCombinations,
      examples: results,
    };
  }

  private createFullConfig(value: boolean): ModuleConfig {
    return {
      intellicKit: value,
      accessGuard: value,
      networking: value,
      storage: value,
      scheduler: value,
      notifications: value,
      devices: value,
      bluetooth: value,
      location: value,
      sensorKit: value,
      fhir: value,
      fhirAdapters: value,
      healthData: value,
      questionnaire: value,
      consent: value,
      medication: value,
      chat: value,
      study: value,
      llm: value,
      dataPipeline: value,
      speech: value,
      intellicViews: value,
      license: value,
    };
  }

  private validateConfig(config: ModuleConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // IntellicKit is always required
    if (!config.intellicKit) {
      errors.push('IntellicKit is required');
    }

    // Check dependencies
    Object.entries(config).forEach(([moduleName, enabled]) => {
      if (enabled) {
        const deps = MODULE_DEPENDENCIES[moduleName as keyof ModuleConfig] || [];
        deps.forEach((dep) => {
          if (!config[dep]) {
            errors.push(`${moduleName} requires ${dep}`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate report
   */
  generateReport(): string {
    console.log('\n🔬 Module Independence Test Suite');
    console.log('=====================================\n');

    // Test 1: Module Independence
    console.log('Test 1: Module Independence');
    console.log('---------------------------');
    const independenceResults = this.testModuleIndependence();

    independenceResults.results.forEach((result) => {
      if (result.independent) {
        console.log(`✅ ${result.module}: Independent`);
      } else {
        console.log(`⚠️  ${result.module}: Issues found`);
        result.issues.forEach((issue) => {
          console.log(`   - ${issue}`);
        });
      }
    });

    const independencePassed = independenceResults.results.filter((r) => r.independent).length;
    const independenceTotal = independenceResults.results.length;

    console.log(`\nResult: ${independencePassed}/${independenceTotal} modules are independent\n`);

    // Test 2: Configuration Combinations
    console.log('Test 2: Configuration Combinations');
    console.log('-----------------------------------');
    const configResults = this.testConfigurationCombinations();

    configResults.examples.forEach((example) => {
      if (example.valid) {
        console.log(`✅ ${example.name}: Valid`);
      } else {
        console.log(`❌ ${example.name}: Invalid`);
        example.errors.forEach((error) => {
          console.log(`   - ${error}`);
        });
      }
    });

    console.log(
      `\nResult: ${configResults.validCombinations}/${
        configResults.validCombinations + configResults.invalidCombinations
      } configurations are valid\n`
    );

    // Overall Summary
    console.log('=====================================');
    console.log('SUMMARY');
    console.log('=====================================');
    console.log(`Module Independence: ${independencePassed}/${independenceTotal} ✅`);
    console.log(
      `Valid Configurations: ${configResults.validCombinations}/${
        configResults.validCombinations + configResults.invalidCombinations
      } ✅`
    );

    const overallPassed = independenceResults.passed && configResults.passed;
    console.log(`\nOverall: ${overallPassed ? 'PASSED ✅' : 'FAILED ❌'}\n`);

    return overallPassed ? 'PASSED' : 'FAILED';
  }
}

// Export singleton
export const moduleIndependenceTest = new ModuleIndependenceTest();

// Run if executed directly
if (require.main === module) {
  const result = moduleIndependenceTest.generateReport();
  process.exit(result === 'PASSED' ? 0 : 1);
}

export default moduleIndependenceTest;
