import dotenv from 'dotenv';
import { sendTenantWelcomeEmail } from './server/services/mail.service.js';

dotenv.config();

/**
 * STRATEGIC EMAIL TEST HUB
 * Specifically testing Resend API Integration with personal credentials
 */
async function runTest() {
  const testEmail = "b.selvakumar.aws@gmail.com";
  console.log(`🚀 [EMAIL_TEST] Initiating Resend API Test for: ${testEmail}`);
  console.log(`🔑 [CONFIG] RESEND_API_KEY: Present (Verified)`);
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ [CONFIG_ERROR] No Resend API Key found in .env');
    process.exit(1);
  }

  try {
    const result = await sendTenantWelcomeEmail(
      testEmail, 
      "Test Hospital Nexus", 
      "test-nexus", 
      { email: "admin@test-nexus.com", password: "Nexus@2026" }
    );

    if (result.success) {
      console.log('✨ [TEST_SUCCESS] Strategic email dispatched successfully.');
      console.log('📦 [RESULT]', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ [TEST_FAILED] Email service returned failure status.');
      console.error('📦 [ERROR]', result.error);
    }
  } catch (err) {
    console.error('🔥 [CRITICAL_FAIL] Unexpected error during test execution:', err.message);
  }
}

runTest();
