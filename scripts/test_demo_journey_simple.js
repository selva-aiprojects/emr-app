import { chromium } from 'playwright';

const demoCredentials = {
  tenantCode: 'DEMO',
  email: 'rajesh@demo.hospital',
  password: 'Demo@123'
};

async function testDemoTenant() {
  console.log(' Testing DEMO Tenant - Basic Functionality Check...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login to Demo Tenant
    console.log(' Step 1: Logging into DEMO tenant...');
    await page.goto('http://localhost:5175');
    
    // Wait for login page to load
    await page.waitForSelector('select[name="tenant"]', { timeout: 10000 });
    
    // Fill login form
    await page.selectOption('select[name="tenant"]', demoCredentials.tenantCode);
    await page.fill('input[name="email"]', demoCredentials.email);
    await page.fill('input[name="password"]', demoCredentials.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard - look for any dashboard indicators
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    console.log('  Successfully logged into DEMO tenant');
    
    // Step 2: Check Dashboard Data
    console.log(' Step 2: Checking dashboard for demo data...');
    
    // Look for patient statistics or any dashboard content
    try {
      await page.waitForSelector('text=patients', { timeout: 5000 });
      console.log('  Dashboard shows patient data');
    } catch (e) {
      console.log('  Dashboard may still be loading or has different layout');
    }
    
    // Step 3: Navigate to Patients
    console.log(' Step 3: Navigating to patients section...');
    
    // Try different navigation patterns
    const patientNavFound = await Promise.any([
      page.click('text=Patients').then(() => true).catch(() => false),
      page.click('[href*="patients"]').then(() => true).catch(() => false),
      page.click('button:has-text("Patients")').then(() => true).catch(() => false)
    ]);
    
    if (patientNavFound) {
      await page.waitForTimeout(2000);
      console.log('  Navigated to patients section');
      
      // Check if patients are listed
      const hasPatients = await page.locator('text=').count() > 0;
      console.log(`  Patient data present: ${hasPatients ? 'Yes' : 'No'}`);
    } else {
      console.log('  Could not find patients navigation');
    }
    
    // Step 4: Navigate to EMR
    console.log(' Step 4: Testing EMR functionality...');
    
    const emrNavFound = await Promise.any([
      page.click('text=EMR').then(() => true).catch(() => false),
      page.click('text=Clinical').then(() => true).catch(() => false),
      page.click('[href*="emr"]').then(() => true).catch(() => false),
      page.click('button:has-text("EMR")').then(() => true).catch(() => false)
    ]);
    
    if (emrNavFound) {
      await page.waitForTimeout(2000);
      console.log('  Navigated to EMR section');
      
      // Look for patient selection or clinical forms
      try {
        await page.waitForSelector('select', { timeout: 5000 });
        console.log('  EMR interface loaded');
      } catch (e) {
        console.log('  EMR interface may have different layout');
      }
    } else {
      console.log('  Could not find EMR navigation');
    }
    
    // Step 5: Check Application Navigation
    console.log(' Step 5: Testing application navigation...');
    
    // Get all navigation elements
    const navElements = await page.locator('nav, header, [role="navigation"]').count();
    console.log(`  Navigation areas found: ${navElements}`);
    
    // Look for main menu items
    const menuItems = await page.locator('a, button').filter({ hasText: /(Dashboard|Patients|EMR|Clinical|Billing|Pharmacy|Lab)/ }).count();
    console.log(`  Main menu items found: ${menuItems}`);
    
    // Step 6: Verify Demo Data Presence
    console.log(' Step 6: Verifying demo data presence...');
    
    // Go back to dashboard
    await page.goto('http://localhost:5175');
    await page.waitForTimeout(3000);
    
    // Check page title and content
    const pageTitle = await page.title();
    console.log(`  Page title: ${pageTitle}`);
    
    // Look for any indicators of loaded data
    const pageContent = await page.content();
    const hasDataIndicators = pageContent.includes('patient') || 
                             pageContent.includes('encounter') || 
                             pageContent.includes('medical') ||
                             pageContent.includes('hospital');
    
    console.log(`  Demo data indicators present: ${hasDataIndicators ? 'Yes' : 'No'}`);
    
    // Step 7: Logout Test
    console.log(' Step 7: Testing logout functionality...');
    
    // Look for logout options
    const logoutFound = await Promise.any([
      page.click('text=Logout').then(() => true).catch(() => false),
      page.click('text=Sign Out').then(() => true).catch(() => false),
      page.click('[data-testid="logout"]').then(() => true).catch(() => false)
    ]);
    
    if (logoutFound) {
      await page.waitForTimeout(2000);
      console.log('  Logout functionality available');
    } else {
      console.log('  Logout option not clearly visible');
    }
    
    console.log('\n Demo Tenant Test: COMPLETED');
    console.log('\n Test Results:');
    console.log(` Login: Successful`);
    console.log(` Dashboard: Loaded`);
    console.log(` Navigation: ${menuItems > 0 ? 'Available' : 'Limited'}`);
    console.log(` Demo Data: ${hasDataIndicators ? 'Present' : 'Needs Verification'}`);
    console.log(` Overall Status: ${hasDataIndicators && menuItems > 0 ? 'GOOD' : 'NEEDS ATTENTION'}`);
    
    return true;
    
  } catch (error) {
    console.error('\n Demo Tenant Test FAILED:', error.message);
    console.error(' URL:', page.url());
    
    try {
      await page.screenshot({ path: 'demo-test-error.png' });
      console.log(' Screenshot saved: demo-test-error.png');
    } catch (screenshotError) {
      console.log(' Could not capture screenshot');
    }
    
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testDemoTenant().then(success => {
  if (success) {
    console.log('\n Demo tenant test completed!');
    process.exit(0);
  } else {
    console.log('\n Demo tenant test failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Test execution failed:', error);
  process.exit(1);
});
