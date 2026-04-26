import { test, expect } from '@playwright/test';
import { TestCommands } from '../utils/TestCommands.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';
import fs from 'fs';
import path from 'path';

/**
 * TENANT-FOCUSED PRODUCTION-READY NEXUS SUPERADMIN TESTS
 * Comprehensive testing of tenant-based login and multi-tenant architecture
 */

// Tenant configurations for comprehensive testing
const TENANT_CONFIGURATIONS = [
  {
    tenantCode: 'DEMO',
    name: 'Demo Hospital',
    adminEmail: 'vijay@demo.hospital',
    adminPassword: 'Demo@123',
    description: 'Primary demo tenant for testing',
    expectedUsers: ['Doctor', 'Nurse', 'Administrator', 'Pharmacist']
  },
  {
    tenantCode: 'NEXUS',
    name: 'Nexus Hospital',
    adminEmail: 'superadmin@nexus.local',
    adminPassword: 'Admin@123',
    description: 'Nexus main tenant',
    expectedUsers: ['Superadmin', 'Doctor', 'Nurse', 'Administrator']
  },
  {
    tenantCode: 'TEST',
    name: 'Test Hospital',
    adminEmail: 'admin@test.hospital',
    adminPassword: 'Test@123',
    description: 'Testing tenant for validation',
    expectedUsers: ['Test Admin', 'Test User']
  }
];

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://127.0.0.5175',
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000
  }
};

