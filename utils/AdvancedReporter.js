/**
 * Advanced Reporting System - Phase 2 Production-Ready Feature
 * Provides comprehensive HTML, JSON, and API reporting capabilities
 */

import fs from 'fs';
import path from 'path';

export class AdvancedReporter {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = [];
    this.visualRegressionResults = [];
    this.crossBrowserResults = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Initialize reporting session
   */
  initialize() {
    this.startTime = new Date();
    this.testResults = [];
    this.performanceMetrics = [];
    this.visualRegressionResults = [];
    this.crossBrowserResults = [];
    console.log('📊 Advanced reporting initialized');
  }

  /**
   * Add test result
   */
  addTestResult(testResult) {
    this.testResults.push({
      ...testResult,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add performance metrics
   */
  addPerformanceMetrics(metrics) {
    this.performanceMetrics.push({
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add visual regression result
   */
  addVisualRegressionResult(result) {
    this.visualRegressionResults.push({
      ...result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add cross-browser result
   */
  addCrossBrowserResult(result) {
    this.crossBrowserResults.push({
      ...result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Finalize reporting session
   */
  finalize() {
    this.endTime = new Date();
    console.log('📊 Advanced reporting finalized');
  }

  /**
   * Generate comprehensive HTML report
   */
  generateHTMLReport() {
    const report = this.generateReportData();
    const html = this.generateHTMLContent(report);
    
    const reportPath = 'test-results/advanced-report.html';
    fs.writeFileSync(reportPath, html);
    
    console.log(`📄 HTML report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate JSON report
   */
  generateJSONReport() {
    const report = this.generateReportData();
    
    const reportPath = 'test-results/advanced-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 JSON report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate comprehensive report data
   */
  generateReportData() {
    const duration = this.endTime ? this.endTime - this.startTime : 0;
    
    const summary = {
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.passed).length,
      failedTests: this.testResults.filter(r => !r.passed).length,
      skippedTests: this.testResults.filter(r => r.skipped).length,
      passRate: this.testResults.length > 0 ? ((this.testResults.filter(r => r.passed).length / this.testResults.length) * 100).toFixed(2) : '0',
      duration: duration,
      startTime: this.startTime?.toISOString(),
      endTime: this.endTime?.toISOString()
    };

    const performanceSummary = this.calculatePerformanceSummary();
    const visualRegressionSummary = this.calculateVisualRegressionSummary();
    const crossBrowserSummary = this.calculateCrossBrowserSummary();

    return {
      metadata: {
        reportVersion: '2.0',
        generatedAt: new Date().toISOString(),
        framework: 'Playwright',
        environment: process.env.NODE_ENV || 'development',
        testSuite: 'Nexus Superadmin - Phase 2'
      },
      summary,
      performance: {
        summary: performanceSummary,
        metrics: this.performanceMetrics
      },
      visualRegression: {
        summary: visualRegressionSummary,
        results: this.visualRegressionResults
      },
      crossBrowser: {
        summary: crossBrowserSummary,
        results: this.crossBrowserResults
      },
      tests: this.testResults,
      recommendations: this.generateRecommendations(),
      trends: this.calculateTrends()
    };
  }

  /**
   * Calculate performance summary
   */
  calculatePerformanceSummary() {
    if (this.performanceMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        minLoadTime: 0,
        maxLoadTime: 0,
        totalTests: 0
      };
    }

    const loadTimes = this.performanceMetrics
      .filter(m => m.loadComplete)
      .map(m => m.loadComplete);

    return {
      averageLoadTime: Math.round(loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length),
      minLoadTime: Math.min(...loadTimes),
      maxLoadTime: Math.max(...loadTimes),
      totalTests: this.performanceMetrics.length,
      slowestTest: this.findSlowestTest(),
      fastestTest: this.findFastestTest()
    };
  }

  /**
   * Calculate visual regression summary
   */
  calculateVisualRegressionSummary() {
    if (this.visualRegressionResults.length === 0) {
      return {
        totalComparisons: 0,
        passedComparisons: 0,
        failedComparisons: 0,
        averageDifference: 0,
        passRate: '0%'
      };
    }

    const passed = this.visualRegressionResults.filter(r => r.passed).length;
    const total = this.visualRegressionResults.length;
    const averageDifference = this.visualRegressionResults.reduce((sum, r) => sum + r.difference, 0) / total;

    return {
      totalComparisons: total,
      passedComparisons: passed,
      failedComparisons: total - passed,
      averageDifference: averageDifference * 100,
      passRate: ((passed / total) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Calculate cross-browser summary
   */
  calculateCrossBrowserSummary() {
    if (this.crossBrowserResults.length === 0) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        browsers: {},
        passRate: '0%'
      };
    }

    const browsers = {};
    this.crossBrowserResults.forEach(result => {
      if (!browsers[result.browser]) {
        browsers[result.browser] = { passed: 0, failed: 0, total: 0 };
      }
      
      if (result.passed) {
        browsers[result.browser].passed++;
      } else {
        browsers[result.browser].failed++;
      }
      browsers[result.browser].total++;
    });

    const totalPassed = Object.values(browsers).reduce((sum, b) => sum + b.passed, 0);
    const totalTests = Object.values(browsers).reduce((sum, b) => sum + b.total, 0);

    return {
      totalTests,
      passedTests: totalPassed,
      failedTests: totalTests - totalPassed,
      browsers,
      passRate: ((totalPassed / totalTests) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Find slowest test
   */
  findSlowestTest() {
    if (this.performanceMetrics.length === 0) return null;
    
    return this.performanceMetrics
      .filter(m => m.duration)
      .reduce((slowest, current) => current.duration > (slowest?.duration || 0) ? current : slowest);
  }

  /**
   * Find fastest test
   */
  findFastestTest() {
    if (this.performanceMetrics.length === 0) return null;
    
    return this.performanceMetrics
      .filter(m => m.duration)
      .reduce((fastest, current) => current.duration < (fastest?.duration || Infinity) ? current : fastest);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateReportData().summary;

    // Performance recommendations
    if (this.performanceSummary?.averageLoadTime > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Performance Optimization Needed',
        description: `Average test load time is ${this.performanceSummary.averageLoadTime}ms (target: <5000ms)`,
        action: 'Review test implementation for performance bottlenecks'
      });
    }

    // Test stability recommendations
    if (summary.passRate < 80) {
      recommendations.push({
        type: 'stability',
        priority: 'high',
        title: 'Test Stability Issues',
        description: `Test pass rate is ${summary.passRate} (target: >80%)`,
        action: 'Review failed tests and fix flaky tests'
      });
    }

    // Visual regression recommendations
    if (this.visualRegressionSummary?.failedComparisons > 0) {
      recommendations.push({
        type: 'visual',
        priority: 'medium',
        title: 'Visual Regression Issues',
        description: `${this.visualRegressionSummary.failedComparisons} visual comparisons failed`,
        action: 'Review UI changes and update baselines if needed'
      });
    }

    // Cross-browser recommendations
    Object.entries(this.crossBrowserSummary?.browsers || {}).forEach(([browser, stats]) => {
      if (stats.failed > 0) {
        const failureRate = (stats.failed / stats.total * 100).toFixed(2);
        recommendations.push({
          type: 'cross-browser',
          priority: failureRate > 50 ? 'high' : 'medium',
          title: `${browser} Compatibility Issues`,
          description: `${browser} has ${failureRate}% failure rate (${stats.failed}/${stats.total} tests)`,
          action: `Investigate ${browser}-specific issues and improve cross-browser compatibility`
        });
      }
    });

    return recommendations;
  }

  /**
   * Calculate trends
   */
  calculateTrends() {
    // Simple trend analysis based on test results over time
    const trends = {
      testStability: this.calculateTestStabilityTrend(),
      performanceTrend: this.calculatePerformanceTrend(),
      visualRegressionTrend: this.calculateVisualRegressionTrend()
    };

    return trends;
  }

  /**
   * Calculate test stability trend
   */
  calculateTestStabilityTrend() {
    if (this.testResults.length < 2) return 'insufficient_data';
    
    const recentTests = this.testResults.slice(-10);
    const olderTests = this.testResults.slice(-20, -10);
    
    if (olderTests.length === 0) return 'insufficient_data';
    
    const recentPassRate = recentTests.filter(r => r.passed).length / recentTests.length;
    const olderPassRate = olderTests.filter(r => r.passed).length / olderTests.length;
    
    const difference = recentPassRate - olderPassRate;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Calculate performance trend
   */
  calculatePerformanceTrend() {
    if (this.performanceMetrics.length < 2) return 'insufficient_data';
    
    const recentMetrics = this.performanceMetrics.slice(-10);
    const olderMetrics = this.performanceMetrics.slice(-20, -10);
    
    if (olderMetrics.length === 0) return 'insufficient_data';
    
    const recentAvg = recentMetrics.reduce((sum, m) => sum + (m.loadComplete || 0), 0) / recentMetrics.length;
    const olderAvg = olderMetrics.reduce((sum, m) => sum + (m.loadComplete || 0), 0) / olderMetrics.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > -500) return 'improving';
    if (difference < 500) return 'declining';
    return 'stable';
  }

  /**
   * Calculate visual regression trend
   */
  calculateVisualRegressionTrend() {
    if (this.visualRegressionResults.length < 2) return 'insufficient_data';
    
    const recentResults = this.visualRegressionResults.slice(-10);
    const olderResults = this.visualRegressionResults.slice(-20, -10);
    
    if (olderResults.length === 0) return 'insufficient_data';
    
    const recentPassRate = recentResults.filter(r => r.passed).length / recentResults.length;
    const olderPassRate = olderResults.filter(r => r.passed).length / olderResults.length;
    
    const difference = recentPassRate - olderPassRate;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Generate HTML content
   */
  generateHTMLContent(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Superadmin - Phase 2 Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
        .header h1 { color: #2c3e50; margin: 0; }
        .header p { color: #7f8c8d; margin: 5px 0 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .metric .value { font-size: 2em; font-weight: bold; color: #3498db; }
        .metric .label { color: #7f8c8d; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .test-result { background: #f8f9fa; border-left: 4px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        .test-result.passed { border-left-color: #27ae60; }
        .test-result.failed { border-left-color: #e74c3c; }
        .test-result.skipped { border-left-color: #f39c12; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; }
        .recommendation { margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px; }
        .recommendation.high { border-left: 4px solid #e74c3c; }
        .recommendation.medium { border-left: 4px solid #f39c12; }
        .recommendation.low { border-left: 4px solid #27ae60; }
        .trends { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .trend { background: #e8f4f8; padding: 20px; border-radius: 6px; text-align: center; }
        .trend.stable { border-left: 4px solid #3498db; }
        .trend.improving { border-left: 4px solid #27ae60; }
        .trend.declining { border-left: 4px solid #e74c3c; }
        .timestamp { text-align: center; color: #7f8c8d; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .badge.passed { background: #27ae60; color: white; }
        .badge.failed { background: #e74c3c; color: white; }
        .badge.skipped { background: #f39c12; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Nexus Superadmin - Phase 2 Test Report</h1>
            <p>Generated on ${report.metadata.generatedAt} | Framework: ${report.metadata.framework}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>📊 Test Summary</h3>
                <div class="value">${report.summary.totalTests}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="metric">
                <h3>✅ Pass Rate</h3>
                <div class="value">${report.summary.passRate}</div>
                <div class="label">Passed</div>
            </div>
            <div class="metric">
                <h3>⏱️ Duration</h3>
                <div class="value">${Math.round(report.summary.duration / 1000)}s</div>
                <div class="label">Total Time</div>
            </div>
            <div class="metric">
                <h3>⚡ Performance</h3>
                <div class="value">${report.performance.summary.averageLoadTime}ms</div>
                <div class="label">Avg Load Time</div>
            </div>
        </div>

        ${this.generateTestsSection(report.tests)}
        ${this.generatePerformanceSection(report.performance)}
        ${this.generateVisualRegressionSection(report.visualRegression)}
        ${this.generateCrossBrowserSection(report.crossBrowser)}
        ${this.generateRecommendationsSection(report.recommendations)}
        ${this.generateTrendsSection(report.trends)}

        <div class="timestamp">
            Report generated by Nexus Superadmin Phase 2 Testing Framework
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate tests section HTML
   */
  generateTestsSection(tests) {
    const passedTests = tests.filter(t => t.passed);
    const failedTests = tests.filter(t => !t.passed);
    const skippedTests = tests.filter(t => t.skipped);

    return `
        <div class="section">
            <h2>🧪 Test Results</h2>
            <div class="test-results">
                ${passedTests.map(test => this.generateTestResultHTML(test, 'passed')).join('')}
                ${failedTests.map(test => this.generateTestResultHTML(test, 'failed')).join('')}
                ${skippedTests.map(test => this.generateTestResultHTML(test, 'skipped')).join('')}
            </div>
        </div>
    `;
  }

  /**
   * Generate test result HTML
   */
  generateTestResultHTML(test, status) {
    const badgeClass = status;
    const statusText = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    
    return `
        <div class="test-result ${status}">
            <div class="badge ${badgeClass}">${statusText} ${status.toUpperCase()}</div>
            <strong>${test.testName}</strong>
            ${test.browser ? `<span style="float: right;">${test.browser}</span>` : ''}
            <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                Duration: ${test.duration}ms | ${new Date(test.timestamp).toLocaleTimeString()}
            </div>
            ${test.error ? `<div style="color: #e74c3c; margin-top: 5px;">Error: ${test.error}</div>` : ''}
        </div>
    `;
  }

  /**
   * Generate performance section HTML
   */
  generatePerformanceSection(performance) {
    return `
        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <div class="summary">
                <div class="metric">
                    <h3>📈 Average Load Time</h3>
                    <div class="value">${performance.summary.averageLoadTime}ms</div>
                    <div class="label">Average</div>
                </div>
                <div class="metric">
                    <h3>⚡ Fastest Test</h3>
                    <div class="value">${performance.summary.fastestTest?.duration || 0}ms</div>
                    <div class="label">Fastest</div>
                </div>
                <div class="metric">
                    <h3>🐌 Slowest Test</h3>
                    <div class="value">${performance.summary.slowestTest?.duration || 0}ms</div>
                    <div class="label">Slowest</div>
                </div>
                <div class="metric">
                    <h3>📊 Total Tests</h3>
                    <div class="value">${performance.summary.totalTests}</div>
                    <div class="label">With Metrics</div>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate visual regression section HTML
   */
  generateVisualRegressionSection(visualRegression) {
    return `
        <div class="section">
            <h2>👁️ Visual Regression</h2>
            <div class="summary">
                <div class="metric">
                    <h3>📊 Comparisons</h3>
                    <div class="value">${visualRegression.summary.totalComparisons}</div>
                    <div class="label">Total</div>
                </div>
                <div class="metric">
                    <h3>✅ Pass Rate</h3>
                    <div class="value">${visualRegression.summary.passRate}</div>
                <div class="label">Passed</div>
                </div>
                <div class="metric">
                    <h3📏 Avg Difference</h3>
                    <div class="value">${visualRegression.summary.averageDifference}%</div>
                    <div class="label">Average</div>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate cross-browser section HTML
   */
  generateCrossBrowserSection(crossBrowser) {
    const browsers = Object.entries(crossBrowser.summary.browsers);
    
    return `
        <div class="section">
            <h2>🌐 Cross-Browser Results</h2>
            <div class="summary">
                <div class="metric">
                    <h3>📊 Total Tests</h3>
                    <div class="value">${crossBrowser.summary.totalTests}</div>
                    <div class="label">Total</div>
                </div>
                <div class="metric">
                    <h3>✅ Pass Rate</h3>
                    <div class="value">${crossBrowser.summary.passRate}</div>
                    <div class="label">Overall</div>
                </div>
            </div>
            <div class="browsers">
                ${browsers.map(([browser, stats]) => `
                    <div class="metric">
                        <h3>${browser}</h3>
                        <div class="value">${stats.passed}/${stats.total}</div>
                        <div class="label">Passed</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
  }

  /**
   * Generate recommendations section HTML
   */
  generateRecommendationsSection(recommendations) {
    if (recommendations.length === 0) {
      return `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <p>🎉 All systems are performing well! No recommendations at this time.</p>
        </div>
      `;
    }

    return `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendations">
                ${recommendations.map(rec => `
                    <div class="recommendation ${rec.priority}">
                        <strong>${rec.title}</strong>
                        <p>${rec.description}</p>
                        <small>Action: ${rec.action}</small>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
  }

  /**
   * Generate trends section HTML
   */
  generateTrendsSection(trends) {
    return `
        <div class="section">
            <h2>📈 Trends Analysis</h2>
            <div class="trends">
                <div class="trend ${trends.testStability}">
                    <h3>🧪 Test Stability</h3>
                    <div style="text-transform: capitalize;">${trends.testStability}</div>
                    <div class="label">Trend</div>
                </div>
                <div class="trend ${trends.performanceTrend}">
                    <h3>⚡ Performance</h3>
                    <div style="text-transform: capitalize;">${trends.performanceTrend}</div>
                    <div class="label">Trend</div>
                </div>
                <div class="trend ${trends.visualRegressionTrend}">
                    <h3>👁️ Visual Regression</h3>
                    <div style="text-transform: capitalize;">${trends.visualRegressionTrend}</div>
                    <div class="label">Trend</div>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Export report for API consumption
   */
  exportForAPI() {
    return this.generateReportData();
  }

  /**
   * Send report to monitoring system (placeholder)
   */
  async sendToMonitoring(webhookUrl) {
    try {
      const report = this.generateReportData();
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
      
      if (response.ok) {
        console.log('📡 Report sent to monitoring system');
        return true;
      } else {
        console.log('❌ Failed to send report to monitoring system');
        return false;
      }
    } catch (error) {
      console.log('❌ Error sending report to monitoring:', error.message);
      return false;
    }
  }
}
