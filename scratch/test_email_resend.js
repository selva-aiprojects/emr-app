import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

/**
 * Diagnostic script to test Resend API delivery
 * Run with: node scratch/test_email_resend.js
 */
async function diagnosticTest() {
  const apiKey = process.env.RESEND_API_KEY;
  const testEmail = 'b.selvakumar.aws@gmail.com'; // Hardcoded for sandbox test

  console.log('--- Resend API Diagnostic ---');
  console.log('API Key Found:', apiKey ? 'Yes (starts with ' + apiKey.substring(0, 5) + '...)' : 'No');
  console.log('Target Email:', testEmail);

  if (!apiKey) {
    console.error('Error: RESEND_API_KEY is missing from .env');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [testEmail],
        subject: "Resend Diagnostic: Medflow EMR",
        html: `
          <h1>Diagnostic Successful</h1>
          <p>This is a manual test to verify that your Resend API key is valid and authorized to send to <strong>${testEmail}</strong>.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success! Message ID:', data.id);
      console.log('Check your inbox (and Spam folder) for the "Resend Diagnostic" subject.');
    } else {
      console.error('❌ API Error:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 403) {
        console.warn('\nSUGGESTION: Status 403 usually means the "to" email is not verified in your Resend account.');
        console.warn('Check: https://resend.com/emails to see if the email is on your authorized list.');
      }
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

diagnosticTest();
