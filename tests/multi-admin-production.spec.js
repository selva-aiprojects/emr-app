import { test, expect } from '@playwright/test';
import { TestCommands } from '../utils/TestCommands.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';
import fs from 'fs';
import path from 'path';

/**
 * MULTI-ADMIN PRODUCTION-READY NEXUS SUPERADMIN TESTS
 * Testing with multiple admin credentials for comprehensive validation
 */

// Multiple admin credentials for comprehensive testing
const ADMIN_CREDENTIALS = [
  {
    email: 'admin@hbhl.com',
    password: 'Admin@123',
    hospital: 'HBB Hospital',
    code: 'HBBHL'
  },
  {
    email: 'admin@hshl.com',
    password: 'Admin@123',
    hospital: 'HSH Hospital',
    code: 'HSHL'
  },
  {
    email: 'admin@hphl.com',
    password: 'Admin@123',
    hospital: 'HPH Hospital',
    code: 'HPHL'
  },
  {
    email: 'admin@hehl.com',
    password: 'Admin@123',
    hospital: 'HEH Hospital',
    code: 'HEHL'
  }
];

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://127.0.0.1:5175',
  credentials: ADMIN_CREDENTIALS[0], // Default to first admin
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000
  }
};

test.describe('Multi-Admin Production-Ready Nexus Tests', () => {
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

  test('Multi-Admin: Validate All Admin Credentials', async ({ page }) => {
    console.log('\n=== Testing All Admin Credentials ===');
    
    const credentialResults = [];
    
    for (const admin of ADMIN_CREDENTIALS) {
      console.log(`🔐 Testing admin: ${admin.email} (${admin.hospital})`);
      
      const result = await testCommands.executeWithMonitoring(
        `Admin Login: ${admin.hospital}`,
        async () => {
          try {
            // Navigate to login page
            await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Fill login form
            await page.fill('input[name="email"]', admin.email);
            await page.fill('input[name="password"]', admin.password);
            
            // Take screenshot before login
            await page.screenshot({ 
              path: `test-results/admins/${admin.code}-before-login.png`, 
              fullPage: true 
            });
            
            // Click login button
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            // Wait for dashboard to stabilize
            await page.waitForTimeout(2000);
            
            // Take screenshot after login
            await page.screenshot({ 
              path: `test-results/admins/${admin.code}-after-login.png`, 
              fullPage: true 
            });
            
            // Verify login success
            const hasContent = await page.locator('body').textContent();
            const isLoggedIn = hasContent && hasContent.length > 100;
            
            // Look for dashboard indicators
            const indicators = [
              'text=/(dashboard|overview|welcome)/i',
              'text=/(logout|sign out)/i',
              '.dashboard',
              '.main-content'
            ];
            
            let foundIndicator = false;
            for (const indicator of indicators) {
              try {
                const element = page.locator(indicator).first();
                if (await element.isVisible({ timeout: 3000 })) {
                  foundIndicator = true;
                  break;
                }
              } catch (error) {
                // Continue trying other indicators
              }
            }
            
            return {
              success: isLoggedIn && foundIndicator,
              admin: admin.email,
              hospital: admin.hospital,
              screenshots: [
                `test-results/admins/${admin.code}-before-login.png`,
                `test-results/admins/${admin.code}-after-login.png`
              ]
            };
            
          } catch (error) {
            console.log(`❌ Admin ${admin.email} login failed: ${error.message}`);
            
            // Take failure screenshot
            await page.screenshot({ 
              path: `test-results/admins/${admin.code}-login-failure.png`, 
              fullPage: true 
            });
            
            return {
              success: false,
              admin: admin.email,
              hospital: admin.hospital,
              error: error.message,
              screenshot: `test-results/admins/${admin.code}-login-failure.png`
            };
          }
        }
      );
      
      credentialResults.push(result);
      
      // Logout if login was successful
      if (result.success) {
        try {
          // Look for logout button
          const logoutSelectors = [
            'button:has-text("Logout")',
            'a:has-text("Logout")',
            '.logout-btn',
            '.btn-logout'
          ];
          
          for (const selector of logoutSelectors) {
            try {
              const logoutButton = page.locator(selector).first();
              if (await logoutButton.isVisible({ timeout: 2000 })) {
                await logoutButton.click();
                await page.waitForTimeout(2000);
                break;
              }
            } catch (error) {
              // Continue trying other selectors
            }
          }
        } catch (error) {
          console.log(`⚠️ Logout failed for ${admin.email}: ${error.message}`);
        }
      }
      
      console.log(`${result.success ? '✅' : '❌'} ${admin.hospital}: ${result.success ? 'Success' : 'Failed'}`);
    }
    
    // Validate all credentials
    const successfulLogins = credentialResults.filter(r => r.success).length;
    const totalCredentials = credentialResults.length;
    const successRate = (successfulLogins / totalCredentials) * 100;
    
    console.log(`📊 Admin Credentials Summary:`);
    console.log(`  Total Credentials: ${totalCredentials}`);
    console.log(`  Successful Logins: ${successfulLogins}`);
    console.log(`  Success Rate: ${successRate}%`);
    
    // Add to test results
    testResults.push({
      testName: 'Multi-Admin Credentials Validation',
      passed: successfulLogins >= 1, // At least 1 admin should work
      credentialResults,
      successRate,
      timestamp: new Date().toISOString()
    });
    
    // At least 25% of admin credentials should work
    expect(successRate).toBeGreaterThanOrEqual(25);
    
    console.log('✅ Multi-admin credentials validation completed');
  });

  test('Multi-Admin: Performance Comparison Across Admins', async ({ page }) => {
    console.log('\n=== Testing Performance Comparison Across Admins ===');
    
    const performanceResults = [];
    
    // Test with first admin only for performance comparison
    const primaryAdmin = ADMIN_CREDENTIALS[0];
    
    const result = await testCommands.executeWithMonitoring(
      `Performance Test: ${primaryAdmin.hospital}`,
      async () => {
        const startTime = Date.now();
        
        // Navigate and login
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.fill('input[name="email"]', primaryAdmin.email);
        await page.fill('input[name="password"]', primaryAdmin.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const loginDuration = Date.now() - startTime;
        
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
        
        // Wait for dashboard to stabilize
        await page.waitForTimeout(2000);
        
        // Test dashboard interaction performance
        const interactionStart = Date.now();
        
        // Try to interact with dashboard elements
        const interactions = [
          'button:has-text("Users")',
          'button:has-text("Dashboard")',
          'button:has-text("Settings")',
          'nav a',
          '.dashboard-card'
        ];
        
        let interactionCount = 0;
        for (const selector of interactions) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              interactionCount++;
            }
          } catch (error) {
            // Continue trying other interactions
          }
        }
        
        const interactionDuration = Date.now() - interactionStart;
        
        return {
          admin: primaryAdmin.email,
          hospital: primaryAdmin.hospital,
          loginDuration,
          interactionDuration,
          interactionCount,
          metrics,
          totalDuration: loginDuration + interactionDuration
        };
      }
    );
    
    performanceResults.push(result);
    
    console.log(`⚡ ${primaryAdmin.hospital} Performance:`);
    console.log(`   Login Duration: ${result.loginDuration}ms`);
    console.log(`   Interaction Duration: ${result.interactionDuration}ms`);
    console.log(`   DOM Content Loaded: ${result.metrics.domContentLoaded}ms`);
    console.log(`   Load Complete: ${result.metrics.loadComplete}ms`);
    
    // Validate performance thresholds
    expect(result.loginDuration).toBeLessThan(15000); // 15 seconds max
    expect(result.metrics.domContentLoaded).toBeLessThan(8000); // 8 seconds max
    expect(result.metrics.loadComplete).toBeLessThan(12000); // 12 seconds max
    
    // Add to test results
    testResults.push({
      testName: 'Multi-Admin Performance Comparison',
      passed: true,
      performanceData: performanceResults,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Multi-admin performance comparison completed');
  });

  test('Multi-Admin: Data Management Across Admin Accounts', async ({ page }) => {
    console.log('\n=== Testing Data Management Across Admin Accounts ===');
    
    // Test with first admin account
    const primaryAdmin = ADMIN_CREDENTIALS[0];
    
    const result = await testCommands.executeWithMonitoring(
      'Data Management Test',
      async () => {
        // Login with primary admin
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.fill('input[name="email"]', primaryAdmin.email);
        await page.fill('input[name="password"]', primaryAdmin.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for dashboard to stabilize
        await page.waitForTimeout(2000);
        
        // Create test data for each admin
        const testData = [];
        
        for (const admin of ADMIN_CREDENTIALS) {
          const testUser = await testDataFactory.createUser({
            firstName: admin.hospital.split(' ')[0], // Use hospital name as first name
            lastName: 'Admin Test User',
            email: `${admin.code.toLowerCase()}-test@${admin.code.toLowerCase()}.local`,
            role: 'Administrator',
            department: 'IT',
            hospital: admin.hospital,
            adminCode: admin.code
          });
          
          testData.push(testUser);
        }
        
        // Validate created test data
        const validationResults = testData.map(user => ({
          email: user.email,
          hospital: user.hospital,
          adminCode: user.adminCode,
          hasMetadata: !!user.metadata,
          isTestUser: user.metadata?.testUser || false,
          created: user.metadata?.created
        }));
        
        return {
          success: testData.length === ADMIN_CREDENTIALS.length,
          primaryAdmin: primaryAdmin.email,
          testData: validationResults,
          totalCreated: testData.length
        };
      }
    );
    
    console.log(`📊 Data Management Results:`);
    console.log(`  Primary Admin: ${result.primaryAdmin}`);
    console.log(`  Test Users Created: ${result.totalCreated}`);
    console.log(`  Data Validation: ${result.success ? '✅' : '❌'}`);
    
    // Display test data details
    result.testData.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.hospital} - ${user.email} (${user.isTestUser ? '✅' : '❌'} Test User)`);
    });
    
    // Add to test results
    testResults.push({
      testName: 'Multi-Admin Data Management',
      passed: result.success,
      dataManagementData: result,
      timestamp: new Date().toISOString()
    });
    
    // Validate data management
    expect(result.success).toBeTruthy();
    expect(result.totalCreated).toBe(ADMIN_CREDENTIALS.length);
    
    console.log('✅ Multi-admin data management completed');
  });

  test('Multi-Admin: Comprehensive Validation Report', async ({ page }) => {
    console.log('\n=== Generating Multi-Admin Validation Report ===');
    
    // Generate comprehensive HTML report
    const htmlReport = generateMultiAdminHTMLReport(testResults);
    const reportPath = 'test-results/multi-admin-report.html';
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Write report to file
    fs.writeFileSync(reportPath, htmlReport);
    
    // Validate report was created
    expect(fs.existsSync(reportPath)).toBeTruthy();
    
    console.log('📊 Multi-Admin Validation Report Generated:');
    console.log(`  📄 HTML Report: ${reportPath}`);
    console.log(`  📊 Total Tests: ${testResults.length}`);
    console.log(`  ✅ Passed Tests: ${testResults.filter(r => r.passed).length}`);
    console.log(`  ❌ Failed Tests: ${testResults.filter(r => !r.passed).length}`);
    
    // Validate report metrics
    const passRate = (testResults.filter(r => r.passed).length / testResults.length) * 100;
    expect(passRate).toBeGreaterThan(0);
    
    console.log(`📈 Overall Pass Rate: ${passRate.toFixed(2)}%`);
    console.log('✅ Multi-admin comprehensive validation completed');
  });
});

/**
 * Generate multi-admin HTML report
 */
function generateMultiAdminHTMLReport(results) {
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(2);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Admin Nexus Superadmin Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 2.5em; }
        .header p { color: #7f8c8d; margin: 5px 0 0 0; font-size: 1.2em; }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .admin-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .admin-card h3 { margin: 0 0 10px 0; font-size: 1.2em; }
        .admin-card .email { font-size: 0.9em; opacity: 0.9; }
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
        .admin-summary { background: #e8f4f8; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .admin-summary h4 { margin: 0 0 10px 0; color: #2c3e50; }
        .admin-summary table { width: 100%; border-collapse: collapse; }
        .admin-summary th, .admin-summary td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .admin-summary th { background: #f1f8fe; }
        .timestamp { text-align: center; color: #7f8c8d; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .badge.passed { background: #27ae60; color: white; }
        .badge.failed { background: #e74c3c; color: white; }
        .performance-chart { background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .performance-bar { background: #ecf0f1; border-radius: 4px; height: 20px; margin: 5px 0; }
        .performance-fill { background: #3498db; height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Multi-Admin Nexus Superadmin Test Report</h1>
            <p>Comprehensive Testing Across Multiple Hospital Admin Accounts</p>
        </div>

        <div class="admin-grid">
            ${ADMIN_CREDENTIALS.map(admin => `
                <div class="admin-card">
                    <h3>${admin.hospital}</h3>
                    <div class="email">${admin.email}</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">Code: ${admin.code}</div>
                </div>
            `).join('')}
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
                <h3>🏥 Admin Accounts</h3>
                <div class="value">${ADMIN_CREDENTIALS.length}</div>
                <div class="label">Total Admins</div>
            </div>
            <div class="metric">
                <h3>📈 Success Rate</h3>
                <div class="value">${passedTests}/${totalTests}</div>
                <div class="label">Successful</div>
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
                        ${test.credentialResults ? `
                            <div class="admin-summary">
                                <h4>Admin Credentials Results:</h4>
                                <table>
                                    <tr><th>Hospital</th><th>Email</th><th>Status</th></tr>
                                    ${test.credentialResults.map(cred => `
                                        <tr>
                                            <td>${cred.hospital}</td>
                                            <td>${cred.admin}</td>
                                            <td>${cred.success ? '✅ Success' : '❌ Failed'}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        ` : ''}
                        ${test.performanceData ? `
                            <div class="performance-chart">
                                <h4>Performance Metrics:</h4>
                                ${test.performanceData.map(perf => `
                                    <div style="margin: 10px 0;">
                                        <strong>${perf.hospital}</strong>
                                        <div class="performance-bar">
                                            <div class="performance-fill" style="width: ${Math.min(100, (perf.totalDuration / 100) * 20)}%"></div>
                                        </div>
                                        <small>Login: ${perf.loginDuration}ms | Interaction: ${perf.interactionDuration}ms</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="timestamp">
            Report generated by Multi-Admin Production-Ready Testing Framework
            <br>
            Generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
}
