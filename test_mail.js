import { sendTenantWelcomeEmail } from './server/services/mail.service.js';

async function test() {
  const targetEmail = 'b.selvakumar@gmail.com';
  console.log(`🚀 Dispatching inaugural multi-tenant communication test to: ${targetEmail}`);
  
  const result = await sendTenantWelcomeEmail(
    targetEmail,
    'Healthezee Validation Node',
    'validation-node',
    { email: `admin@validation-node.com`, password: 'Medflow@2026' }
  );
  
  if (result.success) {
    if (result.mocked) {
      console.log('✅ [MOCK_STABILIZED] Email transmission bypassed. API Key is missing or invalid.');
    } else {
      console.log('✅ [LIVE_SHARD] Email successfully dispatched to Resend cloud.');
      console.log('Response:', result.data);
    }
  } else {
    console.error('❌ [COMMUNICATION_FAILURE] Resend API rejected the request.');
    console.error('Error Details:', result.error);
  }
}

test();
