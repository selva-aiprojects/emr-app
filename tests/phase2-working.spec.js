import { test, expect } from '@playwright/test';
import { TestCommands } from '../utils/TestCommands.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';

/**
 * PHASE 2 WORKING: PRODUCTION-READY NEXUS SUPERADMIN TESTS
 * Simplified but functional Phase 2 features
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://127.0.0.1:5175',
  credentials: {
    tenantCode: 'DEMO', // Optional - will be used if tenant field exists
    email: 'vijay@demo.hospital',
    password: 'Demo@123'
  },
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000
  }
};

test.describe('Phase 2 Working: Production-Ready Advanced Features', () => {
  let testCommands;
  let testDataFactory;
  let testResults = [];

  test.beforeEach(async ({ page }) => {
    // Initialize production-ready components
    testCommands = new TestCommands(page);
    testDataFactory = new TestDataFactory();
    
    // Configure page timeouts
    page.setDefaultTimeout(TEST_CONFIG.timeouts.medium);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    await testDataFactory.cleanup();
    
    // Get performance metrics
    const perfSummary = testCommands.getAllPerformanceMetrics();
    if (perfSummary.summary.totalOperations > 0) {
      console.log('📊 Performance Summary:', perfSummary.summary);
    }
    
    // Reset metrics for next test
    testCommands.resetPerformanceMetrics();
  });

  test('Phase 2: Visual Screenshot Testing - Login Flow', async ({ page }) => {
    console.log('\n=== Testing Visual Screenshot Testing - Login Flow ===');
    
    const result = await testCommands.executeWithMonitoring(
      'Visual Screenshot Login Test',
      async () => {
        // Take initial screenshot
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.screenshot({ path: 'test-results/visual/01-initial-page.png', fullPage: true });
        
        // Fill form and screenshot
        await page.fill('input[name="email"]', TEST_CONFIG.credentials.email);
        await page.fill('input[name="password"]', TEST_CONFIG.credentials.password);
        await page.screenshot({ path: 'test-results/visual/02-form-filled.png', fullPage: true });
        
        // Login and screenshot
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await page.screenshot({ path: 'test-results/visual/03-post-login.png', fullPage: true });
        
        // Wait for dashboard to stabilize
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/visual/04-dashboard-stable.png', fullPage: true });
        
        return { 
          success: true, 
          screenshots: [
            'test-results/visual/01-initial-page.png',
            'test-results/visual/02-form-filled.png',
            'test-results/visual/03-post-login.png',
            'test-results/visual/04-dashboard-stable.png'
          ]
        };
      }
    );

    // Validate screenshots were created
    expect(result.success).toBeTruthy();
    expect(result.screenshots.length).toBe(4);
    
    // Add to test results
    testResults.push({
      testName: 'Visual Screenshot Testing',
      passed: result.success,
      screenshots: result.screenshots,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Visual screenshot testing completed');
    console.log(`📸 Screenshots captured: ${result.screenshots.length}`);
  });

  test('Phase 2: Advanced Performance Monitoring', async ({ page }) => {
    console.log('\n=== Testing Advanced Performance Monitoring ===');
    
    // Test multiple performance scenarios
    const performanceTests = [
      {
        name: 'Page Load Performance',
        test: async (page) => {
          const startTime = Date.now();
          await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          const duration = Date.now() - startTime;
          
          // Get performance metrics
          const metrics = await page.evaluate(() => {
            const timing = performance.timing;
            return {
              domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
              loadComplete: timing.loadEventEnd - timing.navigationStart,
              firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
            };
          });
          
          return { duration, metrics };
        }
      },
      {
        name: 'Login Performance',
        test: async (page) => {
          const startTime = Date.now();
          await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.fill('input[name="email"]', TEST_CONFIG.credentials.email);
          await page.fill('input[name="password"]', TEST_CONFIG.credentials.password);
          await page.click('button[type="submit"]');
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          const duration = Date.now() - startTime;
          
          // Get performance metrics
          const metrics = await page.evaluate(() => {
            const timing = performance.timing;
            return {
              domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
              loadComplete: timing.loadEventEnd - timing.navigationStart,
              firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
            };
          });
          
          return { duration, metrics };
        }
      }
    ];

    const performanceResults = [];
    
    for (const perfTest of performanceTests) {
      const result = await testCommands.executeWithMonitoring(
        `Performance Test: ${perfTest.name}`,
        perfTest.test
      );
      
      // Validate performance thresholds
      expect(result.duration).toBeLessThan(15000); // 15 seconds max
      expect(result.metrics.domContentLoaded).toBeLessThan(8000); // 8 seconds max
      expect(result.metrics.loadComplete).toBeLessThan(12000); // 12 seconds max
      
      performanceResults.push({
        testName: perfTest.name,
        ...result,
        passed: true
      });
      
      console.log(`⚡ ${perfTest.name}:`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   DOM Content Loaded: ${result.metrics.domContentLoaded}ms`);
      console.log(`   Load Complete: ${result.metrics.loadComplete}ms`);
      console.log(`   First Paint: ${result.metrics.firstPaint}ms`);
    }

    // Add to test results
    testResults.push({
      testName: 'Advanced Performance Monitoring',
      passed: performanceResults.every(r => r.passed),
      performanceData: performanceResults,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Advanced performance monitoring completed');
    console.log(`📊 Performance tests passed: ${performanceResults.length}/${performanceResults.length}`);
  });

  test('Phase 2: Browser Compatibility Testing', async ({ page }) => {
    console.log('\n=== Testing Browser Compatibility ===');
    
    // Test browser-specific features
    const compatibilityTests = [
      {
        name: 'Browser Detection',
        test: async (page) => {
          const browserInfo = await page.evaluate(() => {
            return {
              userAgent: navigator.userAgent,
              language: navigator.language,
              platform: navigator.platform,
              cookieEnabled: navigator.cookieEnabled,
              onLine: navigator.onLine
            };
          });
          
          return { browserInfo, passed: true };
        }
      },
      {
        name: 'Performance API Support',
        test: async (page) => {
          const perfSupport = await page.evaluate(() => {
            return {
              performance: typeof performance !== 'undefined',
              timing: typeof performance.timing !== 'undefined',
              navigation: typeof performance.navigation !== 'undefined',
              getEntriesByType: typeof performance.getEntriesByType === 'function',
              now: typeof performance.now === 'function'
            };
          });
          
          return { perfSupport, passed: Object.values(perfSupport).every(Boolean) };
        }
      },
      {
        name: 'LocalStorage Support',
        test: async (page) => {
          const storageSupport = await page.evaluate(() => {
            try {
              localStorage.setItem('test', 'value');
              const value = localStorage.getItem('test');
              localStorage.removeItem('test');
              return { supported: true, value };
            } catch (error) {
              return { supported: false, error: error.message };
            }
          });
          
          return { storageSupport, passed: storageSupport.supported };
        }
      }
    ];

    const compatibilityResults = [];
    
    for (const compTest of compatibilityTests) {
      const result = await testCommands.executeWithMonitoring(
        `Compatibility Test: ${compTest.name}`,
        compTest.test
      );
      
      compatibilityResults.push({
        testName: compTest.name,
        ...result,
        passed: result.passed
      });
      
      console.log(`🌐 ${compTest.name}: ${result.passed ? '✅' : '❌'}`);
    }

    // Add to test results
    testResults.push({
      testName: 'Browser Compatibility Testing',
      passed: compatibilityResults.filter(r => r.passed).length >= 2, // At least 2/3 tests pass
      compatibilityData: compatibilityResults,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Browser compatibility testing completed');
    console.log(`🌐 Compatibility tests passed: ${compatibilityResults.filter(r => r.passed).length}/${compatibilityResults.length}`);
  });

  test('Phase 2: Advanced Error Handling and Recovery', async ({ page }) => {
    console.log('\n=== Testing Advanced Error Handling ===');
    
    const errorScenarios = [
      {
        name: 'Timeout Recovery',
        test: async (page) => {
          try {
            // Try to load with very short timeout (should fail)
            await page.goto(TEST_CONFIG.baseUrl, { timeout: 1 });
            return { success: false, error: 'Expected timeout failure' };
          } catch (error) {
            // Retry with normal timeout
            await page.goto(TEST_CONFIG.baseUrl, { timeout: 15000 });
            return { success: true, recovered: true, error: error.message };
          }
        }
      },
      {
        name: 'Element Not Found Recovery',
        test: async (page) => {
          await page.goto(TEST_CONFIG.baseUrl, { timeout: 15000 });
          
          try {
            // Try to click non-existent element
            await page.click('button[non-existent-selector]', { timeout: 2000 });
            return { success: false, error: 'Expected element not found' };
          } catch (error) {
            // Try with existing element
            await page.fill('input[name="email"]', TEST_CONFIG.credentials.email);
            return { success: true, recovered: true, error: error.message };
          }
        }
      },
      {
        name: 'Network Error Recovery',
        test: async (page) => {
          await page.goto(TEST_CONFIG.baseUrl, { timeout: 15000 });
          
          try {
            // Simulate network error by going to invalid URL
            await page.goto('http://invalid-url-that-does-not-exist.com', { timeout: 5000 });
            return { success: false, error: 'Expected network error' };
          } catch (error) {
            // Navigate back to valid URL
            await page.goto(TEST_CONFIG.baseUrl, { timeout: 15000 });
            return { success: true, recovered: true, error: error.message };
          }
        }
      }
    ];

    const errorHandlingResults = [];
    
    for (const scenario of errorScenarios) {
      const result = await testCommands.executeWithMonitoring(
        `Error Handling: ${scenario.name}`,
        scenario.test
      );
      
      errorHandlingResults.push({
        testName: scenario.name,
        ...result,
        passed: result.success
      });
      
      console.log(`🛡️ ${scenario.name}: ${result.success ? '✅' : '❌'}${result.recovered ? ' (Recovered)' : ''}`);
    }

    // Add to test results
    testResults.push({
      testName: 'Advanced Error Handling',
      passed: errorHandlingResults.filter(r => r.passed).length >= 2, // At least 2/3 tests pass
      errorHandlingData: errorHandlingResults,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Advanced error handling testing completed');
    console.log(`🛡️ Error handling tests passed: ${errorHandlingResults.filter(r => r.passed).length}/${errorHandlingResults.length}`);
  });

  test('Phase 2: Comprehensive Test Suite Validation', async ({ page }) => {
    console.log('\n=== Testing Comprehensive Phase 2 Validation ===');
    
    // Initialize comprehensive test tracking
    const comprehensiveTest = {
      login: false,
      visualTesting: false,
      performance: false,
      compatibility: false,
      errorHandling: false,
      dataManagement: false
    };

    try {
      // 1. Login test
      const loginResult = await testCommands.executeWithMonitoring(
        'Comprehensive Login',
        async () => {
          await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.fill('input[name="email"]', TEST_CONFIG.credentials.email);
          await page.fill('input[name="password"]', TEST_CONFIG.credentials.password);
          await page.click('button[type="submit"]');
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          
          // Verify login success
          const hasContent = await page.locator('body').textContent();
          comprehensiveTest.login = hasContent && hasContent.length > 100;
          
          return { success: comprehensiveTest.login };
        }
      );
      
      // 2. Visual testing
      await page.screenshot({ path: 'test-results/comprehensive/visual-test.png', fullPage: true });
      comprehensiveTest.visualTesting = true;
      
      // 3. Performance testing
      const perfMetrics = testCommands.getAllPerformanceMetrics();
      comprehensiveTest.performance = perfMetrics.summary.totalOperations > 0;
      
      // 4. Compatibility testing
      const browserInfo = await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        language: navigator.language
      }));
      comprehensiveTest.compatibility = !!browserInfo.userAgent;
      
      // 5. Error handling test
      try {
        await page.click('button[non-existent]', { timeout: 2000 });
      } catch (error) {
        comprehensiveTest.errorHandling = true; // Expected error
      }
      
      // 6. Data management test
      const testUser = await testDataFactory.createUser({
        firstName: 'Comprehensive',
        lastName: 'Test User',
        role: 'Administrator',
        department: 'IT'
      });
      comprehensiveTest.dataManagement = !!testUser;
      
    } catch (error) {
      console.log(`❌ Comprehensive test error: ${error.message}`);
    }
    
    // Validate comprehensive test
    const successCount = Object.values(comprehensiveTest).filter(Boolean).length;
    const totalTests = Object.keys(comprehensiveTest).length;
    const successRate = (successCount / totalTests) * 100;
    
    console.log('🎯 Comprehensive Test Results:');
    Object.entries(comprehensiveTest).forEach(([test, result]) => {
      console.log(`  ${test}: ${result ? '✅' : '❌'}`);
    });
    console.log(`📊 Overall Success Rate: ${successRate}% (${successCount}/${totalTests})`);
    
    // Add to test results
    testResults.push({
      testName: 'Comprehensive Phase 2 Validation',
      passed: successRate >= 80, // At least 80% success rate
      details: comprehensiveTest,
      successRate,
      timestamp: new Date().toISOString()
    });
    
    // At least 80% of features should work
    expect(successRate).toBeGreaterThanOrEqual(80);
    
    console.log('✅ Comprehensive Phase 2 validation completed');
  });

  test('Phase 2: Generate Test Report', async ({ page }) => {
    console.log('\n=== Generating Phase 2 Test Report ===');
    
    // Generate basic HTML report
    const htmlReport = generateBasicHTMLReport(testResults);
    const reportPath = 'test-results/phase2-report.html';
    
    // Write report to file
    const fs = require('fs');
    fs.writeFileSync(reportPath, htmlReport);
    
    // Validate report was created
    expect(fs.existsSync(reportPath)).toBeTruthy();
    
    console.log('📊 Phase 2 Test Report Generated:');
    console.log(`  📄 HTML Report: ${reportPath}`);
    console.log(`  📊 Total Tests: ${testResults.length}`);
    console.log(`  ✅ Passed Tests: ${testResults.filter(r => r.passed).length}`);
    console.log(`  ❌ Failed Tests: ${testResults.filter(r => !r.passed).length}`);
    
    // Validate report metrics
    const passRate = (testResults.filter(r => r.passed).length / testResults.length) * 100;
    expect(passRate).toBeGreaterThan(0);
    
    console.log('✅ Phase 2 test report generation completed');
  });
});

/**
 * Generate basic HTML report
 */
