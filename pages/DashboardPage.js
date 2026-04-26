import { BasePage } from './BasePage.js';

/**
 * Dashboard Page Object - Production-Ready Implementation
 * Handles dashboard functionality with comprehensive validation
 */

export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Initialize selectors with multiple fallback options
    this.selectors.set('pageTitle', [
      'h1',
      'h2',
      '.page-title',
      '.dashboard-title',
      '.page-header h1',
      '.dashboard-header h1',
      '[data-testid="page-title"]',
      '.title'
    ]);
    
    this.selectors.set('dashboardContainer', [
      '.dashboard',
      '.main-content',
      '.content',
      '.page-content',
      '[data-testid="dashboard"]',
      '.app-main',
      'main'
    ]);
    
    this.selectors.set('navigationMenu', [
      'nav',
      '.navigation',
      '.menu',
      '.sidebar',
      '.nav-menu',
      '[data-testid="navigation"]',
      '.main-nav'
    ]);
    
    this.selectors.set('metricsContainer', [
      '.metrics',
      '.stats',
      '.dashboard-metrics',
      '.cards',
      '.widgets',
      '.kpi-container',
      '[data-testid="metrics"]'
    ]);
    
    this.selectors.set('userMenu', [
      '.user-menu',
      '.user-profile',
      '.user-dropdown',
      '.profile-menu',
      '[data-testid="user-menu"]',
      '.header-user'
    ]);
    
    this.selectors.set('logoutButton', [
      'button:has-text("Logout")',
      'a:has-text("Logout")',
      '.logout-btn',
      '.btn-logout',
      '[data-testid="logout"]',
      '.sign-out'
    ]);
  }

  /**
   * Verify dashboard is loaded with multiple indicators
   */
  async verifyDashboardLoaded() {
    console.log('🔍 Verifying dashboard is loaded...');
    
    const indicators = [
      { name: 'Page Title', check: () => this.checkPageTitle() },
      { name: 'Dashboard Container', check: () => this.checkDashboardContainer() },
      { name: 'Navigation Menu', check: () => this.checkNavigationMenu() },
      { name: 'Dashboard Content', check: () => this.checkDashboardContent() }
    ];
    
    const results = [];
    
    for (const indicator of indicators) {
      try {
        const result = await indicator.check();
        results.push({ name: indicator.name, success: result });
        console.log(`${result ? '✓' : '❌'} ${indicator.name}: ${result ? 'Found' : 'Not found'}`);
      } catch (error) {
        results.push({ name: indicator.name, success: false, error: error.message });
        console.log(`❌ ${indicator.name}: ${error.message}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const isSuccess = successCount >= 2; // At least 2 indicators should pass
    
    console.log(`Dashboard verification: ${successCount}/${indicators.length} indicators passed`);
    
    return isSuccess;
  }

  /**
   * Check for page title
   */
  async checkPageTitle() {
    const titleSelectors = this.selectors.get('pageTitle');
    
    for (const selector of titleSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const titleText = await element.textContent();
          return titleText && titleText.toLowerCase().includes('dashboard');
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    return false;
  }

  /**
   * Check for dashboard container
   */
  async checkDashboardContainer() {
    const containerSelectors = this.selectors.get('dashboardContainer');
    
    for (const selector of containerSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    return false;
  }

  /**
   * Check for navigation menu
   */
  async checkNavigationMenu() {
    const navSelectors = this.selectors.get('navigationMenu');
    
    for (const selector of navSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    return false;
  }

  /**
   * Check for dashboard content
   */
  async checkDashboardContent() {
    // Check for any dashboard-related content
    const contentSelectors = [
      'text=/(dashboard|overview|summary)/i',
      'text=/(metrics|stats|analytics)/i',
      '.metric-card',
      '.stat-card',
      '.dashboard-widget'
    ];
    
    for (const selector of contentSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    return false;
  }

  /**
   * Get dashboard metrics
   */
  async getMetrics() {
    console.log('📊 Getting dashboard metrics...');
    
    const metrics = {};
    
    // Try to find metrics container
    const metricsSelector = await this.detectElement('metricsContainer');
    
    if (metricsSelector) {
      // Get all metric elements
      const metricElements = await this.page.locator(`${metricsSelector} .metric, ${metricsSelector} .stat, ${metricsSelector} .card`).all();
      
      for (let i = 0; i < metricElements.length; i++) {
        try {
          const element = metricElements[i];
          const text = await element.textContent();
          
          // Parse metric information
          const metricInfo = this.parseMetricText(text);
          if (metricInfo) {
            metrics[`metric_${i}`] = metricInfo;
          }
        } catch (error) {
          console.log(`Error parsing metric ${i}: ${error.message}`);
        }
      }
    }
    
    // Fallback: look for common metric patterns
    if (Object.keys(metrics).length === 0) {
      await this.searchForCommonMetrics(metrics);
    }
    
    console.log(`Found ${Object.keys(metrics).length} metrics`);
    return metrics;
  }

  /**
   * Parse metric text to extract label and value
   */
  parseMetricText(text) {
    if (!text || typeof text !== 'string') return null;
    
    const cleanText = text.trim();
    
    // Common patterns: "Label: Value", "Label Value", "Label\nValue"
    const patterns = [
      /^(.+?):\s*(.+)$/,           // "Label: Value"
      /^(.+?)\s+(\d+.+)$/,         // "Label 123" or "Label 123.45"
      /^(.+?)\n(.+)$/,            // "Label\nValue"
      /^(.+?)\s*\|\s*(.+)$/       // "Label | Value"
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        return {
          label: match[1].trim(),
          value: match[2].trim(),
          raw: cleanText
        };
      }
    }
    
    // If no pattern matches, return the text as both label and value
    return {
      label: cleanText,
      value: cleanText,
      raw: cleanText
    };
  }

  /**
   * Search for common metrics patterns
   */
  async searchForCommonMetrics(metrics) {
    const commonMetrics = [
      { name: 'Patients', patterns: ['patients', 'patient', 'admissions'] },
      { name: 'Doctors', patterns: ['doctors', 'physicians', 'medical staff'] },
      { name: 'Nurses', patterns: ['nurses', 'nursing staff'] },
      { name: 'Beds', patterns: ['beds', 'occupancy', 'capacity'] },
      { name: 'Revenue', patterns: ['revenue', 'income', 'billing'] },
      { name: 'Appointments', patterns: ['appointments', 'visits', 'consultations'] }
    ];
    
    for (const metric of commonMetrics) {
      for (const pattern of metric.patterns) {
        try {
          const elements = await this.page.locator(`text=/${pattern}/i`).all();
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.trim()) {
              const parsed = this.parseMetricText(text);
              if (parsed && parsed.value && /\d/.test(parsed.value)) {
                metrics[metric.name] = parsed;
                break;
              }
            }
          }
          
          if (metrics[metric.name]) break;
        } catch (error) {
          // Continue trying other patterns
        }
      }
    }
  }

  /**
   * Get navigation menu items
   */
  async getNavigationItems() {
    console.log('🧭 Getting navigation items...');
    
    const navSelector = await this.detectElement('navigationMenu');
    const items = [];
    
    if (navSelector) {
      try {
        // Look for navigation links
        const navLinks = await this.page.locator(`${navSelector} a, ${navSelector} button`).all();
        
        for (const link of navLinks) {
          try {
            const text = await link.textContent();
            if (text && text.trim()) {
              items.push({
                text: text.trim(),
                selector: link.toString(),
                visible: await link.isVisible()
              });
            }
          } catch (error) {
            // Continue processing other links
          }
        }
      } catch (error) {
        console.log(`Error getting navigation items: ${error.message}`);
      }
    }
    
    console.log(`Found ${items.length} navigation items`);
    return items;
  }

  /**
   * Navigate to specific module
   */
  async navigateToModule(moduleName) {
    console.log(`🧭 Navigating to ${moduleName}...`);
    
    const items = await this.getNavigationItems();
    
    // Look for exact match first
    let targetItem = items.find(item => 
      item.text.toLowerCase() === moduleName.toLowerCase()
    );
    
    // If no exact match, look for partial match
    if (!targetItem) {
      targetItem = items.find(item => 
        item.text.toLowerCase().includes(moduleName.toLowerCase())
      );
    }
    
    if (targetItem) {
      try {
        await this.clickElement(targetItem.selector);
        await this.waitForNavigation();
        console.log(`✓ Successfully navigated to ${moduleName}`);
        return true;
      } catch (error) {
        console.log(`❌ Failed to navigate to ${moduleName}: ${error.message}`);
        return false;
      }
    }
    
    console.log(`❌ Module ${moduleName} not found in navigation`);
    return false;
  }

  /**
   * Get user information
   */
  async getUserInfo() {
    console.log('👤 Getting user information...');
    
    const userMenuSelector = await this.detectElement('userMenu');
    
    if (userMenuSelector) {
      try {
        const userText = await this.getTextContent(userMenuSelector);
        return {
          text: userText,
          visible: await this.isElementVisible(userMenuSelector)
        };
      } catch (error) {
        console.log(`Error getting user info: ${error.message}`);
      }
    }
    
    // Fallback: look for user name in page
    const userPatterns = [
      'text=/Welcome\\s+(.+?)(?:\\s|$)/i',
      'text=/Hello\\s+(.+?)(?:\\s|$)/i',
      'text=/(.+?@.+\\.com)/i'
    ];
    
    for (const pattern of userPatterns) {
      try {
        const element = this.page.locator(pattern).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          return { text: text.trim(), source: 'page-content' };
        }
      } catch (error) {
        // Continue trying other patterns
      }
    }
    
    return null;
  }

  /**
   * Logout from dashboard
   */
  async logout() {
    console.log('🚪 Logging out...');
    
    try {
      // Look for user menu and click it
      const userMenuSelector = await this.detectElement('userMenu');
      if (userMenuSelector) {
        await this.clickElement(userMenuSelector);
        await this.page.waitForTimeout(1000);
      }
      
      // Look for and click logout button
      const logoutSelector = await this.detectElement('logoutButton');
      if (logoutSelector) {
        await this.clickElement(logoutSelector);
        await this.waitForNavigation();
        console.log('✓ Successfully logged out');
        return true;
      }
      
      console.log('❌ Logout button not found');
      return false;
      
    } catch (error) {
      console.log(`❌ Logout failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get dashboard health status
   */
  async getHealthStatus() {
    console.log('🏥 Getting dashboard health status...');
    
    const health = {
      isLoaded: await this.verifyDashboardLoaded(),
      metrics: await this.getMetrics(),
      navigation: await this.getNavigationItems(),
      user: await this.getUserInfo(),
      timestamp: new Date().toISOString()
    };
    
    // Calculate health score
    let score = 0;
    if (health.isLoaded) score += 25;
    if (health.metrics && Object.keys(health.metrics).length > 0) score += 25;
    if (health.navigation && health.navigation.length > 0) score += 25;
    if (health.user) score += 25;
    
    health.score = score;
    health.status = score >= 75 ? 'healthy' : score >= 50 ? 'warning' : 'critical';
    
    console.log(`Dashboard health: ${health.score}/100 (${health.status})`);
    return health;
  }

  /**
   * Wait for dashboard to be fully ready
   */
  async waitForDashboardReady(timeout = this.timeouts.long) {
    console.log('⏳ Waiting for dashboard to be ready...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isReady = await this.verifyDashboardLoaded();
      
      if (isReady) {
        console.log('✓ Dashboard is ready');
        return true;
      }
      
      await this.page.waitForTimeout(1000);
    }
    
    throw new Error('Dashboard did not become ready within timeout');
  }

  /**
   * Take comprehensive dashboard screenshot
   */
  async takeDashboardScreenshot(name = 'dashboard') {
    await this.takeScreenshot(name, {
      fullPage: true,
      animations: 'disabled'
    });
  }
}
