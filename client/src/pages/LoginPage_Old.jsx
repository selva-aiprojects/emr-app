import { useState } from 'react';

export default function LoginPage({ tenants, onLogin, loading, error }) {
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');

  const handleTenantChange = (e) => {
    setSelectedTenant(e.target.value);
    setShowDemoCredentials(false);
  };

  const getDemoCredentials = () => {
    switch (selectedTenant) {
      case 'superadmin':
        return { email: 'superadmin@emr.local', password: 'Admin@123', role: 'Platform Administrator' };
      case 'BHC':
        return { email: 'sarah@basic.health', password: 'Test@123', role: 'Basic Tier Demo' };
      case 'PMC':
        return { email: 'robert@professional.med', password: 'Test@123', role: 'Professional Tier Demo' };
      case 'EHS':
        return { email: 'michael@enterprise.hos', password: 'Test@123', role: 'Enterprise Tier Demo' };
      default:
        return null;
    }
  };

  const demoCreds = getDemoCredentials();

  return (
    <div className="login-portal premium-theme">
      {/* Abstract Medical Background */}
      <div className="bg-visual-elements">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="glass-grid"></div>
      </div>

      <div className="login-wrapperContainer">
        <div className="login-primary-card premium-glass">
          <div className="login-header-block">
            <div className="logo-container">
              <div className="logo-wrapper">
                <div className="logo-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                    <polyline points="9 22 9 12"/>
                    <path d="M9 12V9a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v3"/>
                  </svg>
                </div>
                <div className="logo-text">
                  <h1 className="logo-title">MedFlow</h1>
                  <p className="logo-subtitle">Enterprise EMR</p>
                </div>
              </div>
            </div>
            <div className="brand-info">
              <h2 className="brand-title">Healthcare Management Platform</h2>
              <p className="brand-subtitle">Secure • Scalable • Feature-Rich</p>
            </div>
            <div className="feature-badges">
              <span className="badge">🔒 Enterprise Security</span>
              <span className="badge">⚡ Lightning Fast</span>
              <span className="badge">🏥 HIPAA Compliant</span>
              <span className="badge">🎯 Feature Flags Active</span>
            </div>
          </div>

          <form className="auth-form" onSubmit={onLogin}>
            <div className="field-group">
              <label className="field-label">
                Healthcare Organization
                <span className="required-indicator">*</span>
              </label>
              <div className="selector-custom">
                <select 
                  name="tenantId" 
                  required 
                  className="auth-select"
                  onChange={handleTenantChange}
                  value={selectedTenant}
                >
                  <option value="" disabled selected>Identify your facility...</option>
                  <option value="superadmin" className="opt-admin">🛡️ Platform Administration Control</option>
                  {Array.isArray(tenants) && tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.subscriptionTier === 'Enterprise' && '🏢 '}
                      {t.subscriptionTier === 'Professional' && '⭐ '}
                      {t.subscriptionTier === 'Basic' && '🩺 '}
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="arrow-down"></div>
              </div>
            </div>

            <div className="field-split">
              <div className="field-group">
                <label className="field-label">
                  Professional Email
                  <span className="required-indicator">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="name@facility.com"
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">
                Security Credential
                <span className="required-indicator">*</span>
              </label>
              <input
                name="password"
                type="password"
                placeholder="•••••••••"
                required
                autoComplete="current-password"
                className="auth-input"
              />
            </div>

            {/* Demo Credentials Helper */}
            {selectedTenant && demoCreds && (
              <div className="demo-credentials">
                <div className="demo-header">
                  <button 
                    type="button" 
                    className="demo-toggle"
                    onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                  >
                    🎭 Demo Credentials {showDemoCredentials ? '▼' : '▶'}
                  </button>
                  <span className="demo-role">{demoCreds.role}</span>
                </div>
                {showDemoCredentials && (
                  <div className="demo-details">
                    <div className="demo-field">
                      <label>Email:</label>
                      <input 
                        type="text" 
                        value={demoCreds.email} 
                        readOnly 
                        className="demo-input"
                        onClick={(e) => e.target.select()}
                      />
                    </div>
                    <div className="demo-field">
                      <label>Password:</label>
                      <input 
                        type="text" 
                        value={demoCreds.password} 
                        readOnly 
                        className="demo-input"
                        onClick={(e) => e.target.select()}
                      />
                    </div>
                    <div className="demo-tip">💡 Click to copy, then paste above</div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn-access-portal" disabled={loading}>
              {loading ? (
                <div className="btn-spinner">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <>
                  <span>Initialize Secure Session</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 19"></polyline></svg>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="auth-error-panel">
              <div className="err-indicator">!</div>
              <div className="err-text">{error}</div>
            </div>
          )}

          <div className="login-legal-footer">
            <p>Protected by Enterprise-Grade Encryption</p>
            <div className="legal-links">
              <span>Security Policy</span>
              <span>•</span>
              <span>Compliance Center</span>
            </div>
          </div>
        </div>

        <div className="platform-meta">
          <p>© 2026 MedFlow Solutions Group. All rights reserved.</p>
          <div className="system-info">
            <span>Version 2.0.0</span>
            <span>•</span>
            <span>Feature Flags Enabled</span>
          </div>
        </div>
      </div>

      <style>{`
        .login-portal {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* Animated Background Elements */
        .bg-visual-elements { position: absolute; inset: 0; z-index: 0; }
        .blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; animation: orbit 20s infinite linear; }
        .blob-1 { top: -10%; right: -5%; width: 500px; height: 500px; background: #10b981; }
        .blob-2 { bottom: -10%; left: -5%; width: 600px; height: 600px; background: #3b82f6; }
        .glass-grid { position: absolute; inset: 0; background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px); background-size: 30px 30px; opacity: 0.2; }
        
        @keyframes orbit {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(0,0) scale(1); }
        }

        .login-wrapperContainer {
          width: 100%;
          max-width: 520px;
          padding: 2rem;
          position: relative;
          z-index: 10;
        }

        .premium-glass {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 1);
          border-radius: 2rem;
          padding: 3.5rem 3rem;
          box-shadow: 0 40px 80px -20px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .login-header-block { text-align: center; }
        .logo-container { margin-bottom: 2rem; }
        .logo-wrapper { 
          display: flex; flex-direction: column; align-items: center; 
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .logo-icon { 
          width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #059669); 
          border-radius: 16px; display: grid; place-items: center; 
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }
        .logo-icon svg { 
          color: white; stroke-width: 1.5; 
        }
        .logo-text { text-align: center; }
        .logo-title { 
          font-size: 2rem; font-weight: 900; color: #0f172a; 
          margin: 0; letter-spacing: -0.02em; line-height: 1;
        }
        .logo-subtitle { 
          font-size: 0.9rem; color: #64748b; font-weight: 600; 
          margin: 0; margin-top: 0.25rem;
        }
        .brand-info { text-align: center; margin-bottom: 2rem; }
        .brand-title { 
          font-size: 1.5rem; font-weight: 800; color: #1e293b; 
          margin: 0; margin-bottom: 0.5rem;
        }
        .brand-subtitle { 
          font-size: 1rem; color: #64748b; font-weight: 500; 
          margin: 0; display: flex; justify-content: center; gap: 8px;
        }
        .brand-subtitle::before,
        .brand-subtitle::after {
          content: '•';
          color: #cbd5e1;
        }
        .corp-logo { display: none; }
        
        .feature-badges { display: flex; justify-content: center; gap: 8px; margin-top: 1rem; }
        .badge { 
          background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 20px; 
          font-size: 0.7rem; font-weight: 700; border: 1px solid #e2e8f0;
        }

        .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .field-group { display: flex; flex-direction: column; gap: 8px; }
        .field-label { 
          font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; 
          letter-spacing: 0.05em; padding-left: 2px; display: flex; align-items: center; gap: 4px;
        }
        .required-indicator { color: #ef4444; font-size: 0.8rem; }

        .selector-custom { position: relative; }
        .auth-select, .auth-input {
          width: 100%; padding: 14px 16px; background: #f1f5f9; border: 1.5px solid transparent; border-radius: 14px;
          font-family: inherit; font-size: 0.95rem; color: #1e293b; transition: all 0.2s; font-weight: 500; outline: none; appearance: none;
        }
        .auth-select:focus, .auth-input:focus {
          background: white; border-color: #3b82f6; box-shadow: 0 0 0 5px rgba(59,130,246,0.1);
        }
        .arrow-down { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #64748b; pointer-events: none; }
        .opt-admin { font-weight: 800; color: #3b82f6; }

        .demo-credentials {
          background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; overflow: hidden;
        }
        .demo-header { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 12px 16px; background: #dcfce7; cursor: pointer;
        }
        .demo-toggle { 
          background: none; border: none; font-size: 0.85rem; font-weight: 700; 
          color: #15803d; cursor: pointer; display: flex; align-items: center; gap: 8px;
        }
        .demo-role { 
          background: #15803d; color: white; padding: 4px 8px; border-radius: 6px; 
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
        }
        .demo-details { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .demo-field { display: flex; align-items: center; gap: 12px; }
        .demo-field label { font-size: 0.8rem; font-weight: 600; color: #374151; min-width: 60px; }
        .demo-input { 
          flex: 1; padding: 8px 12px; background: white; border: 1px solid #d1d5db; 
          border-radius: 6px; font-family: monospace; font-size: 0.85rem; cursor: pointer;
        }
        .demo-tip { 
          text-align: center; font-size: 0.75rem; color: #6b7280; 
          font-style: italic; margin-top: 4px;
        }

        .btn-access-portal {
          margin-top: 1rem; padding: 16px; background: #0f172a; color: white; border: none; border-radius: 14px;
          font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.2);
        }
        .btn-access-portal:hover:not(:disabled) { background: #1e293b; transform: translateY(-2px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.3); }
        .btn-access-portal:active { transform: translateY(0); }
        .btn-access-portal:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-spinner { display: flex; gap: 4px; }
        .btn-spinner span { width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 1.4s infinite ease-in-out; opacity: 0.6; }
        .btn-spinner span:nth-child(2) { animation-delay: 0.2s; }
        .btn-spinner span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        .auth-error-panel {
          padding: 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
          display: flex; align-items: center; gap: 12px; animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .err-indicator { width: 22px; height: 22px; background: #ef4444; color: white; border-radius: 50%; display: grid; place-items: center; font-weight: 900; font-size: 14px; }
        .err-text { color: #991b1b; font-size: 0.85rem; font-weight: 600; }
        
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

        .login-legal-footer { text-align: center; border-top: 1.5px solid #f1f5f9; padding-top: 2rem; }
        .login-legal-footer p { font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin: 0; margin-bottom: 8px; }
        .legal-links { display: flex; justify-content: center; gap: 12px; font-size: 0.75rem; font-weight: 800; color: #334155; }
        
        .platform-meta { text-align: center; margin-top: 2.5rem; }
        .platform-meta p { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
        .system-info { 
          display: flex; justify-content: center; gap: 8px; margin-top: 8px; 
          font-size: 0.7rem; color: #6b7280; font-weight: 600;
        }
      `}</style>
    </div>
  );
}
