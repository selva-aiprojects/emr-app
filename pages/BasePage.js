/**
 * Base Page Object - Foundation for Production-Ready Testing
 * Provides common functionality for all page objects
 */

export class BasePage {
  constructor(page) {
    this.page = page;
    this.selectors = new Map();
    this.timeouts = { short: 5000, medium: 15000, long: 30000 };
    this.retryConfig = { maxRetries: 3, backoffMs: 1000 };
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(timeout = this.timeouts.medium) {
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForTimeout(1000); // Additional wait for dynamic content
  }

  /**
   * Wait for element with multiple fallback strategies
   */
  async waitForElement(selector, timeout = this.timeouts.medium) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`Element not found: ${selector}`);
      return false;
    }
  }

  /**
   * Click element with retry mechanism
   */
  async clickElement(selector, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    return await this.retryOperation(async () => {
      await this.waitForElement(selector, timeout);
      await this.page.click(selector, options);
    }, this.retryConfig.maxRetries, this.retryConfig.backoffMs);
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector, value, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    return await this.retryOperation(async () => {
      await this.waitForElement(selector, timeout);
      await this.page.fill(selector, value, options);
      
      // Verify field was filled correctly
      const filledValue = await this.page.inputValue(selector);
      if (filledValue !== value) {
        throw new Error(`Field value mismatch. Expected: ${value}, Got: ${filledValue}`);
      }
    }, this.retryConfig.maxRetries, this.retryConfig.backoffMs);
  }

  /**
   * Select dropdown option
   */
  async selectDropdown(selector, value, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    return await this.retryOperation(async () => {
      await this.waitForElement(selector, timeout);
      await this.page.selectOption(selector, value, options);
    }, this.retryConfig.maxRetries, this.retryConfig.backoffMs);
  }

  /**
   * Get text content with fallback
   */
  async getTextContent(selector, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    try {
      await this.waitForElement(selector, timeout);
      return await this.page.textContent(selector);
    } catch (error) {
      console.log(`Could not get text from: ${selector}`);
      return '';
    }
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector, timeout = this.timeouts.short) {
    try {
      await this.page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation, maxRetries = 3, backoffMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          console.log(`Operation failed after ${maxRetries} attempts: ${error.message}`);
          throw error;
        }
        
        const waitTime = backoffMs * Math.pow(2, attempt - 1);
        console.log(`Retry ${attempt}/${maxRetries} after ${waitTime}ms: ${error.message}`);
        await this.page.waitForTimeout(waitTime);
      }
    }
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: true,
      ...options
    });
    
    console.log(`Screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(timeout = this.timeouts.medium) {
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForTimeout(500); // Small buffer for dynamic content
  }

  /**
   * Get page title
   */
  async getPageTitle() {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  async getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Check if page contains text
   */
  async pageContainsText(text, options = {}) {
    const timeout = options.timeout || this.timeouts.short;
    
    try {
      await this.page.waitForFunction(
        (searchText) => document.body.innerText.includes(searchText),
        { timeout },
        text
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Hover over element
   */
  async hoverElement(selector, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    return await this.retryOperation(async () => {
      await this.waitForElement(selector, timeout);
      await this.page.hover(selector, options);
    }, this.retryConfig.maxRetries, this.retryConfig.backoffMs);
  }

  /**
   * Press key on element
   */
  async pressKey(selector, key, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    return await this.retryOperation(async () => {
      await this.waitForElement(selector, timeout);
      await this.page.focus(selector);
      await this.page.press(selector, key);
    }, this.retryConfig.maxRetries, this.retryConfig.backoffMs);
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern, timeout = this.timeouts.medium) {
    return await this.page.waitForResponse(
      response => response.url().includes(urlPattern),
      { timeout }
    );
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript(script, ...args) {
    return await this.page.evaluate(script, ...args);
  }

  /**
   * Get element count
   */
  async getElementCount(selector) {
    try {
      const elements = await this.page.locator(selector).all();
      return elements.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector, options = {}) {
    const timeout = options.timeout || this.timeouts.medium;
    
    return await this.retryOperation(async () => {
      await this.waitForElement(selector, timeout);
      await this.page.locator(selector).scrollIntoViewIfNeeded();
    }, this.retryConfig.maxRetries, this.retryConfig.backoffMs);
  }
}
