import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

/**
 * Test Commands - Production-Ready Test Utilities
 * Provides high-level test commands with comprehensive error handling
 */

export class TestCommands {
  constructor(page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.dashboardPage = new DashboardPage(page);
    this.performanceMetrics = [];
  }

  /**
   * Perform login with comprehensive validation and retry
   */
  async performLogin(credentials, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const validateLogin = options.validateLogin !== false;
    
    console.log(`🔐 Performing login with ${maxRetries} retry attempts...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Login attempt ${attempt}/${maxRetries}`);
        
        // Navigate to login page
        await this.loginPage.goto();
        
        // Wait for login form to be ready
        await this.loginPage.waitForLoginForm();
        
        // Validate login form
        const formValidation = await this.loginPage.validateLoginForm();
        if (!formValidation.isValid) {
          console.log('⚠️ Login form validation issues:', formValidation.issues);
        }
        
        // Perform login
        const loginResult = await this.loginPage.loginWithRetry(credentials, 1);
        
        if (loginResult.success) {
          console.log(`✓ Login successful on attempt ${attempt}`);
          
          // Validate dashboard if requested
          if (validateLogin) {
            const dashboardReady = await this.dashboardPage.waitForDashboardReady();
            if (!dashboardReady) {
              throw new Error('Dashboard did not load after successful login');
            }
          }
          
          return this.dashboardPage;
        }
        
      } catch (error) {
        console.log(`❌ Login attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          // Take final failure screenshot
          await this.loginPage.takeScreenshot('login-final-failure');
          throw new Error(`Login failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry with exponential backoff
        const waitTime = 2000 * attempt;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await this.page.waitForTimeout(waitTime);
      }
    }
    
