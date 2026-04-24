import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Send Tenant Welcome Email
 * Prioritizes Resend API, falls back to SMTP, then Mock
 */
export async function sendTenantWelcomeEmail(email, tenantName, subdomain, credentials) {
  const loginEmail = credentials?.email || email;
  const loginPassword = credentials?.password || '';
  const fromName = "Healthezee Platform";
  // Explicitly force the verified domain instead of relying on .env file fallback
  const fromEmail = "Healthezee Platform <care@cognivectra.com>";
  const subject = `Welcome to Healthezee: ${tenantName} Workspace Initialized`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Healthezee EMR - ${tenantName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #1e293b; line-height: 1.6; }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .email-container { background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); margin: 40px 20px; }
    .hero-section { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); color: white; padding: 60px 40px; text-align: center; position: relative; }
    .hero-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); opacity: 0.4; }
    .hero-icon { width: 80px; height: 80px; margin: 0 auto 24px; background: rgba(255,255,255,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); }
    .hero-title { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 12px 0; }
    .hero-subtitle { font-size: 18px; font-weight: 500; opacity: 0.95; margin: 0 0 8px 0; }
    .hero-badge { display: inline-flex; background: rgba(59,130,246,0.2); color: #3b82f6; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid rgba(59,130,246,0.3); }
    .content-section { padding: 60px 40px; }
    .welcome-card { background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%); border-radius: 20px; padding: 40px; margin-bottom: 32px; border: 1px solid rgba(59,130,246,0.1); box-shadow: 0 4px 20px rgba(59,130,246,0.08); }
    .welcome-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0 0 16px 0; letter-spacing: -0.01em; }
    .welcome-text { font-size: 16px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin: 32px 0; }
    .feature-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); border-radius: 16px; padding: 24px; text-align: center; border: 1px solid rgba(59,130,246,0.1); transition: all 0.3s ease; }
    .feature-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(59,130,246,0.15); }
    .feature-icon { width: 48px; height: 48px; margin: 0 auto 12px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .feature-name { font-weight: 700; font-size: 14px; color: #1e293b; margin: 0; }
    .credentials-card { background: white; border-radius: 24px; padding: 48px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); position: relative; overflow: hidden; }
    .credentials-card::before { content: ''; position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 50%); }
    .credentials-header { font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 28px; display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
    .credentials-header svg { width: 20px; height: 20px; }
    .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid rgba(226,232,240,0.5); position: relative; z-index: 1; }
    .credential-row:last-of-type { border-bottom: none; padding-bottom: 0; }
    .credential-label { font-size: 15px; color: #374151; font-weight: 500; min-width: 160px; }
    .credential-value { font-size: 15px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', 'Cascadia Code', monospace; background: rgba(15,23,42,0.05); padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(226,232,240,0.5); min-width: 240px; text-align: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); }
    .credential-value a { color: #3b82f6; text-decoration: none; font-weight: 600; }
    .credential-value a:hover { text-decoration: underline; }
    .security-notice { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid rgba(245,158,11,0.3); border-left: 6px solid #f59e0b; border-radius: 16px; padding: 28px; margin: 40px 0; position: relative; overflow: hidden; }
    .security-notice::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #f59e0b, #eab308); }
    .security-title { font-size: 16px; font-weight: 800; color: #92400e; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
    .security-title svg { width: 20px; height: 20px; flex-shrink: 0; }
    .security-text { margin: 0; font-size: 14px; color: #92400e; line-height: 1.6; }
    .cta-section { text-align: center; margin: 56px 0; }
    .cta-button { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); color: white; padding: 20px 56px; border-radius: 20px; font-weight: 800; font-size: 17px; text-decoration: none; display: inline-flex; align-items: center; gap: 16px; box-shadow: 0 20px 40px rgba(59,130,246,0.4); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; min-height: 64px; }
    .cta-button:hover { transform: translateY(-4px); box-shadow: 0 30px 60px rgba(59,130,246,0.5); }
    .cta-button:active { transform: translateY(-2px); }
    .cta-button::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); transition: left 0.6s; }
    .cta-button:hover::before { left: 100%; }
    .cta-glow { margin-top: 24px; font-size: 14px; color: #64748b; font-weight: 500; }
    .footer-section { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 48px 40px; text-align: center; border-top: 1px solid rgba(226,232,240,0.8); }
    .footer-logo { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; letter-spacing: -0.03em; }
    .footer-text { color: #64748b; font-size: 15px; margin-bottom: 28px; font-weight: 500; }
    .footer-links { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-bottom: 24px; }
    .footer-link { color: #475569; text-decoration: none; font-weight: 600; font-size: 13px; transition: all 0.3s ease; position: relative; }
    .footer-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: #3b82f6; transition: width 0.3s ease; }
    .footer-link:hover { color: #3b82f6; }
    .footer-link:hover::after { width: 100%; }
    .compliance-badge { display: inline-flex; background: rgba(34,197,94,0.2); color: #059669; padding: 8px 20px; border-radius: 25px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid rgba(34,197,94,0.3); margin-top: 16px; }
    @media (max-width: 600px) {
      .content-section, .hero-section { padding-left: 24px; padding-right: 24px; }
      .credential-row { flex-direction: column; align-items: flex-start; gap: 12px; text-align: left; }
      .credential-label { min-width: auto; }
      .credential-value { min-width: auto; width: 100%; }
      .cta-button { padding: 18px 40px; font-size: 16px; width: 100%; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="hero-section">
        <div class="hero-icon" style="border: none; background: none; box-shadow: none;">
          <img src="https://healthezee-hms.vercel.app/healthezee-logo-reg.png" alt="Healthezee Logo" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <h1 class="hero-title">Healthezee EMR Platform Activated</h1>
        <p class="hero-subtitle">${tenantName} Institutional Workspace Ready</p>
        <div class="hero-badge">Provisioning Complete</div>
      </div>
      <div class="content-section">
        <div class="welcome-card">
          <h2 class="welcome-title">🎉 Your Healthcare Platform is Live</h2>
          <p class="welcome-text">
            Welcome to your fully provisioned <strong>${tenantName}</strong> workspace. 
            Get started with comprehensive EMR, intelligent billing, pharmacy management, and AI-powered analytics.
          </p>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4.354a4 4 0 1 1 5.646 0M15 21H9m12-9a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="feature-name">Clinical EMR</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M2 12h20" stroke="%2318c784" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="feature-name">Pharmacy Management</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 7H3v10h18V7h-5M10 11V7h4v4M10 15h4" stroke="%23f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="feature-name">Intelligent Billing</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="%238b5cf6" stroke-width="2"/>
                  <path d="M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="%238b5cf6" stroke-width="2"/>
                  <path d="M17.8 15.8a4 4 0 0 0-7.6 0" stroke="%238b5cf6" stroke-width="2"/>
                </svg>
              </div>
              <div class="feature-name">AI Analytics</div>
            </div>
          </div>
        </div>

        <div class="credentials-card">
          <div class="credentials-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%231e293b" stroke-width="2"><circle cx="12" cy="8" r="3"/><path d="M20.59 13.41a8 8 0 1 1-7.18-7.18"/><path d="M14 14a4 4 0 0 0-8 0"/></svg>
            Secure Access Credentials
          </div>
          <div class="credential-row">
            <span class="credential-label">Portal Access</span>
            <a href="https://healthezee-hms.vercel.app/" class="credential-value">healthezee-hms.vercel.app</a>
          </div>
          <div class="credential-row">
            <span class="credential-label">Organization ID</span>
            <span class="credential-value">${subdomain.toUpperCase()}-EMR</span>
          </div>
          <div class="credential-row">
            <span class="credential-label">Admin Login</span>
            <span class="credential-value">${loginEmail}</span>
          </div>
          <div class="credential-row" style="border-top: 2px dashed rgba(226,232,240,0.8); padding-top: 24px; margin-top: 16px;">
            <span class="credential-label" style="color: #dc2626; font-weight: 800;">Temporary Access Key</span>
            <code class="credential-value" style="letter-spacing: 1px; font-size: 16px;">${loginPassword}</code>
          </div>
        </div>

        <div class="security-notice">
          <div class="security-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23b45309" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            Security &amp; Compliance Priority
          </div>
          <p class="security-text">
            <strong>Immediate Actions Required:</strong> Change password on first login. Enable 2FA. Review team access roles. 
            Clinical compliance <em>requires</em> these steps within 24 hours.
          </p>
        </div>

        <div class="cta-section">
          <a href="https://healthezee-hms.vercel.app/" class="cta-button">
            🚀 Launch ${tenantName} EMR Platform
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
          </a>
          <p class="cta-glow">Need assistance? <a href="mailto:support@healthezee.com" style="color: #3b82f6; font-weight: 600;">Contact Support Team</a></p>
        </div>
      </div>
      <div class="footer-section">
        <div class="footer-logo">Healthezee</div>
        <p class="footer-text">Neural Clinical Intelligence &amp; EMR Platform © 2026</p>
        <div class="footer-links">
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Service</a>
          <a href="#" class="footer-link">Support Portal</a>
          <a href="#" class="footer-link">HIPAA Compliance</a>
        </div>
        <div class="compliance-badge">HIPAA &amp; GDPR Compliant</div>
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; line-height: 1.4;">
          Sent to ${email} • Automated Institutional Onboarding System
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // --- LOCAL DUMP (Best for checking delivery content instantly) ---
  try {
    const dumpPath = path.join(process.cwd(), 'server', 'logs');
    if (!fs.existsSync(dumpPath)) fs.mkdirSync(dumpPath, { recursive: true });
    const fileName = `latest_mail_preview.html`;
    fs.writeFileSync(path.join(dumpPath, fileName), htmlContent);
    console.log(`✉️ [MAIL_PREVIEW] Local copy saved: server/logs/${fileName}`);
  } catch (err) {
    console.warn('⚠️ [MAIL_PREVIEW_ERR] Failed to save local copy:', err.message);
  }

  // --- STRATEGY 1: RESEND API (High Reliability) ---
  if (process.env.RESEND_API_KEY) {
    try {
      const configuredOverride = String(process.env.EMAIL_OVERRIDE_TO || '').trim();
      const recipientEmail = configuredOverride || email;
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [recipientEmail],
          subject: subject,
          html: htmlContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✉️ [RESEND_SUCCESS] Email dispatched via API to ${recipientEmail}:`, data.id);
        return { success: true, messageId: data.id };
      } else {
        const error = await response.text();
        console.warn('⚠️ [RESEND_API_FAIL] status:', response.status, error);
      }
    } catch (e) {
      console.warn('⚠️ [RESEND_BRIDGE_ERROR]', e.message);
    }
  }

  // --- STRATEGY 2: SMTP (Standard Nodemailer) ---
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or use host/port if provided
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD
        }
      });

      const info = await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent
      });

      console.log('✉️ [SMTP_SUCCESS] Email dispatched:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr) {
      console.warn('⚠️ [SMTP_ERROR] Failed to send via SMTP:', smtpErr.message);
    }
  }

  // --- MOCK FAIL-SAFE ---
  console.log('✉️ [MAIL_MOCK] Reverting to mock log. Resend/SMTP failed or not configured.');
  return { success: true, mocked: true };
}
