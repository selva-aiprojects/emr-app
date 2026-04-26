/**
 * Cross-Browser Testing Manager - Phase 2 Production-Ready Feature
 * Provides multi-browser testing capabilities with unified reporting
 */

import { test as playwrightTest } from '@playwright/test';

export class CrossBrowserManager {
  constructor() {
    this.browsers = ['chromium', 'firefox', 'webkit'];
    this.viewport = { width: 1366, height: 768 };
    this.testResults = [];
    this.currentBrowser = null;
  }

  /**
   * Create cross-browser test suite
   */
  createCrossBrowserTest(testName, testFunction) {
    console.log(`🌐 Creating cross-browser test: ${testName}`);
    
    const testSuite = playwrightTest.describe(`${testName} - Cross-Browser Tests`, () => {
      
      this.browsers.forEach(browser => {
        playwrightTest.describe(`${browser}`, () => {
          
          playwrightTest.beforeEach(async ({ page, browserName }) => {
            this.currentBrowser = browserName;
            console.log(`🔧 Setting up ${browserName} browser`);
            
            // Set viewport
            await page.setViewportSize(this.viewport);
            
            // Configure browser-specific settings
            await this.configureBrowser(page, browserName);
          });

          playwrightTest.afterEach(async ({ page }) => {
            console.log(`🧹 Cleaning up ${this.currentBrowser} browser`);
            await this.cleanupBrowser(page, this.currentBrowser);
          });

          // Run the actual test
          playwrightTest(testName, async ({ page }) => {
            const startTime = Date.now();
            
            try {
              const result = await testFunction(page, this.currentBrowser);
              const endTime = Date.now();
              
              const testResult = {
                testName,
                browser: this.currentBrowser,
                passed: true,
                duration: endTime - startTime,
                result,
                timestamp: new Date().toISOString()
              };
              
              this.testResults.push(testResult);
              console.log(`✅ ${this.currentBrowser} - ${testName} PASSED (${testResult.duration}ms)`);
              
              return result;
              
            } catch (error) {
              const endTime = Date.now();
              
              const testResult = {
                testName,
                browser: this.currentBrowser,
                passed: false,
                duration: endTime - startTime,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
              };
              
              this.testResults.push(testResult);
              console.log(`❌ ${this.currentBrowser} - ${testName} FAILED (${testResult.duration}ms): ${error.message}`);
              
              // Take screenshot on failure
              await page.screenshot({
                path: `test-results/cross-browser/${testName}-${this.currentBrowser}-failure.png`,
                fullPage: true
              });
              
              throw error;
            }
          });
        });
      });
    });

    return testSuite;
  }

  /**
   * Configure browser-specific settings
   */
  async configureBrowser(page, browserName) {
    switch (browserName) {
      case 'chromium':
        await this.configureChromium(page);
        break;
      case 'firefox':
        await this.configureFirefox(page);
        break;
      case 'webkit':
        await this.configureWebKit(page);
        break;
    }
  }

