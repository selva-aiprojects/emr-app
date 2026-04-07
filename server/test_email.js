import { sendTenantWelcomeEmail } from './services/mail.service.js';

async function runTest() {
  console.log("🚀 Initializing Live Email Test...");
  try {
    const result = await sendTenantWelcomeEmail(
      "b.selvakumar@gmail.com",
      "Dynamic Healthcare",
      "dynamic",
      { email: "admin@dynamic.com", password: "Admin@123" }
    );
    console.log("✅ Email Dispatch Complete!", result);
  } catch (error) {
    console.error("❌ Email Dispatch Failed:", error);
  }
  process.exit();
}

runTest();