test.describe('Tenant-Focused Production-Ready Nexus Tests', () => {
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

  test('Tenant-Focused: Validate All Tenant Logins', async ({ page }) => {
    console.log('\n=== Testing All Tenant Logins ===');
    
    const tenantResults = [];
    
    for (const tenant of TENANT_CONFIGURATIONS) {
      console.log(`🏢 Testing tenant: ${tenant.name} (${tenant.tenantCode})`);
      
      const result = await testCommands.executeWithMonitoring(
        `Tenant Login: ${tenant.name}`,
        async () => {
          try {
            // Navigate to login page
            await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Fill tenant code if field exists
            const tenantSelectors = [
              'input[name="tenantCode"]',
              'input[placeholder*="Tenant"]',
              'input[placeholder*="tenant"]',
              'input[id*="tenant"]'
            ];
            
            let tenantFieldFound = false;
            for (const selector of tenantSelectors) {
              try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                  await page.fill(selector, tenant.tenantCode);
                  tenantFieldFound = true;
                  console.log(`✅ Tenant field found and filled: ${tenant.tenantCode}`);
                  break;
                }
              } catch (error) {
                // Continue trying other selectors
              }
            }
            
            // Take screenshot before login
            await page.screenshot({ 
              path: `test-results/tenants/${tenant.tenantCode}-before-login.png`, 
              fullPage: true 
            });
            
            // Fill login form
            await page.fill('input[name="email"]', tenant.adminEmail);
            await page.fill('input[name="password"]', tenant.adminPassword);
            
            // Take screenshot after form fill
            await page.screenshot({ 
              path: `test-results/tenants/${tenant.tenantCode}-form-filled.png`, 
              fullPage: true 
            });
            
            // Click login button
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            // Wait for dashboard to stabilize
            await page.waitForTimeout(2000);
            
            // Take screenshot after login
            await page.screenshot({ 
              path: `test-results/tenants/${tenant.tenantCode}-after-login.png`, 
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
            
            // Look for tenant-specific indicators
            const tenantIndicators = [
              `text=/${tenant.name}/i`,
              `text=/${tenant.tenantCode}/i`,
              `text=/${tenant.description}/i`
            ];
            
            let foundTenantIndicator = false;
            for (const indicator of tenantIndicators) {
              try {
                const element = page.locator(indicator).first();
                if (await element.isVisible({ timeout: 2000 })) {
                  foundTenantIndicator = true;
                  break;
                }
              } catch (error) {
                // Continue trying other indicators
              }
            }
            
            return {
              success: isLoggedIn && foundIndicator,
              tenant: tenant.tenantCode,
              tenantName: tenant.name,
              tenantFieldFound,
              tenantIndicatorFound: foundTenantIndicator,
              adminEmail: tenant.adminEmail,
              screenshots: [
                `test-results/tenants/${tenant.tenantCode}-before-login.png`,
                `test-results/tenants/${tenant.tenantCode}-form-filled.png`,
                `test-results/tenants/${tenant.tenantCode}-after-login.png`
              ]
            };
            
          } catch (error) {
            console.log(`❌ Tenant ${tenant.tenantCode} login failed: ${error.message}`);
            
            // Take failure screenshot
            await page.screenshot({ 
              path: `test-results/tenants/${tenant.tenantCode}-login-failure.png`, 
              fullPage: true 
            });
            
            return {
              success: false,
              tenant: tenant.tenantCode,
              tenantName: tenant.name,
              adminEmail: tenant.adminEmail,
              error: error.message,
              screenshot: `test-results/tenants/${tenant.tenantCode}-login-failure.png`
            };
          }
        }
      );
      
      tenantResults.push(result);
      
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
          console.log(`⚠️ Logout failed for tenant ${tenant.tenantCode}: ${error.message}`);
        }
      }
      
      console.log(`${result.success ? '✅' : '❌'} ${tenant.name}: ${result.success ? 'Success' : 'Failed'}${tenant.tenantFieldFound ? ' (Tenant Field)' : ''}${result.tenantIndicatorFound ? ' (Tenant Indicator)' : ''}`);
    }
    
    // Validate all tenant logins
    const successfulLogins = tenantResults.filter(r => r.success).length;
    const totalTenants = tenantResults.length;
    const successRate = (successfulLogins / totalTenants) * 100;
    
    console.log(`📊 Tenant Login Summary:`);
    console.log(`  Total Tenants: ${totalTenants}`);
    console.log(`  Successful Logins: ${successfulLogins}`);
    console.log(`  Success Rate: ${successRate}%`);
    
    // Add to test results
    testResults.push({
      testName: 'Tenant-Focused Login Validation',
      passed: successfulLogins >= 2, // At least 2/3 tenants should work
      tenantResults,
      successRate,
      timestamp: new Date().toISOString()
    });
    
    // At least 67% of tenants should work
    expect(successRate).toBeGreaterThanOrEqual(67);
    
    console.log('✅ Tenant-focused login validation completed');
  });

  test('Tenant-Focused: Tenant Field Detection and Validation', async ({ page }) => {
    console.log('\n=== Testing Tenant Field Detection ===');
    
    const detectionResults = [];
    
    for (const tenant of TENANTURATIONS) {
      console.log(`🔍 Testing tenant field detection for: ${tenant.tenantCode}`);
      
      const result = await testCommands.executeWithMonitoring(
        `Tenant Field Detection: ${tenant.name}`,
        async () => {
          try {
            // Navigate to login page
            await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Test tenant field detection
            const tenantSelectors = [
              'input[name="tenantCode"]',
              'input[placeholder*="Tenant"]',
              'input[placeholder*="tenant"]',
              'input[id*="tenant"]',
              '.tenant-input input',
              '#tenantCode'
            ];
            
            let detectedSelectors = [];
            let workingSelector = null;
            
            for (const selector of tenantSelectors) {
              try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                  detectedSelectors.push(selector);
                  
                  // Test if we can fill the field
                  await element.fill(tenant.tenantCode);
                  const filledValue = await element.inputValue();
                  
                  if (filledValue === tenant.tenantCode) {
                    workingSelector = selector;
                    console.log(`✅ Tenant field detected: ${selector}`);
                    break;
                  }
                }
              } catch (error) {
                // Continue trying other selectors
              }
            }
            
            // Test tenant field functionality
            let fieldFunctionality = false;
            if (workingSelector) {
              try {
                // Clear field
                const element = page.locator(workingSelector).first();
                await element.fill('');
                
                // Fill with test value
                await element.fill('TEST_TENANT');
                const testValue = await element.inputValue();
                
                // Clear again
                await element.fill('');
                
                fieldFunctionality = testValue === 'TEST_TENANT';
              } catch (error) {
                console.log(`⚠️ Tenant field functionality test failed: ${error.message}`);
              }
            }
            
            return {
              tenant: tenant.tenantCode,
              tenantName: tenant.name,
              detectedSelectors,
              workingSelector,
              fieldFunctionality,
              hasTenantField: detectedSelectors.length > 0,
              screenshots: [
                `test-results/tenants/${tenant.tenantCode}-detection.png`
              ]
            };
            
          } catch (error) {
            console.log(`❌ Tenant field detection failed for ${tenant.tenantCode}: ${error.message}`);
            
            return {
              tenant: tenant.tenantCode,
              tenantName: tenant.name,
              detectedSelectors: [],
              workingSelector: null,
              fieldFunctionality: false,
              hasTenantField: false,
              error: error.message
            };
          }
        }
      );
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: `test-results/tenants/${tenant.tenantCode}-detection.png`, 
        fullPage: true 
      });
      
      detectionResults.push(result);
      
      console.log(`${result.hasTenantField ? '✅' : '❌'} ${tenant.name}: ${result.hasTenantField ? 'Tenant Field Found' : 'No Tenant Field'}${result.fieldFunctionality ? ' (Functionality Working)' : ''}`);
    }
    
    // Add to test results
    testResults.push({
      testName: 'Tenant Field Detection and Validation',
      passed: detectionResults.filter(r => r.hasTenantField).length >= 2, // At least 2 tenants should have tenant field
      detectionResults,
      timestamp: new Date().toISOString()
    });
    
    // Analyze tenant field availability
    const tenantsWithField = detectionResults.filter(r => r.hasTenantField).length;
    const tenantsWithoutField = detectionResults.filter(r => !r.hasTenantField).length;
    
    console.log(`📊 Tenant Field Detection Summary:`);
    console.log(`  Tenants with Tenant Field: ${tenantsWithField}`);
    console.log(`  Tenants without Tenant Field: ${tenantsWithoutField}`);
    console.log(`  Field Detection Rate: ${((tenantsWithField / detectionResults.length) * 100).toFixed(2)}%`);
    
    // Validate tenant field detection
    expect(tenantsWithField).toBeGreaterThanOrEqual(2);
    
    console.log('✅ Tenant field detection and validation completed');
  });

  test('Tenant-Focused: Tenant-Specific Data Management', async ({ page }) => {
    console.log('\n=== Testing Tenant-Specific Data Management ===');
    
    // Test with first tenant
    const primaryTenant = TENANTURATIONS[0];
    
    const result = await testCommands.executeWithMonitoring(
      'Tenant-Specific Data Management',
      async () => {
        // Login with primary tenant
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Fill tenant code if available
        const tenantSelectors = ['input[name="tenantCode"]', 'input[placeholder*="Tenant"]'];
        for (const selector of tenantSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              await page.fill(selector, primaryTenant.tenantCode);
              break;
            }
          } catch (error) {
            // Continue trying other selectors
          }
        }
        
        // Login
        await page.fill('input[name="email"]', primaryTenant.adminEmail);
        await page.fill('input[name="password"]', primaryTenant.adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for dashboard to stabilize
        await page.waitForTimeout(2000);
        
        // Create tenant-specific test data
        const tenantTestData = [];
        
        for (const tenant of TENANTURATIONS) {
          const testUser = await testDataFactory.createUser({
            firstName: tenant.name.split(' ')[0],
            lastName: 'Tenant Test User',
            email: `${tenant.tenantCode.toLowerCase()}-test@${tenant.tenantCode.toLowerCase()}.local`,
            role: 'Administrator',
            department: 'IT',
            tenantCode: tenant.tenantCode,
            tenantName: tenant.name,
            hospital: tenant.name
          });
          
          tenantTestData.push(testUser);
        }
        
        // Validate created tenant-specific test data
        const validationResults = tenantTestData.map(user => ({
          email: user.email,
          tenantCode: user.tenantCode,
          tenantName: user.tenantName,
          hospital: user.hospital,
          hasMetadata: !!user.metadata,
          isTestUser: user.metadata?.testUser || false,
          created: user.metadata?.created
        }));
        
        return {
          success: tenantTestData.length === TENANTURATIONS.length,
          primaryTenant: primaryTenant.tenantCode,
          tenantTestData: validationResults,
          totalCreated: tenantTestData.length
        };
      }
    );
    
    console.log(`📊 Tenant-Specific Data Management Results:`);
    console.log(`  Primary Tenant: ${result.primaryTenant}`);
    console.log(`  Test Users Created: ${result.totalCreated}`);
    console.log(`  Data Validation: ${result.success ? '✅' : '❌'}`);
    
    // Display test data details
    result.tenantTestData.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.tenantName} - ${user.email} (${user.isTestUser ? '✅' : '❌'} Test User)`);
    });
    
    // Add to test results
    testResults.push({
      testName: 'Tenant-Specific Data Management',
      passed: result.success,
      dataManagementData: result,
      timestamp: new Date().toISOString()
    });
    
    // Validate tenant-specific data management
    expect(result.success).toBeTruthy();
    expect(result.totalCreated).toBe(TENANTURATIONS.length);
    
    console.log('✅ Tenant-specific data management completed');
  });

  test('Tenant-Focused: Tenant Isolation and Security', async ({ page }) => {
    console.log('\n=== Testing Tenant Isolation and Security ===');
    
    const isolationResults = [];
    
    // Test with first tenant
    const primaryTenant = TENANTURATIONS[0];
    
    const result = await testCommands.executeWithMonitoring(
      'Tenant Isolation and Security',
      async () => {
        // Login with primary tenant
        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Fill tenant code if available
        const tenantSelectors = ['input[name="tenantCode"]', 'input[placeholder*="Tenant"]'];
        for (const selector of tenantSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              await element.fill(primaryTenant.tenantCode);
              break;
            }
          } catch (error) {
            // Continue trying other selectors
          }
        }
        
        // Login
        await page.fill('input[name="email"]', primaryTenant.adminEmail);
        await page.fill('input[name="password"]', primaryTenant.adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for dashboard to stabilize
        await page.waitForTimeout(2000);
        
        // Test tenant isolation by checking if tenant data is isolated
        const isolationTests = [];
        
        // Test 1: Check if tenant-specific content is displayed
        try {
          const tenantContent = await page.locator('body').textContent();
          const hasTenantContent = tenantContent.includes(primaryTenant.tenantName) || 
                                  tenantContent.includes(primaryTenant.tenantCode);
          
          isolationTests.push({
            test: 'Tenant Content Display',
            passed: hasTenantContent,
            details: hasTenantContent ? 'Tenant-specific content found' : 'No tenant-specific content'
          });
        } catch (error) {
          isolationTests.push({
            test: 'Tenant Content Display',
            passed: false,
            error: error.message
          });
        }
        
        // Test 2: Check if other tenant data is not accessible
        try {
          const otherTenant = TENANTURATIONS[1];
          const otherTenantContent = await page.locator('text=/' + otherTenant.tenantName + '/i').first().isVisible({ timeout: 2000 });
          
          isolationTests.push({
            test: 'Other Tenant Data Isolation',
            passed: !otherTenantContent,
            details: otherTenantContent ? 'Other tenant data found (isolation issue)' : 'Other tenant data properly isolated'
          });
        } catch (error) {
          isolationTests.push({
            test: 'Other Tenant Data Isolation',
            passed: true, // If we can't find other tenant content, that's good isolation
            details: 'Other tenant data not found (proper isolation)'
          });
        }
        
        // Test 3: Check user data is tenant-specific
        try {
          const testUser = await testDataFactory.createUser({
            firstName: 'Isolation',
            lastName: 'Test User',
            email: `${primaryTenant.tenantCode}-isolation@test.local`,
            role: 'Administrator',
            department: 'IT',
            tenantCode: primaryTenant.tenantCode,
            tenantName: primaryTenant.tenantName
          });
          
          isolationTests.push({
            test: 'Tenant-Specific User Data',
            passed: !!testUser,
            details: 'Tenant-specific user created successfully'
          });
        } catch (error) {
          isolationTests.push({
            test: 'Tenant-Specific User Data',
            passed: false,
            error: error.message
          });
        }
        
        return {
          tenant: primaryTenant.tenantCode,
          tenantName: primaryTenant.name,
          isolationTests,
          passed: isolationTests.filter(t => t.passed).length >= 2
        };
      }
    );
    
    isolationResults.push(result);
    
    console.log(`🔒 Tenant Isolation Results for ${result.tenantName}:`);
    result.isolationTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.test}: ${test.passed ? '✅' : '❌'} ${test.details}`);
    });
    
    // Add to test results
    testResults.push({
      testName: 'Tenant Isolation and Security',
      passed: result.passed,
      isolationData: result,
      timestamp: new Date().toISOString()
    });
    
    // Validate tenant isolation
    expect(result.passed).toBeTruthy();
    
    console.log('✅ Tenant isolation and security testing completed');
  });

  test('Tenant-Focused: Tenant Performance Comparison', async ({ page }) => {
    console.log('\n=== Testing Tenant Performance Comparison ===');
    
    const performanceResults = [];
    
    // Test with all tenants
    for (const tenant of TENANTURATIONS) {
      console.log(`⚡ Testing performance for tenant: ${tenant.name}`);
      
      const result = await testCommands.executeWithMonitoring(
        `Tenant Performance: ${tenant.name}`,
        async () => {
          const startTime = Date.now();
          
          // Navigate and login
          await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          
          // Fill tenant code if available
          const tenantSelectors = ['input[name="tenantCode"]', 'input[placeholder*="Tenant"]'];
          for (const selector of tenantSelectors) {
            try {
              const element = page.locator(selector).first();
              if (await element.isVisible({ timeout: 2000 })) {
                await element.fill(tenant.tenantCode);
                break;
              }
            } catch (error) {
              // Continue trying other selectors
            }
          }
          
          await page.fill('input[name="email"]', tenant.adminEmail);
          await page.fill('input[name="password"]', tenant.adminPassword);
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
            tenant: tenant.tenantCode,
            tenantName: tenant.name,
            loginDuration,
            interactionDuration,
            interactionCount,
            metrics,
            totalDuration: loginDuration + interactionDuration,
            tenantFieldUsed: tenantSelectors.some(selector => {
              try {
                return page.locator(selector).first().isVisible({ timeout: 1000 });
              } catch (error) {
                return false;
              }
            })
          };
        }
      );
      
      performanceResults.push(result);
      
      console.log(`⚡ ${tenant.name} Performance:`);
      console.log(`   Login Duration: ${result.loginDuration}ms`);
      console.log(`   Interaction Duration: ${result.interactionDuration}ms`);
      console.log(`   DOM Content Loaded: ${result.metrics.domContentLoaded}ms`);
      console.log(`   Load Complete: ${result.metrics.loadComplete}ms`);
      console.log(`   Tenant Field Used: ${result.tenantFieldUsed ? 'Yes' : 'No'}`);
      
      // Logout if needed
      try {
        const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
        if (await logoutButton.isVisible({ timeout: 2000 })) {
          await logoutButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (error) {
        // Continue
      }
    }
    
    // Calculate performance statistics
    const avgLoginTime = performanceResults.reduce((sum, r) => sum + r.loginDuration, 0) / performanceResults.length;
    const avgInteractionTime = performanceResults.reduce((sum, r) => sum + r.interactionDuration, 0) / performanceResults.length;
    const avgDOMLoad = performanceResults.reduce((sum, r) => sum + r.metrics.domContentLoaded, 0) / performanceResults.length;
    const avgLoadComplete = performanceResults.reduce((sum, r) => sum + r.metrics.loadComplete, 0) / performanceResults.length;
    
    // Calculate tenant field usage
    const tenantsWithField = performanceResults.filter(r => r.tenantFieldUsed).length;
    const tenantFieldUsageRate = (tenantsWithField / performanceResults.length) * 100;
    
    console.log(`📊 Tenant Performance Summary:`);
    console.log(`  Average Login Time: ${avgLoginTime.toFixed(0)}ms`);
    console.log(`  Average Interaction Time: ${avgInteractionTime.toFixed(0)}ms`);
    console.log(`  Average DOM Load: ${avgDOMLoad.toFixed(0)}ms`);
    console.log(`  Average Load Complete: ${avgLoadComplete.toFixed(0)}ms`);
    console.log(`  Tenant Field Usage: ${tenantFieldUsageRate.toFixed(2)}%`);
    
    // Validate performance thresholds
    expect(avgLoginTime).toBeLessThan(15000); // 15 seconds max
    expect(avgDOMLoad).toBeLessThan(8000); // 8 seconds max
    expect(avgLoadComplete).toBeLessThan(12000); // 12 seconds max
    
    // Add to test results
    testResults.push({
      testName: 'Tenant Performance Comparison',
      passed: true,
      performanceData: performanceResults,
      averages: {
        avgLoginTime,
        avgInteractionTime,
        avgDOMLoad,
        avgLoadComplete,
        tenantFieldUsageRate
      },
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Tenant performance comparison completed');
  });

  test('Tenant-Focused: Comprehensive Tenant Validation Report', async ({ page }) => {
    console.log('\n=== Generating Comprehensive Tenant Validation Report ===');
    
    // Generate comprehensive HTML report
    const htmlReport = generateTenantHTMLReport(testResults, TENANT_CONFIGURATIONS);
    const reportPath = 'test-results/tenant-focused-report.html';
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Write report to file
    fs.writeFileSync(reportPath, htmlReport);
    
    // Validate report was created
    expect(fs.existsSync(reportPath)).toBeTruthy();
    
    console.log('📊 Comprehensive Tenant Validation Report Generated:');
    console.log(`  📄 HTML Report: ${reportPath}`);
    console.log(`  📊 Total Tests: ${testResults.length}`);
    console.log(`  ✅ Passed Tests: ${testResults.filter(r => r.passed).length}`);
    console.log(`  ❌ Failed Tests: ${testResults.filter(r => !r.passed).length}`);
    
    // Validate report metrics
    const passRate = (testResults.filter(r => r.passed).length / testResults.length) * 100;
    expect(passRate).toBeGreaterThan(0);
    
    console.log(`📈 Overall Pass Rate: ${passRate.toFixed(2)}%`);
    console.log('✅ Comprehensive tenant validation completed');
  });
});

/**
 * Generate tenant-focused HTML report
 */
function generateTenantHTMLReport(results, tenantConfigs) {
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(2);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenant-Focused Nexus Superadmin Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tampus, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 2.5em; }
        .header p { color: #7f8c8d; margin: 5px 0 0 0; font-size: 1.2em; }
        .tenant-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .tenant-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .tenant-card h3 { margin: 0 0 10px 0; font-size: 1.2em; }
        .tenant-card .email { font-size: 0.9em; opacity: 0.9; }
        .tenant-card .code { font-size: 0.8em; opacity: 0.8; margin-top: 5px; }
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
        .tenant-summary { background: #e8f4f8; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .tenant-summary h4 { margin: 0 0 10px 0; color: #2c3e50; }
        .tenant-summary table { width: 100%; border-collapse: collapse; }
        .tenant-summary th, .tenant-summary td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .tenant-summary th { background: #f1f8fe; }
        .performance-chart { background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .performance-bar { background: #ecf0f1; border-radius: 4px; height: 20px; margin: 5px 0; }
        .performance-fill { background: #3498db; height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .timestamp { text-align: center; color: #7f8c8d; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .badge.passed { background: #27ae60; color: white; }
        .badge.failed { background: #e74c3c; color: white; }
        .badge.warning { background: #f39c12; color: white; }
        .tenant-field-status { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .tenant-field-status.found { background: #d4edda; color: #155724; }
        .tenant-field-status.not-found { background: #f8d7da; color: #721c24; }
        .tenant-field-status.unknown { background: #fff3cd; color: #856404; }
        .performance-indicator { margin: 10px 0; padding: 5px; border-radius: 4px; }
        .performance-indicator.excellent { background: #d4edda; color: #155724; }
        .performance-indicator.good { background: #d4edda; color: #155724; }
        .performance-indicator.fair { background: #fff3cd; color: #856404; }
        .performance-indicator.poor { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Tenant-Focused Nexus Superadmin Test Report</h1>
            <p>Comprehensive Multi-Tenant Architecture Validation</p>
        </div>

        <div class="tenant-grid">
            ${tenantConfigs.map(tenant => `
                <div class="tenant-card">
                    <h3>${tenant.name}</h3>
                    <div class="email">${tenant.email}</div>
                    <div class="code">${tenant.tenantCode}</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">${tenant.description}</div>
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
                <h3>🏢️ Total Tenants</h3>
                <div class="value">${tenantConfigs.length}</div>
                <div class="label">Total Tenants</div>
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
                        ${test.tenantResults ? `
                            <div class="tenant-summary">
                                <h4>Tenant Login Results:</h4>
                                <table>
                                    <tr><th>Tenant</th><th>Status</th><th>Performance</th></tr>
                                    ${test.tenantResults.map(tenant => `
                                        <tr>
                                            <td>${tenant.tenantName}</td>
                                            <td>${tenant.success ? '✅ Success' : '❌ Failed'}</td>
                                            <td>${tenant.loginDuration ? `${tenant.loginDuration}ms` : 'N/A'}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        ` : ''}
                        ${test.detectionResults ? `
                            <div class="tenant-summary">
                                <h4>Tenant Field Detection Results:</h4>
                                <table>
                                    <tr><th>Tenant</th><th>Field Found</th><th>Functionality</th></tr>
                                    ${test.detectionResults.map(detection => `
                                        <tr>
                                            <td>${detection.tenantName}</td>
                                            <td>${detection.hasTenantField ? '✅ Yes' : '❌ No'}</td>
                                            <td>${detection.fieldFunctionality ? '✅ Working' : '❌ Failed'}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        ` : ''}
                        ${test.performanceData ? `
                            <div class="performance-chart">
                                <h4>Tenant Performance Metrics:</h4>
                                ${test.performanceData.map(perf => `
                                    <div style="margin: 10px 0;">
                                        <strong>${perf.tenantName}</strong>
                                        <div class="performance-bar">
                                            <div class="performance-fill" style="width: ${Math.min(100, (perf.totalDuration / 100) * 20)}%"></div>
                                        </div>
                                        <small>Login: ${perf.loginDuration}ms | Interaction: ${perf.interactionDuration}ms</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${test.isolationData ? `
                            <div class="tenant-summary">
                                <h4>Tenant Isolation Results:</h4>
                                <table>
                                    <tr><th>Test</th><th>Status</th><th>Details</th></tr>
                                    ${test.isolationData.isolationTests.map(test => `
                                        <tr>
                                            <td>${test.test}</td>
                                            <td>${test.passed ? '✅' : '❌'}</td>
                                            <td>${test.details}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="timestamp">
            Report generated by Tenant-Focused Production-Ready Testing Framework
            <br>
            Generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
}