  /**
   * Configure Chromium browser
   */
  async configureChromium(page) {
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Configure permissions
    const context = page.context();
    await context.grantPermissions(['geolocation', 'notifications']);
    
    // Set locale
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
    });
  }

  /**
   * Configure Firefox browser
   */
  async configureFirefox(page) {
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0');
    
    // Firefox-specific settings
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
    });
  }

  /**
   * Configure WebKit (Safari) browser
   */
  async configureWebKit(page) {
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15');
    
    // Safari-specific settings
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
    });
  }

  /**
   * Clean up browser-specific resources
   */
  async cleanupBrowser(page, browserName) {
    // Clear cookies
    const context = page.context();
    await context.clearCookies();
    
    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear any browser-specific state
    await page.evaluate(() => {
      // Clear any global state
      window.performance.clearResourceTimings();
    });
  }

  /**
   * Run cross-browser performance test
   */
  async runPerformanceTest(testName, testFunction) {
    console.log(`⚡ Running cross-browser performance test: ${testName}`);
    
    return this.createCrossBrowserTest(`${testName} Performance`, async (page, browserName) => {
      const performanceMetrics = {
        browser: browserName,
        testName,
        metrics: {},
        screenshots: []
      };

      // Start performance monitoring
      await page.evaluateOnNewDocument(() => {
        window.performanceMetrics = {
          navigationStart: performance.timing.navigationStart,
          marks: [],
          measures: []
        };
      });

      // Capture before screenshot
      const beforeScreenshot = await page.screenshot({
        path: `test-results/cross-browser/${testName}-${browserName}-before.png`,
        fullPage: true
      });
      performanceMetrics.screenshots.push({ type: 'before', path: beforeScreenshot });

      // Run the test function
      const result = await testFunction(page, browserName);

      // Capture after screenshot
      const afterScreenshot = await page.screenshot({
        path: `test-results/cross-browser/${testName}-${browserName}-after.png`,
        fullPage: true
      });
      performanceMetrics.screenshots.push({ type: 'after', path: afterScreenshot });

      // Collect performance metrics
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
          navigationType: navigation?.type || 'unknown',
          redirectCount: performance.navigation.redirectCount,
          transferSize: navigation?.transferSize || 0,
          encodedBodySize: navigation?.encodedBodySize || 0,
          decodedBodySize: navigation?.decodedBodySize || 0
        };
      });

      performanceMetrics.metrics = metrics;
      
      console.log(`📊 ${browserName} Performance Metrics:`);
      console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`   Load Complete: ${metrics.loadComplete}ms`);
      console.log(`   First Paint: ${metrics.firstPaint}ms`);
      console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint}ms`);

      return {
        ...result,
        performanceMetrics
      };
    });
  }

  /**
   * Run cross-browser visual regression test
   */
  async runVisualRegressionTest(testName, testFunction, visualRegression) {
    console.log(`👁️ Running cross-browser visual regression test: ${testName}`);
    
    return this.createCrossBrowserTest(`${testName} Visual Regression`, async (page, browserName) => {
      // Generate browser-specific baseline
      const baselineStep = `${testName}-${browserName}`;
      await visualRegression.generateBaseline(baselineStep, 'initial');
      
      // Run test function
      const result = await testFunction(page, browserName);
      
      // Compare with baseline
      const comparison = await visualRegression.compareWithBaseline(baselineStep, 'final');
      
      if (!comparison.passed) {
        console.log(`❌ ${browserName} visual regression FAILED`);
        console.log(`   Difference: ${(comparison.difference * 100).toFixed(2)}%`);
      } else {
        console.log(`✅ ${browserName} visual regression PASSED`);
      }
      
      return {
        ...result,
        visualRegression: comparison
      };
    });
  }

  /**
   * Generate cross-browser test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const reportPath = 'test-results/cross-browser-report.json';
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Cross-browser report generated: ${reportPath}`);
    return report;
  }

  /**
   * Generate test summary
   */
  generateSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const browserStats = {};
    this.browsers.forEach(browser => {
      const browserResults = this.testResults.filter(r => r.browser === browser);
      browserStats[browser] = {
        total: browserResults.length,
        passed: browserResults.filter(r => r.passed).length,
        failed: browserResults.filter(r => !r.passed).length,
        averageDuration: browserResults.length > 0 
          ? Math.round(browserResults.reduce((sum, r) => sum + r.duration, 0) / browserResults.length)
          : 0
      };
    });

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + '%' : '0%',
      averageDuration: totalTests > 0 
        ? Math.round(this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests)
        : 0,
      browsers: browserStats
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateSummary();
    
    // Browser-specific recommendations
    Object.entries(summary.browsers).forEach(([browser, stats]) => {
      if (stats.failed > 0) {
        const failureRate = (stats.failed / stats.total * 100).toFixed(2);
        recommendations.push({
          type: 'browser',
          browser,
          priority: failureRate > 50 ? 'high' : 'medium',
          message: `${browser} has ${failureRate}% failure rate (${stats.failed}/${stats.total} tests failed)`,
          action: 'Investigate browser-specific issues'
        });
      }
      
      if (stats.averageDuration > 10000) {
        recommendations.push({
          type: 'performance',
          browser,
          priority: 'medium',
          message: `${browser} average test duration is ${stats.averageDuration}ms (consider optimization)`,
          action: 'Review test performance for ' + browser
        });
      }
    });

    // Overall recommendations
    if (summary.passRate < 80) {
      recommendations.push({
        type: 'overall',
        priority: 'high',
        message: `Overall pass rate is ${summary.passRate} (target: >80%)`,
        action: 'Review failed tests and fix cross-browser compatibility issues'
      });
    }

    return recommendations;
  }

  /**
   * Reset test results
   */
  resetResults() {
    this.testResults = [];
    console.log('🔄 Cross-browser test results reset');
  }

  /**
   * Get browser compatibility matrix
   */
  getCompatibilityMatrix() {
    const matrix = {};
    
    this.testResults.forEach(result => {
      if (!matrix[result.testName]) {
        matrix[result.testName] = {};
      }
      
      matrix[result.testName][result.browser] = {
        passed: result.passed,
        duration: result.duration,
        error: result.error
      };
    });

    return matrix;
  }

  /**
   * Export test results for CI/CD integration
   */
  exportForCI() {
    const summary = this.generateSummary();
    
    return {
      summary,
      passed: summary.passed >= Math.ceil(summary.total * 0.8), // 80% pass rate required
      results: this.testResults,
      timestamp: new Date().toISOString()
    };
  }
}
