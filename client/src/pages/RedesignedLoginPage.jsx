import { useMemo, useState } from 'react';
import { BRAND } from '../config/branding.js';
import { AlertCircle, ArrowRight, Activity, Database, Mail, Lock, Eye, EyeOff, Shield, User, Building2, Stethoscope } from 'lucide-react';
import '../styles/login.css';

export default function RedesignedLoginPage({ onLogin, tenants, loading: propLoading, error: propError }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const isLoading = propLoading || internalLoading;
  const error = propError || internalError;

  const tenantOptions = useMemo(() => tenants || [], [tenants]);

  const demoCredentials = {
    superadmin: {
      label: 'Platform Admin',
      email: 'superadmin@emr.local',
      password: 'Admin@123',
      icon: Shield,
      color: 'indigo'
    },
    nah: {
      label: 'Hospital Admin',
      email: 'admin@nah.local',
      password: 'Admin@123',
      icon: User,
      color: 'blue'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInternalLoading(true);
    setInternalError('');

    if (!credentials.tenantId) {
      setInternalError('Please select a facility to continue.');
      setInternalLoading(false);
      return;
    }

    try {
      const { api } = await import('../api.js');
      const data = await api.login(credentials.tenantId, credentials.email, credentials.password);
      onLogin(data);
    } catch (err) {
      setInternalError(err.message || 'Sign in failed. Please verify your credentials.');
    } finally {
      setInternalLoading(false);
    }
  };

  const setDemoCreds = (key, demo) => {
    const matchedTenant = tenantOptions.find(t =>
      t.name.toLowerCase().includes('new age') ||
      t.code?.toLowerCase() === 'nah' ||
      t.id?.toLowerCase() === 'nah'
    );

    setCredentials({
      tenantId: key === 'superadmin' ? 'superadmin' : (matchedTenant ? (matchedTenant.code || matchedTenant.id) : key),
      email: demo.email,
      password: demo.password
    });
  };

  const handleQuickLogin = (key, demo) => {
    setDemoCreds(key, demo);
    setTimeout(() => {
      document.getElementById('login-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    }, 100);
  };

  return (
    <div className="redesigned-login-container">
      {/* Left Panel - Branding */}
      <div className="login-left-panel">
        <div >
          {/* Logo Section */}
            <div>
              <img src="/healthezee-logo.png" alt="Healthezee"  />
          </div>

          {/* Hero Content */}
          <div className="hero-content">
            <h2 className="hero-title">
              NextGen AI-Powerd <br></br>Hospital Management System
            </h2>
            <p className="hero-description">
              Empowering healthcare providers with intelligent Hospital Management solutions for precision care delivery and operational excellence.
            </p>
          </div>

          {/* Features */}
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <Shield className="w-6 h-6" />
              </div>
              <div className="feature-text">
                <h3>Enterprise Security</h3>
                <p>HIPAA Compliant • SOC 2 Certified</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Activity className="w-6 h-6" />
              </div>
              <div className="feature-text">
                <h3>Real-time Analytics</h3>
                <p>Live Patient Monitoring • Clinical Insights</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Database className="w-6 h-6" />
              </div>
              <div className="feature-text">
                <h3>Cloud Infrastructure</h3>
                <p>99.9% Uptime • Auto-scaling</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <div className="trust-dot"></div>
              <span>256-bit Encryption</span>
            </div>
            <div className="trust-item">
              <div className="trust-dot"></div>
              <span>GDPR Compliant</span>
            </div>
            <div className="trust-item">
              <div className="trust-dot"></div>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="bg-pattern">
          <div className="pattern-circle circle-1"></div>
          <div className="pattern-circle circle-2"></div>
          <div className="pattern-circle circle-3"></div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right-panel">
        <div className="form-container">
          {/* Mobile Logo (hidden on desktop) */}
          <div className="mobile-logo">
            <div className="logo-image mobile">
              <img src="/healthezee-logo.png" alt="Healthezee Logo" className="logo-img mobile" />
            </div>
            <h1 className="mobile-title">{BRAND.name}</h1>
          </div>

          {/* Form Header */}
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Sign in to access your healthcare workspace</p>
          </div>

          {/* Quick Access Cards */}
          <div className="quick-access-section">
            <p className="quick-access-label">Quick Access</p>
            <div className="demo-cards-grid">
              {Object.entries(demoCredentials).map(([key, demo]) => (
                <button
                  key={key}
                  onClick={() => handleQuickLogin(key, demo)}
                  className="demo-access-card"
                  disabled={isLoading}
                >
                  <div className={`demo-icon-bg ${demo.color}`}>
                    <demo.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="demo-info">
                    <p className="demo-role">{demo.label}</p>
                    <p className="demo-email">{demo.email}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="form-divider">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          {/* Login Form */}
          <form id="login-form" onSubmit={handleSubmit} className="login-form">
            {/* Facility Selection */}
            <div className="form-field">
              <label className="field-label">Facility</label>
              <div className={`input-wrapper ${focusedField === 'tenant' ? 'focused' : ''}`}>
                <Building2 className="field-icon" />
                <select
                  name="tenantId"
                  className="field-input"
                  value={credentials.tenantId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, tenantId: e.target.value }))}
                  onFocus={() => setFocusedField('tenant')}
                  onBlur={() => setFocusedField(null)}
                  required
                >
                  <option value="">Select facility...</option>
                  <option value="superadmin">Platform Governance</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.code || tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Input */}
            <div className="form-field">
              <label className="field-label">Email Address</label>
              <div className={`input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                <Mail className="field-icon" />
                <input
                  type="email"
                  placeholder="name@facility.org"
                  className="field-input"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-field">
              <label className="field-label">Password</label>
              <div className={`input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
                <Lock className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your secure password"
                  className="field-input pr-12"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-alert">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="form-footer">
            <p className="footer-text">
              © {new Date().getFullYear()} {BRAND.name}. Secure healthcare platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
