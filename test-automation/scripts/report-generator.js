#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'reports');
    this.timestamp = new Date().toISOString();
  }

  async generate() {
    console.log('📊 Generating test report...\n');
    
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      const testResults = await this.collectTestResults();
      const coverage = await this.collectCoverageData();
      const metrics = await this.calculateMetrics(testResults);
      
      const report = {
        timestamp: this.timestamp,
        environment: process.env.TEST_ENV || 'local',
        duration: this.calculateDuration(testResults),
        summary: {
          totalSuites: testResults.length,
          totalTests: metrics.totalTests,
          passed: metrics.passed,
          failed: metrics.failed,
          skipped: metrics.skipped,
          passRate: `${metrics.passRate}%`,
          duration: `${metrics.duration}ms`
        },
        coverage: coverage,
        suites: testResults,
        metrics: metrics,
        trends: await this.calculateTrends()
      };
      
      await this.saveReport(report);
      await this.generateHTMLReport(report);
      await this.generateMarkdownSummary(report);
      
      console.log('✅ Report generation complete!\n');
      return report;
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
      throw error;
    }
  }

  async collectTestResults() {
    const results = [];
    
    try {
      const files = await fs.readdir(this.reportsDir);
      const resultFiles = files.filter(f => f.endsWith('.json') && f.includes('test-results'));
      
      for (const file of resultFiles) {
        const content = await fs.readFile(path.join(this.reportsDir, file), 'utf8');
        const data = JSON.parse(content);
        results.push(data);
      }
    } catch (error) {
      console.warn('⚠️  No existing test results found');
    }
    
    return results;
  }

  async collectCoverageData() {
    try {
      const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
      const content = await fs.readFile(coveragePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  No coverage data found');
      return null;
    }
  }

  calculateMetrics(testResults) {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration = 0;
    
    for (const suite of testResults) {
      if (suite.tests) {
        totalTests += suite.tests.length;
        passed += suite.tests.filter(t => t.status === 'passed').length;
        failed += suite.tests.filter(t => t.status === 'failed').length;
        skipped += suite.tests.filter(t => t.status === 'skipped').length;
        duration += suite.duration || 0;
      }
    }
    
    const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
    
    return {
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      passRate
    };
  }

  calculateDuration(testResults) {
    return testResults.reduce((total, suite) => total + (suite.duration || 0), 0);
  }

  async calculateTrends() {
    const trends = {
      passRateHistory: [],
      durationHistory: [],
      failuresByCategory: {}
    };
    
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportFiles = files.filter(f => f.startsWith('test-report-') && f.endsWith('.json'));
      
      for (const file of reportFiles.slice(-10)) {
        const content = await fs.readFile(path.join(this.reportsDir, file), 'utf8');
        const report = JSON.parse(content);
        
        if (report.summary) {
          trends.passRateHistory.push({
            date: report.timestamp,
            passRate: parseFloat(report.summary.passRate)
          });
          
          trends.durationHistory.push({
            date: report.timestamp,
            duration: parseInt(report.summary.duration)
          });
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not calculate trends');
    }
    
    return trends;
  }

  async saveReport(report) {
    const filename = `test-report-${Date.now()}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    const latestPath = path.join(this.reportsDir, 'test-report-latest.json');
    await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
    
    console.log(`📁 Report saved to: ${filepath}`);
  }

  async generateHTMLReport(report) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${new Date(report.timestamp).toLocaleString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 10px; }
        .timestamp { color: #666; font-size: 14px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-label { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .metric-value { font-size: 32px; font-weight: bold; color: #333; }
        .metric.passed { border-left: 4px solid #22c55e; }
        .metric.failed { border-left: 4px solid #ef4444; }
        .metric.skipped { border-left: 4px solid #f59e0b; }
        .metric.rate { border-left: 4px solid #3b82f6; }
        .coverage { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .coverage h2 { margin-bottom: 15px; color: #333; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .coverage-item { text-align: center; }
        .coverage-label { color: #666; font-size: 12px; margin-bottom: 5px; }
        .coverage-value { font-size: 24px; font-weight: bold; }
        .good { color: #22c55e; }
        .warning { color: #f59e0b; }
        .bad { color: #ef4444; }
        .suites { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite { padding: 15px; border-bottom: 1px solid #e5e5e5; }
        .suite:last-child { border-bottom: none; }
        .suite-name { font-weight: bold; margin-bottom: 5px; }
        .suite-stats { color: #666; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Automation Report</h1>
            <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
            <div class="timestamp">Environment: ${report.environment}</div>
        </div>
        
        <div class="summary">
            <div class="metric passed">
                <div class="metric-label">Passed</div>
                <div class="metric-value">${report.summary.passed}</div>
            </div>
            <div class="metric failed">
                <div class="metric-label">Failed</div>
                <div class="metric-value">${report.summary.failed}</div>
            </div>
            <div class="metric skipped">
                <div class="metric-label">Skipped</div>
                <div class="metric-value">${report.summary.skipped}</div>
            </div>
            <div class="metric rate">
                <div class="metric-label">Pass Rate</div>
                <div class="metric-value">${report.summary.passRate}</div>
            </div>
        </div>
        
        ${report.coverage ? `
        <div class="coverage">
            <h2>📊 Code Coverage</h2>
            <div class="coverage-grid">
                <div class="coverage-item">
                    <div class="coverage-label">Lines</div>
                    <div class="coverage-value ${this.getCoverageClass(report.coverage.total?.lines?.pct)}">
                        ${report.coverage.total?.lines?.pct || 0}%
                    </div>
                </div>
                <div class="coverage-item">
                    <div class="coverage-label">Branches</div>
                    <div class="coverage-value ${this.getCoverageClass(report.coverage.total?.branches?.pct)}">
                        ${report.coverage.total?.branches?.pct || 0}%
                    </div>
                </div>
                <div class="coverage-item">
                    <div class="coverage-label">Functions</div>
                    <div class="coverage-value ${this.getCoverageClass(report.coverage.total?.functions?.pct)}">
                        ${report.coverage.total?.functions?.pct || 0}%
                    </div>
                </div>
                <div class="coverage-item">
                    <div class="coverage-label">Statements</div>
                    <div class="coverage-value ${this.getCoverageClass(report.coverage.total?.statements?.pct)}">
                        ${report.coverage.total?.statements?.pct || 0}%
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="suites">
            <h2>📋 Test Suites</h2>
            ${report.suites.map(suite => `
                <div class="suite">
                    <div class="suite-name">${suite.name || 'Unknown Suite'}</div>
                    <div class="suite-stats">
                        Duration: ${suite.duration || 0}ms | 
                        Tests: ${suite.tests?.length || 0} | 
                        Status: ${suite.status || 'unknown'}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            Juno Marketplace Test Automation - Report generated at ${new Date().toISOString()}
        </div>
    </div>
</body>
</html>`;
    
    const filepath = path.join(this.reportsDir, 'test-report.html');
    await fs.writeFile(filepath, html);
    console.log(`📄 HTML report saved to: ${filepath}`);
  }

  getCoverageClass(percentage) {
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'warning';
    return 'bad';
  }

  async generateMarkdownSummary(report) {
    const markdown = `# Test Report Summary

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Environment:** ${report.environment}

## 📊 Results

| Metric | Value |
|--------|-------|
| **Total Tests** | ${report.summary.totalTests} |
| **Passed** | ✅ ${report.summary.passed} |
| **Failed** | ❌ ${report.summary.failed} |
| **Skipped** | ⏭️ ${report.summary.skipped} |
| **Pass Rate** | ${report.summary.passRate} |
| **Duration** | ${report.summary.duration} |

${report.coverage ? `
## 📈 Coverage

| Type | Coverage |
|------|----------|
| **Lines** | ${report.coverage.total?.lines?.pct || 0}% |
| **Branches** | ${report.coverage.total?.branches?.pct || 0}% |
| **Functions** | ${report.coverage.total?.functions?.pct || 0}% |
| **Statements** | ${report.coverage.total?.statements?.pct || 0}% |
` : ''}

## 🧪 Test Suites

${report.suites.map(suite => `- **${suite.name || 'Unknown'}**: ${suite.status || 'unknown'} (${suite.duration || 0}ms)`).join('\n')}

---
*Report generated by Juno Marketplace Test Automation*`;
    
    const filepath = path.join(this.reportsDir, 'REPORT.md');
    await fs.writeFile(filepath, markdown);
    console.log(`📝 Markdown summary saved to: ${filepath}`);
  }
}

async function main() {
  const generator = new ReportGenerator();
  await generator.generate();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});