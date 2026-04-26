import { BasePage } from './BasePage.js';

/**
 * Login Page Object - Production-Ready Implementation
 * Handles login functionality with dynamic UI detection
 */

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Initialize selectors with multiple fallback options
    this.selectors.set('tenantInput', [
      'input[name="tenantCode"]',
      'input[placeholder*="Tenant"]',
      'input[placeholder*="tenant"]',
      'input[id*="tenant"]',
      'input[aria-label*="Tenant"]',
      '.tenant-input input',
      '#tenantCode'
    ]);
    
    this.selectors.set('emailInput', [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="Email"]',
      'input[placeholder*="email"]',
      'input[id*="email"]',
      'input[aria-label*="Email"]',
      '.email-input input',
      '#email'
    ]);
    
    this.selectors.set('passwordInput', [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="Password"]',
      'input[placeholder*="password"]',
      'input[id*="password"]',
      'input[aria-label*="Password"]',
      '.password-input input',
      '#password'
    ]);
    
    this.selectors.set('loginButton', [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Submit")',
      '.btn-login',
      '.btn-primary',
      '.login-button',
      '#loginButton'
    ]);
    
    this.selectors.set('errorMessage', [
      '.error',
      '.alert',
      '.error-message',
      '.login-error',
      '[role="alert"]',
      '.alert-danger',
      '.notification.error'
    ]);
    
    this.selectors.set('successMessage', [
      '.success',
      '.alert-success',
      '.success-message',
      '.notification.success',
      '[role="status"]'
    ]);
  }

  /**
   * Navigate to login page
   */
  async goto(baseUrl) {
    const url = baseUrl || 'http://127.0.0.1:5175';
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeouts.long });
    await this.waitForPageLoad();
  }

  /**
   * Dynamic element detection - finds working selector
   */
  async detectElement(selectorKey) {
    const selectorOptions = this.selectors.get(selectorKey);
    
    for (const selector of selectorOptions) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✓ Found ${selectorKey} with selector: ${selector}`);
          return selector;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    console.log(`❌ Could not find ${selectorKey} with any selector`);
    return null;
  }

  /**
   * Fill login form with dynamic detection
   */
  async fillLoginForm(credentials) {
    const { email, password } = credentials;
    
    // Detect and fill email field
    const emailSelector = await this.detectElement('emailInput');
    if (emailSelector) {
      await this.fillField(emailSelector, email);
    } else {
      throw new Error('Email input field not found');
    }
    
    // Detect and fill password field
    const passwordSelector = await this.detectElement('passwordInput');
    if (passwordSelector) {
      await this.fillField(passwordSelector, password);
    } else {
      throw new Error('Password input field not found');
    }
    
    // Tenant field is optional - try to fill if available
    const tenantSelector = await this.detectElement('tenantInput');
    if (tenantSelector && credentials.tenantCode) {
      await this.fillField(tenantSelector, credentials.tenantCode);
      console.log('✓ Tenant field found and filled');
    } else {
      console.log('ℹ️ Tenant field not found (optional in this environment)');
    }
  }

  /**
   * Click login button with dynamic detection
   */
  async clickLoginButton() {
    const buttonSelector = await this.detectElement('loginButton');
    if (buttonSelector) {
      await this.clickElement(buttonSelector);
    } else {
      throw new Error('Login button not found');
    }
  }

  /**
   * Perform login with comprehensive error handling
   */
  async login(credentials) {
    console.log(`🔐 Attempting login with tenant: ${credentials.tenantCode}, email: ${credentials.email}`);
    
    try {
      // Fill the login form
      await this.fillLoginForm(credentials);
      
      // Take screenshot before login
      await this.takeScreenshot('login-form-filled');
      
      // Click login button
      await this.clickLoginButton();
      
      // Wait for navigation
      await this.waitForNavigation();
      
      // Check for login errors
      const loginError = await this.checkForLoginErrors();
      if (loginError) {
        await this.takeScreenshot('login-error');
        throw new Error(`Login failed: ${loginError}`);
      }
      
      console.log('✓ Login completed successfully');
      return true;
      
    } catch (error) {
      console.log(`❌ Login error: ${error.message}`);
      await this.takeScreenshot('login-failure');
      throw error;
    }
  }

  /**
   * Check for login errors
   */
  async checkForLoginErrors() {
    const errorSelector = await this.detectElement('errorMessage');
    if (errorSelector) {
      const errorText = await this.getTextContent(errorSelector);
      if (errorText && errorText.trim()) {
        return errorText;
      }
    }
    return null;
  }

  /**
   * Check for login success
   */
  async checkForLoginSuccess() {
    const successSelector = await this.detectElement('successMessage');
    if (successSelector) {
      const successText = await this.getTextContent(successSelector);
      if (successText && successText.trim()) {
        return successText;
      }
    }
    return null;
  }

  /**
   * Verify login page is loaded
   */
  async isLoginPageLoaded() {
    // Check for login form elements (tenant is optional)
    const emailField = await this.detectElement('emailInput');
    const passwordField = await this.detectElement('passwordInput');
    const loginButton = await this.detectElement('loginButton');
    
    // Check for optional tenant field
    const tenantField = await this.detectElement('tenantInput');
    
    const hasRequiredFields = !!(emailField && passwordField && loginButton);
    const hasOptionalTenant = !!tenantField;
    
    console.log(`Login form check: Required fields=${hasRequiredFields}, Tenant field=${hasOptionalTenant}`);
    
    return hasRequiredFields;
  }

  /**
   * Get login form state
   */
  async getLoginFormState() {
    const state = {
      tenantField: null,
      emailField: null,
      passwordField: null,
      loginButton: null,
      errors: [],
      success: null
    };
    
    // Check each field
    state.tenantField = await this.detectElement('tenantInput');
    state.emailField = await this.detectElement('emailInput');
    state.passwordField = await this.detectElement('passwordInput');
    state.loginButton = await this.detectElement('loginButton');
    
    // Check for messages
    state.errors.push(await this.checkForLoginErrors());
    state.success = await this.checkForLoginSuccess();
    
    return state;
  }

  /**
   * Clear login form
   */
  async clearLoginForm() {
    const fields = ['tenantInput', 'emailInput', 'passwordInput'];
    
    for (const fieldKey of fields) {
      const selector = await this.detectElement(fieldKey);
      if (selector) {
        await this.page.fill(selector, '');
      }
    }
  }

  /**
   * Wait for login form to be ready
   */
  async waitForLoginForm(timeout = this.timeouts.medium) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.isLoginPageLoaded()) {
        return true;
      }
      await this.page.waitForTimeout(500);
    }
    
    throw new Error('Login form did not load within timeout');
  }

  /**
   * Validate login form
   */
  async validateLoginForm() {
    const state = await this.getLoginFormState();
    const issues = [];
    
    // Tenant field is optional
    if (!state.emailField) issues.push('Email field not found');
    if (!state.passwordField) issues.push('Password field not found');
    if (!state.loginButton) issues.push('Login button not found');
    
    // Note tenant field availability for information
    if (state.tenantField) {
      console.log('✓ Tenant field available');
    } else {
      console.log('ℹ️ Tenant field not available (optional)');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      hasTenantField: !!state.tenantField
    };
  }

  /**
   * Handle login with retry mechanism
   */
  async loginWithRetry(credentials, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Login attempt ${attempt}/${maxRetries}`);
        
        // Clear form first
        await this.clearLoginForm();
        
        // Wait for form to be ready
        await this.waitForLoginForm();
        
        // Perform login
        const result = await this.login(credentials);
        
        if (result) {
          return { success: true, attempt };
        }
        
      } catch (error) {
        console.log(`Login attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await this.page.waitForTimeout(2000 * attempt);
      }
    }
    
    throw new Error('Login failed after all retry attempts');
  }
}
