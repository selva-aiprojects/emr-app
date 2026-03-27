import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendTenantWelcomeEmail(email, tenantName, subdomain, credentials) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === 're_123456789') {
    console.log('✉️ [MAIL_MOCK] Sending Tenant Welcome Email:', { email, tenantName, subdomain, credentials });
    return { success: true, mocked: true };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'MedFlow Platform <onboarding@resend.dev>',
        to: [email],
        subject: `Welcome to MedFlow: ${tenantName} Workspace Initialized`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px">MedFlow Activation</h1>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0" />
            
            <p style="color: #64748b; font-size: 14px">Your institutional node for <strong>${tenantName}</strong> has been successfully provisioned on the Healthcare Grid.</p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9">
              <h3 style="margin-top: 0; font-size: 15px; color: #011627; font-weight: 900; uppercase; tracking-wider">WORKSPACE TOPOLOGY</h3>
              <p style="margin: 8px 0; font-size: 14px; color: #334155"><strong>Access Terminal:</strong> <a href="https://${subdomain}.medflow.app" style="color: #1e4d78; font-weight: 700">https://${subdomain}.medflow.app</a></p>
              
              <div style="height: 1px; background: #e2e8f0; margin: 20px 0"></div>

              <h3 style="margin-top: 0; font-size: 15px; color: #011627; font-weight: 900; uppercase; tracking-wider">INITIAL SECURITY TOKEN</h3>
              <p style="margin: 8px 0; font-size: 14px; color: #334155"><strong>Sync Identifier:</strong> ${credentials.email}</p>
              <p style="margin: 8px 0; font-size: 14px; color: #334155"><strong>Security Code:</strong> <code style="background: #011627; color: #ffffff; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace">${credentials.password}</code></p>
            </div>

            <p style="color: #64748b; font-size: 12px; font-style: italic">* Re-initialize your security token after your first successful synchronization for compliance.</p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em">neural clinical governance • medflow v1.0</p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Resend API Error:', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Mail Service Fetch Error:', err);
    return { success: false, error: err.message };
  }
}
