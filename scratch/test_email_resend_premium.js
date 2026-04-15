import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

/**
 * Diagnostic script to test the NEW Premium Resend template
 * Run with: node scratch/test_email_resend_premium.js
 */
async function diagnosticTest() {
  const apiKey = process.env.RESEND_API_KEY;
  const testEmail = 'b.selvakumar.aws@gmail.com'; 
  const tenantName = "Premium Diagnostic Lab";
  const subdomain = "premium-lab";
  const password = "Secur3_Pass_!2026";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { background-color: #f8fafc; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .header p { color: #94a3b8; margin: 8px 0 0; font-size: 14px; font-weight: 500; }
        .content { padding: 40px; }
        .welcome-text { font-size: 16px; color: #475569; margin-bottom: 32px; }
        .credential-box { background: #f1f5f9; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 32px; }
        .box-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; display: block; }
        .credential-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
        .credential-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .label { font-size: 14px; color: #64748b; }
        .value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .password-badge { background: #0f172a; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .action-container { text-align: center; margin: 32px 0; }
        .button { background: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; transition: background 0.2s; }
        .footer { padding: 32px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
        .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
        .alert { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 32px; border-radius: 4px; }
        .alert p { margin: 0; font-size: 13px; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Healthezee Activation</h1>
            <p>Institutional Node Initialized Successfully</p>
          </div>
          <div class="content">
            <div class="welcome-text">
              Hello, your new healthcare workspace for <strong>${tenantName}</strong> has been provisioned. You now have full access to the EMR, Billing, Pharmacy, and AI Analytics modules.
            </div>

            <div class="credential-box">
              <span class="box-label">Access Configuration</span>
              <div class="credential-item">
                <span class="label">Access Terminal</span>
                <span class="value"><a href="https://emr-app-orpin.vercel.app/" style="color: #2563eb;">Workspace Portal</a></span>
              </div>
              <div class="credential-item">
                <span class="label">Organization ID</span>
                <span class="value">${subdomain.toUpperCase()}</span>
              </div>
              <div class="credential-item">
                <span class="label">Admin Identifier</span>
                <span class="value">admin@${subdomain}.com</span>
              </div>
              <div class="credential-item" style="border-bottom: none; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #e2e8f0;">
                <span class="label" style="font-weight: 600; color: #0f172a;">Temporary Security Key</span>
                <span class="password-badge">${password}</span>
              </div>
            </div>

            <div class="alert">
              <p><strong>Security Notice:</strong> Please change your password immediately after your first login to maintain clinical compliance standards.</p>
            </div>

            <div class="action-container">
              <a href="https://emr-app-orpin.vercel.app/" class="button">Launch Workspace</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Healthezee Platform • Neural Clinical Governance</p>
            <p style="margin-top: 8px; font-size: 10px;">This is an automated system message for institutional onboarding.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('--- Resend Premium Template Test ---');
  
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
        subject: `Welcome to Healthezee: ${tenantName} Workspace Initialized`,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success! Message ID:', data.id);
      console.log('Check your verified inbox for the NEW premium design.');
    } else {
      console.error('❌ API Error:', response.status, data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

diagnosticTest();
