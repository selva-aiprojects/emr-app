import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

dotenv.config();

/**
 * Send Tenant Welcome Email
 * Prioritizes Resend API, falls back to SMTP, then Mock
 */
export async function sendTenantWelcomeEmail(email, tenantName, subdomain, credentials) {
  const fromName = "MedFlow Platform";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "onboarding@resend.dev";
  const subject = `Welcome to MedFlow: ${tenantName} Workspace Initialized`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px">MedFlow Activation</h1>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0" />
      <p style="color: #64748b; font-size: 14px">Your institutional node for <strong>${tenantName}</strong> has been successfully provisioned on the Healthcare Grid.</p>
      <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9">
        <h3 style="margin-top: 0; font-size: 15px; color: #011627; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em">WORKSPACE TOPOLOGY</h3>
        <p style="margin: 8px 0; font-size: 14px; color: #334155"><strong>Access Terminal:</strong> <a href="https://${subdomain}.medflow.app" style="color: #1e4d78; font-weight: 700">https://${subdomain}.medflow.app</a></p>
        <div style="height: 1px; background: #e2e8f0; margin: 20px 0"></div>
        <h3 style="margin-top: 0; font-size: 15px; color: #011627; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em">INITIAL SECURITY TOKEN</h3>
        <p style="margin: 8px 0; font-size: 14px; color: #334155"><strong>Sync Identifier:</strong> ${credentials.email}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #334155"><strong>Security Code:</strong> <code style="background: #011627; color: #ffffff; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace">${credentials.password}</code></p>
      </div>
      <p style="color: #64748b; font-size: 12px; font-style: italic">* Re-initialize your security token after your first successful synchronization for compliance.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em">neural clinical governance • medflow v1.0</p>
    </div>
  `;

  // --- STRATEGY 1: RESEND API (High Reliability) ---
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [email],
          subject: subject,
          html: htmlContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✉️ [RESEND_SUCCESS] Email dispatched via API:', data.id);
        return { success: true, messageId: data.id };
      } else {
        const error = await response.text();
        console.warn('⚠️ [RESEND_API_FAIL] status:', response.status, error);
      }
    } catch (e) {
      console.warn('⚠️ [RESEND_BRIDGE_ERROR]', e.message);
    }
  }

  // --- STRATEGY 2: SMTP FALLBACK (Standard) ---
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const info = await transporter.sendMail({ from: `${fromName} <${fromEmail}>`, to: email, subject, html: htmlContent });
    console.log('✉️ [SMTP_SUCCESS] Email dispatched via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn('❌ [MAIL_SERVICE_FAIL] SMTP Dispatch failure:', err.message);
    
    // --- STRATEGY 3: MOCK FAIL-SAFE (Dev only) ---
    if (process.env.NODE_ENV === 'development') {
      console.log('✉️ [MAIL_MOCK] Reverting to mock log due to all-dispatch failure.');
      return { success: true, mocked: true };
    }
    return { success: false, error: err.message };
  }
}