    throw new Error('Login failed - all retry attempts exhausted');
  }

  /**
   * Navigate to module with multiple strategies
   */
  async navigateToModule(moduleName, options = {}) {
    const timeout = options.timeout || 15000;
    const validateNavigation = options.validateNavigation !== false;
    
    console.log(`🧭 Navigating to module: ${moduleName}`);
    
    const startTime = Date.now();
    
    try {
      // First try dashboard navigation
      if (await this.dashboardPage.verifyDashboardLoaded()) {
        const navigationSuccess = await this.dashboardPage.navigateToModule(moduleName);
        
        if (navigationSuccess) {
          const navigationTime = Date.now() - startTime;
          console.log(`✓ Successfully navigated to ${moduleName} in ${navigationTime}ms`);
          
          // Validate navigation if requested
          if (validateNavigation) {
            await this.validateModuleNavigation(moduleName);
          }
          
          return true;
        }
      }
      
      // Fallback: try direct navigation
      console.log(`Dashboard navigation failed, trying direct navigation to ${moduleName}`);
      const directSuccess = await this.directNavigateToModule(moduleName);
      
      if (directSuccess) {
        const navigationTime = Date.now() - startTime;
        console.log(`✓ Direct navigation to ${moduleName} successful in ${navigationTime}ms`);
        return true;
      }
      
      throw new Error(`Failed to navigate to ${moduleName} using all strategies`);
      
    } catch (error) {
      const navigationTime = Date.now() - startTime;
      console.log(`❌ Navigation to ${moduleName} failed after ${navigationTime}ms: ${error.message}`);
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: `test-results/navigation-failed-${moduleName}-${Date.now()}.png`,
        fullPage: true 
      });
      
      throw error;
    }
  }

  /**
   * Direct navigation to module (fallback strategy)
   */
  async directNavigateToModule(moduleName) {
    // Try URL-based navigation
    const urlPatterns = [
      `/${moduleName.toLowerCase()}`,
      `/${moduleName.toLowerCase()}/dashboard`,
      `/${moduleName.toLowerCase()}/list`,
      `/${moduleName.toLowerCase()}/manage`
    ];
    
    for (const url of urlPatterns) {
      try {
        await this.page.goto(`${this.page.context().baseUrl()}${url}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        await this.page.waitForLoadState('networkidle');
        
        // Verify we're on the right page
        if (await this.verifyModulePage(moduleName)) {
          return true;
        }
        
      } catch (error) {
        console.log(`Direct navigation to ${url} failed: ${error.message}`);
      }
    }
    
    return false;
  }

  /**
   * Verify we're on the correct module page
   */
  async verifyModulePage(moduleName) {
    const pageContent = await this.page.textContent('body');
    const pageTitle = await this.page.title();
    
    // Check multiple indicators
    const indicators = [
      pageContent.toLowerCase().includes(moduleName.toLowerCase()),
      pageTitle.toLowerCase().includes(moduleName.toLowerCase()),
      await this.page.locator(`text=/${moduleName}/i`).first().isVisible({ timeout: 3000 })
    ];
    
    return indicators.some(indicator => indicator);
  }

  /**
   * Validate module navigation success
   */
  async validateModuleNavigation(moduleName) {
    console.log(`🔍 Validating navigation to ${moduleName}...`);
    
    // Wait a moment for page to stabilize
    await this.page.waitForTimeout(2000);
    
    const validationResults = {
      pageLoaded: false,
      contentFound: false,
      noErrors: true,
      elementsVisible: 0
    };
    
    // Check if page loaded
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
      validationResults.pageLoaded = true;
    } catch (error) {
      console.log(`Page load validation failed: ${error.message}`);
    }
    
    // Check for expected content
    try {
      const contentFound = await this.verifyModulePage(moduleName);
      validationResults.contentFound = contentFound;
    } catch (error) {
      console.log(`Content validation failed: ${error.message}`);
    }
    
    // Check for error messages
    try {
      const errorSelectors = [
        '.error',
        '.alert-danger',
        '[role="alert"]',
        'text=/(error|failed|unable)/i'
      ];
      
      for (const selector of errorSelectors) {
        const errorElement = this.page.locator(selector).first();
        if (await errorElement.isVisible({ timeout: 2000 })) {
          validationResults.noErrors = false;
          console.log(`Error found on page: ${await errorElement.textContent()}`);
          break;
        }
      }
    } catch (error) {
      console.log(`Error check failed: ${error.message}`);
    }
    
    // Count visible elements
    try {
      const visibleElements = await this.page.locator('button, input, a, select, textarea').all();
      validationResults.elementsVisible = visibleElements.length;
    } catch (error) {
      console.log(`Element count failed: ${error.message}`);
    }
    
    // Calculate overall validation score
    const score = [
      validationResults.pageLoaded ? 25 : 0,
      validationResults.contentFound ? 25 : 0,
      validationResults.noErrors ? 25 : 0,
      validationResults.elementsVisible > 0 ? 25 : 0
    ].reduce((sum, val) => sum + val, 0);
    
    console.log(`Navigation validation score: ${score}/100`);
    
    if (score < 50) {
      throw new Error(`Navigation validation failed with score ${score}/100`);
    }
    
    return validationResults;
  }

  /**
   * Verify page content with multiple checks
   */
  async verifyPageContent(expectedContent, options = {}) {
    const timeout = options.timeout || 10000;
    const partialMatch = options.partialMatch || false;
    
    console.log(`📄 Verifying page content...`);
    
    const results = {
      success: true,
      found: [],
      missing: [],
      total: expectedContent.length
    };
    
    const pageContent = await this.page.textContent('body');
    const pageContentLower = pageContent.toLowerCase();
    
    for (const content of expectedContent) {
      const contentLower = content.toLowerCase();
      
      let found = false;
      
      if (partialMatch) {
        found = pageContentLower.includes(contentLower);
      } else {
        // Look for exact phrases or significant portions
        const words = contentLower.split(' ');
        const matchedWords = words.filter(word => 
          word.length > 2 && pageContentLower.includes(word)
        );
        found = matchedWords.length >= Math.ceil(words.length * 0.6); // 60% of words
      }
      
      if (found) {
        results.found.push(content);
      } else {
        results.missing.push(content);
        results.success = false;
      }
    }
    
    console.log(`Content verification: ${results.found.length}/${results.total} found`);
    
    if (results.missing.length > 0) {
      console.log('Missing content:', results.missing);
    }
    
    return results;
  }

  /**
   * Wait for and verify element interactions
   */
  async waitForAndInteract(selector, action = 'click', options = {}) {
    const timeout = options.timeout || 15000;
    const retries = options.retries || 2;
    
    console.log(`🎯 Waiting for element: ${selector}`);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Wait for element
        await this.page.waitForSelector(selector, { timeout, state: 'visible' });
        
        // Perform action
        switch (action) {
          case 'click':
            await this.page.click(selector, options);
            break;
          case 'fill':
            await this.page.fill(selector, options.value || '', options);
            break;
          case 'select':
            await this.page.selectOption(selector, options.value || [], options);
            break;
          case 'hover':
            await this.page.hover(selector, options);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        
        console.log(`✓ Successfully performed ${action} on ${selector}`);
        return true;
        
      } catch (error) {
        console.log(`Attempt ${attempt} failed for ${selector}: ${error.message}`);
        
        if (attempt === retries) {
          throw error;
        }
        
        await this.page.waitForTimeout(1000);
      }
    }
    
    return false;
  }

  /**
   * Get performance metrics for current operation
   */
  async getPerformanceMetrics(operationName) {
    const metrics = await this.page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0];
      
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
        navigationType: navigation?.type || 'unknown',
        redirectCount: performance.navigation.redirectCount
      };
    });
    
    const performanceData = {
      operation: operationName,
      timestamp: new Date().toISOString(),
      ...metrics
    };
    
    this.performanceMetrics.push(performanceData);
    
    console.log(`📊 Performance metrics for ${operationName}:`, {
      domContentLoaded: `${metrics.domContentLoaded}ms`,
      loadComplete: `${metrics.loadComplete}ms`,
      firstPaint: `${metrics.firstPaint}ms`
    });
    
    return performanceData;
  }

  /**
   * Take screenshot with automatic naming
   */
  async takeScreenshot(name, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: true,
      animations: 'disabled',
      ...options
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics() {
    return {
      metrics: this.performanceMetrics,
      summary: {
        totalOperations: this.performanceMetrics.length,
        averageDomContentLoaded: this.calculateAverage('domContentLoaded'),
        averageLoadComplete: this.calculateAverage('loadComplete'),
        averageFirstPaint: this.calculateAverage('firstPaint')
      }
    };
  }

  /**
   * Calculate average for performance metric
   */
  calculateAverage(metric) {
    if (this.performanceMetrics.length === 0) return 0;
    
    const total = this.performanceMetrics.reduce((sum, m) => sum + (m[metric] || 0), 0);
    return Math.round(total / this.performanceMetrics.length);
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = [];
    console.log('📊 Performance metrics reset');
  }

  /**
   * Execute command with performance monitoring
   */
  async executeWithMonitoring(commandName, commandFunction) {
    const startTime = Date.now();
    
    try {
      console.log(`⚡ Executing: ${commandName}`);
      
      const result = await commandFunction();
      
      const executionTime = Date.now() - startTime;
      console.log(`✓ ${commandName} completed in ${executionTime}ms`);
      
      // Get performance metrics
      await this.getPerformanceMetrics(commandName);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.log(`❌ ${commandName} failed after ${executionTime}ms: ${error.message}`);
      
      // Take screenshot on failure
      await this.takeScreenshot(`${commandName}-failure`);
      
      throw error;
    }
  }
}
