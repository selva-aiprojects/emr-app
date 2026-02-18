import { useState, useEffect } from 'react';
import axios from 'axios';

export default function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  // Demo credentials for each tenant
  const demoCredentials = {
    'superadmin': {
      email: 'superadmin@emr.local',
      password: 'Admin@123'
    },
    'EHS': {
      email: 'michael@enterprise.hos',
      password: 'Test@123'
    },
    'PMC': {
      email: 'robert@professional.med',
      password: 'Test@123'
    },
    'BHC': {
      email: 'sarah@basic.health',
      password: 'Test@123'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/login', credentials);
      const { token, user, tenantId, role } = response.data;
      
      onLogin({ token, user, tenantId, role });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantChange = (tenantId) => {
    setCredentials(prev => ({ ...prev, tenantId }));
    setShowDemoCredentials(false);
  };

  const useDemoCredentials = () => {
    const demo = demoCredentials[credentials.tenantId];
    if (demo) {
      setCredentials(prev => ({
        ...prev,
        email: demo.email,
        password: demo.password
      }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="login-portal">
      <div className="login-container">
        <div className="login-branding">
          <div className="brand-content">
            <div className="logo-section">
              <img 
                src="/Medflow-logo.jpg" 
                alt="MedFlow EMR" 
                className="medflow-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="medflow-logo-fallback" style={{display: 'none'}}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="url(#gradient)" />
                  <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="6" r="2" fill="white" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0F4C75" />
                      <stop offset="100%" stopColor="#2E86AB" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h1 className="brand-title">MedFlow EMR</h1>
            <p className="brand-subtitle">Enterprise Healthcare Management</p>
            <div className="brand-features">
              <div className="feature-item">🏥 Hospital Management</div>
              <div className="feature-item">👥 Patient Records</div>
              <div className="feature-item">💊 Pharmacy System</div>
              <div className="feature-item">📊 Analytics</div>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-card">
            <div className="card-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your MedFlow account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  Select Tenant <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={credentials.tenantId}
                    onChange={(e) => handleTenantChange(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Choose your organization</option>
                    <option value="superadmin">🛡️ Platform Superadmin</option>
                    <option value="EHS">🏥 Enterprise Hospital Systems</option>
                    <option value="PMC">⭐ Professional Medical Center</option>
                    <option value="BHC">🩺 Basic Health Clinic</option>
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {credentials.tenantId && (
                <div className="demo-section">
                  <button
                    type="button"
                    onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                    className="demo-toggle"
                  >
                    <span>🔑 Demo Credentials</span>
                    <span className="demo-role">
                      {credentials.tenantId === 'superadmin' ? 'Superadmin' :
                       credentials.tenantId === 'EHS' ? 'Enterprise' :
                       credentials.tenantId === 'PMC' ? 'Professional' : 'Basic'}
                    </span>
                    <span>{showDemoCredentials ? '▲' : '▼'}</span>
                  </button>

                  {showDemoCredentials && (
                    <div className="demo-details">
                      <div className="demo-field">
                        <label>Email:</label>
                        <input
                          type="text"
                          value={demoCredentials[credentials.tenantId]?.email || ''}
                          readOnly
                          className="demo-input"
                          onClick={() => copyToClipboard(demoCredentials[credentials.tenantId]?.email || '')}
                        />
                      </div>
                      <div className="demo-field">
                        <label>Password:</label>
                        <input
                          type="text"
                          value={demoCredentials[credentials.tenantId]?.password || ''}
                          readOnly
                          className="demo-input"
                          onClick={() => copyToClipboard(demoCredentials[credentials.tenantId]?.password || '')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={useDemoCredentials}
                        className="demo-toggle"
                        style={{background: 'var(--success-green)', color: 'white', border: 'none'}}
                      >
                        🚀 Use Demo Login
                      </button>
                      <p className="demo-tip">Click on fields to copy credentials</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="error-message">
                  <div className="error-icon">!</div>
                  <span className="error-text">{error}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="login-button">
                {isLoading ? (
                  <>
                    <div className="button-spinner">
                      <div className="spinner"></div>
                    </div>
                    Signing in...
                  </>
                ) : (
                  <>
                    🔐 Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>© 2026 MedFlow Solutions Group. All rights reserved.</p>
        <div className="footer-links">
          <span>Security Policy</span>
          <span>•</span>
          <span>Compliance Center</span>
        </div>
      </div>
    </div>
  );
}