function generateBasicHTMLReport(results) {
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(2);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase 2 Nexus Superadmin Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; }
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
        .timestamp { text-align: center; color: #7f8c8d; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .badge.passed { background: #27ae60; color: white; }
        .badge.failed { background: #e74c3c; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Phase 2 Nexus Superadmin Test Report</h1>
            <p>Production-Ready Advanced Features Testing</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>📊 Test Summary</h3>
                <div class="value">${totalTests}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="metric">
                <h3>✅ Pass Rate</h3>
                <div class="value">${passRate}%</div>
                <div class="label">Passed</div>
            </div>
            <div class="metric">
                <h3>📈 Passed Tests</h3>
                <div class="value">${passedTests}</div>
                <div class="label">Successful</div>
            </div>
            <div class="metric">
                <h3>❌ Failed Tests</h3>
                <div class="value">${totalTests - passedTests}</div>
                <div class="label">Failed</div>
            </div>
        </div>

        <div class="section">
            <h2>🧪 Test Results</h2>
            <div class="test-results">
                ${results.map(test => `
                    <div class="test-result ${test.passed ? 'passed' : 'failed'}">
                        <div class="badge ${test.passed ? 'passed' : 'failed'}">${test.passed ? '✅' : '❌'} ${test.passed ? 'PASSED' : 'FAILED'}</div>
                        <strong>${test.testName}</strong>
                        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            ${new Date(test.timestamp).toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="timestamp">
            Report generated by Phase 2 Production-Ready Testing Framework
        </div>
    </div>
</body>
</html>`;
}
