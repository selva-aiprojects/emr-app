import { chromium } from 'playwright';

const demoCredentials = {
  tenantCode: 'DEMO',
  email: 'rajesh@demo.hospital',
  password: 'Demo@123'
};

const testPatient = {
  firstName: 'Test',
  lastName: 'Patient',
  email: 'test.patient@demo.com',
  phone: '+91-9876543210',
  gender: 'Male',
  bloodGroup: 'O+',
  address: '123 Test Street, Test Area, Bangalore',
  emergencyContact: 'Test Emergency',
  emergencyPhone: '+91-9876543211'
};

async function testPatientJourney() {
  console.log(' Starting Complete Patient Journey Test for DEMO Tenant...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login to Demo Tenant
    console.log(' Step 1: Logging into DEMO tenant...');
    await page.goto('http://localhost:5175');
    
    // Wait for login page to load
    await page.waitForSelector('[data-testid="tenant-select"]', { timeout: 10000 });
    
    // Fill login form
    await page.fill('[data-testid="tenant-select"]', demoCredentials.tenantCode);
    await page.fill('[data-testid="email-input"]', demoCredentials.email);
    await page.fill('[data-testid="password-input"]', demoCredentials.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
    console.log('  Successfully logged into DEMO tenant');
    
    // Step 2: Navigate to Patient Registration
    console.log(' Step 2: Navigating to patient registration...');
    await page.click('[data-testid="patients-menu"]');
    await page.waitForSelector('[data-testid="patients-page"]', { timeout: 10000 });
    
    // Step 3: Register New Patient
    console.log(' Step 3: Registering new test patient...');
    await page.click('[data-testid="register-patient-btn"]');
    await page.waitForSelector('[data-testid="patient-form"]', { timeout: 10000 });
    
    // Fill patient form
    await page.fill('[data-testid="first-name-input"]', testPatient.firstName);
    await page.fill('[data-testid="last-name-input"]', testPatient.lastName);
    await page.fill('[data-testid="email-input"]', testPatient.email);
    await page.fill('[data-testid="phone-input"]', testPatient.phone);
    await page.selectOption('[data-testid="gender-select"]', testPatient.gender);
    await page.selectOption('[data-testid="blood-group-select"]', testPatient.bloodGroup);
    await page.fill('[data-testid="address-input"]', testPatient.address);
    await page.fill('[data-testid="emergency-contact-input"]', testPatient.emergencyContact);
    await page.fill('[data-testid="emergency-phone-input"]', testPatient.emergencyPhone);
    
    // Submit patient registration
    await page.click('[data-testid="save-patient-btn"]');
    await page.waitForSelector('[data-testid="patient-success-message"]', { timeout: 10000 });
    console.log('  Successfully registered new patient');
    
    // Step 4: Navigate to EMR for Clinical Encounter
    console.log(' Step 4: Creating clinical encounter...');
    await page.click('[data-testid="emr-menu"]');
    await page.waitForSelector('[data-testid="emr-page"]', { timeout: 10000 });
    
    // Select the newly created patient
    await page.waitForSelector('[data-testid="patient-select"]', { timeout: 10000 });
    await page.selectOption('[data-testid="patient-select"]', { label: new RegExp(`${testPatient.firstName} ${testPatient.lastName}`, 'i') });
    
    // Wait for patient data to load
    await page.waitForTimeout(2000);
    
    // Fill clinical encounter details
    await page.fill('[data-testid="chief-complaint-input"]', 'Test complaint - Fever and headache for 2 days');
    await page.fill('[data-testid="diagnosis-input"]', 'Viral Fever');
    await page.fill('[data-testid="notes-input"]', 'Patient presents with fever, headache, body pain. Vital signs stable. Prescribed antipyretics and rest.');
    
    // Add prescription
    await page.click('[data-testid="add-prescription-btn"]');
    await page.fill('[data-testid="medication-input"]', 'Paracetamol');
    await page.fill('[data-testid="dosage-input"]', '500mg');
    await page.selectOption('[data-testid="frequency-select"]', 'Three times daily');
    await page.fill('[data-testid="duration-input"]', '5 days');
    await page.fill('[data-testid="instructions-input"]', 'Take after food');
    
    // Save encounter
    await page.click('[data-testid="save-encounter-btn"]');
    await page.waitForSelector('[data-testid="encounter-success-message"]', { timeout: 10000 });
    console.log('  Successfully created clinical encounter');
    
    // Step 5: Verify Patient Name Display (Critical for E2E tests)
    console.log(' Step 5: Verifying patient name display...');
    const patientNameDisplay = page.locator(`text=${testPatient.lastName}`);
    await expect(patientNameDisplay).toBeVisible({ timeout: 10000 });
    console.log('  Patient name display verified');
    
    // Step 6: Navigate to Patient List to Verify Registration
    console.log(' Step 6: Verifying patient in registry...');
    await page.click('[data-testid="patients-menu"]');
    await page.waitForSelector('[data-testid="patients-page"]', { timeout: 10000 });
    
    // Search for the patient
    await page.fill('[data-testid="patient-search"]', testPatient.lastName);
    await page.waitForTimeout(2000);
    
    // Verify patient appears in list
    const patientInList = page.locator(`text=${testPatient.firstName} ${testPatient.lastName}`);
    await expect(patientInList).toBeVisible({ timeout: 10000 });
    console.log('  Patient verified in registry');
    
    // Step 7: Check Dashboard Statistics
    console.log(' Step 7: Checking dashboard statistics...');
    await page.click('[data-testid="dashboard-menu"]');
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
    
    // Wait for dashboard to load statistics
    await page.waitForTimeout(3000);
    
    // Verify dashboard has loaded with data
    const dashboardStats = page.locator('[data-testid="patient-stats"]');
    await expect(dashboardStats).toBeVisible({ timeout: 10000 });
    console.log('  Dashboard statistics verified');
    
    // Step 8: Test Patient Journey Completion
    console.log(' Step 8: Testing complete patient journey...');
    
    // Navigate back to EMR
    await page.click('[data-testid="emr-menu"]');
    await page.waitForSelector('[data-testid="emr-page"]', { timeout: 10000 });
    
    // Select the test patient again
    await page.selectOption('[data-testid="patient-select"]', { label: new RegExp(`${testPatient.firstName} ${testPatient.lastName}`, 'i') });
    await page.waitForTimeout(2000);
    
    // Verify patient history is accessible
    const patientHistory = page.locator('[data-testid="patient-history"]');
    await expect(patientHistory).toBeVisible({ timeout: 10000 });
    console.log('  Patient journey completed successfully');
    
    // Step 9: Logout
    console.log(' Step 9: Logging out...');
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-btn"]');
    await page.waitForSelector('[data-testid="login-page"]', { timeout: 10000 });
    console.log('  Successfully logged out');
    
    console.log('\n Complete Patient Journey Test: PASSED');
    console.log('\n Test Summary:');
    console.log(' Tenant: DEMO');
    console.log(' User: Doctor (rajesh@demo.hospital)');
    console.log(' Patient: Test Patient');
    console.log(' Steps Completed: 9/9');
    console.log(' Status: All functionalities working correctly');
    
    return true;
    
  } catch (error) {
    console.error('\n Patient Journey Test FAILED:', error.message);
    console.error('\n Failure Details:');
    console.error(` Step: ${error.step || 'Unknown'}`);
    console.error(` Error: ${error.message}`);
    console.error(` URL: ${page.url()}`);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: 'demo-test-failure.png' });
      console.log(' Screenshot saved: demo-test-failure.png');
    } catch (screenshotError) {
      console.log(' Could not capture screenshot');
    }
    
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testPatientJourney().then(success => {
  if (success) {
    console.log('\n Demo tenant patient journey test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n Demo tenant patient journey test failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Test execution failed:', error);
  process.exit(1);
});
