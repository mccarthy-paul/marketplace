import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class TestAutomationAgent {
  constructor(config = {}) {
    this.config = {
      baseDir: path.join(__dirname, '..'),
      marketplaceUrl: config.marketplaceUrl || process.env.MARKETPLACE_URL || 'http://localhost:5173',
      adminUrl: config.adminUrl || process.env.ADMIN_URL || 'http://localhost:5174',
      apiUrl: config.apiUrl || process.env.API_URL || 'http://localhost:8001',
      testTimeout: config.testTimeout || 30000,
      retryCount: config.retryCount || 3,
      parallel: config.parallel || false,
      headless: config.headless !== false,
      ...config
    };
    
    this.testResults = [];
    this.currentSuite = null;
  }

  async initialize() {
    console.log('🤖 Test Automation Agent initializing...');
    
    await this.checkEnvironment();
    await this.setupTestDatabase();
    await this.loadFixtures();
    
    console.log('✅ Test Automation Agent ready');
    return this;
  }

  async checkEnvironment() {
    const checks = [
      { name: 'Marketplace App', url: this.config.marketplaceUrl },
      { name: 'Admin App', url: this.config.adminUrl },
      { name: 'API Server', url: `${this.config.apiUrl}/health` }
    ];

    for (const check of checks) {
      try {
        const response = await fetch(check.url, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        
        if (!response || !response.ok) {
          console.warn(`⚠️  ${check.name} not reachable at ${check.url}`);
        } else {
          console.log(`✓ ${check.name} is running at ${check.url}`);
        }
      } catch (error) {
        console.warn(`⚠️  ${check.name} check failed: ${error.message}`);
      }
    }
  }

  async setupTestDatabase() {
    if (process.env.TEST_DB_URI) {
      try {
        const { MongoClient } = await import('mongodb');
        const client = new MongoClient(process.env.TEST_DB_URI);
        await client.connect();
        await client.close();
        console.log('✓ Test database connection verified');
      } catch (error) {
        console.warn('⚠️  Test database not available:', error.message);
      }
    }
  }

  async loadFixtures() {
    const fixturesPath = path.join(this.config.baseDir, 'fixtures');
    try {
      await fs.access(fixturesPath);
      console.log('✓ Test fixtures loaded');
    } catch {
      console.log('📁 Creating fixtures directory...');
      await fs.mkdir(fixturesPath, { recursive: true });
    }
  }

  async runTestSuite(suiteName, options = {}) {
    console.log(`\n🧪 Running ${suiteName} test suite...`);
    this.currentSuite = suiteName;
    
    const suiteConfig = {
      ...this.config,
      ...options
    };

    let results;
    
    switch (suiteName) {
      case 'marketplace':
        results = await this.runMarketplaceTests(suiteConfig);
        break;
      case 'admin':
        results = await this.runAdminTests(suiteConfig);
        break;
      case 'api':
        results = await this.runApiTests(suiteConfig);
        break;
      case 'e2e':
        results = await this.runE2ETests(suiteConfig);
        break;
      case 'integration':
        results = await this.runIntegrationTests(suiteConfig);
        break;
      case 'performance':
        results = await this.runPerformanceTests(suiteConfig);
        break;
      default:
        throw new Error(`Unknown test suite: ${suiteName}`);
    }

    this.testResults.push({
      suite: suiteName,
      timestamp: new Date().toISOString(),
      results
    });

    return results;
  }

  async runMarketplaceTests(config) {
    const testPath = path.join(this.config.baseDir, 'suites', 'marketplace');
    return this.executeTests(testPath, config);
  }

  async runAdminTests(config) {
    const testPath = path.join(this.config.baseDir, 'suites', 'admin');
    return this.executeTests(testPath, config);
  }

  async runApiTests(config) {
    const testPath = path.join(this.config.baseDir, 'suites', 'api');
    return this.executeTests(testPath, config);
  }

  async runE2ETests(config) {
    return new Promise((resolve, reject) => {
      const playwrightArgs = [
        'test',
        '--config', path.join(this.config.baseDir, 'config', 'playwright.config.js')
      ];

      if (config.headless) {
        playwrightArgs.push('--headed=false');
      }

      const playwright = spawn('npx', ['playwright', ...playwrightArgs], {
        cwd: this.config.baseDir,
        stdio: 'inherit'
      });

      playwright.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, exitCode: code });
        } else {
          reject(new Error(`E2E tests failed with exit code ${code}`));
        }
      });
    });
  }

  async runIntegrationTests(config) {
    const testPath = path.join(this.config.baseDir, 'suites', 'integration');
    return this.executeTests(testPath, config);
  }

  async runPerformanceTests(config) {
    console.log('📊 Running performance tests...');
    
    const metrics = {
      responseTime: [],
      throughput: [],
      errorRate: 0
    };

    const endpoints = [
      '/api/watches',
      '/api/users',
      '/api/bids'
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      try {
        const response = await fetch(`${this.config.apiUrl}${endpoint}`);
        const duration = Date.now() - start;
        metrics.responseTime.push({ endpoint, duration });
        
        if (!response.ok) {
          metrics.errorRate++;
        }
      } catch (error) {
        metrics.errorRate++;
      }
    }

    return {
      success: metrics.errorRate === 0,
      metrics
    };
  }

  async executeTests(testPath, config) {
    return new Promise((resolve, reject) => {
      const vitestArgs = [
        'run',
        testPath,
        '--config', path.join(this.config.baseDir, 'config', 'vitest.config.js')
      ];

      if (config.coverage) {
        vitestArgs.push('--coverage');
      }

      const vitest = spawn('npx', ['vitest', ...vitestArgs], {
        cwd: this.config.baseDir,
        stdio: 'inherit'
      });

      vitest.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, exitCode: code });
        } else {
          resolve({ success: false, exitCode: code });
        }
      });
    });
  }

  async runAllTests() {
    console.log('🚀 Running all test suites...\n');
    
    const suites = ['api', 'marketplace', 'admin', 'integration', 'e2e'];
    const results = {};
    
    for (const suite of suites) {
      try {
        results[suite] = await this.runTestSuite(suite);
      } catch (error) {
        console.error(`❌ ${suite} suite failed:`, error.message);
        results[suite] = { success: false, error: error.message };
      }
    }
    
    return results;
  }

  async generateReport() {
    console.log('\n📋 Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.TEST_ENV || 'local',
      config: this.config,
      results: this.testResults,
      summary: this.generateSummary()
    };

    const reportPath = path.join(this.config.baseDir, 'reports', `test-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Report saved to: ${reportPath}`);
    return report;
  }

  generateSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.results?.success).length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    if (process.env.TEST_DB_URI) {
      try {
        const { MongoClient } = await import('mongodb');
        const client = new MongoClient(process.env.TEST_DB_URI);
        await client.connect();
        const db = client.db();
        await db.dropDatabase();
        await client.close();
        console.log('✓ Test database cleaned');
      } catch (error) {
        console.warn('⚠️  Could not clean test database:', error.message);
      }
    }
    
    console.log('✅ Cleanup complete');
  }
}

export default TestAutomationAgent;