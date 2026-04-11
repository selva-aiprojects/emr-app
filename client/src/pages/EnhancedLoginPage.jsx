import { useMemo, useState } from 'react';
import { BRAND } from '../config/branding.js';
import { AlertCircle, ArrowRight, Activity, Database, Mail, Lock, Eye, EyeOff, Shield, User } from 'lucide-react';

export default function EnhancedLoginPage({ onLogin, tenants, loading: propLoading, error: propError }) {
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
    <div className="enhanced-login-container">
      {/* Background Pattern */}
      <div className="login-background">
        <div className="bg-pattern-1"></div>
        <div className="bg-pattern-2"></div>
        <div className="bg-pattern-3"></div>
      </div>

      {/* Main Login Card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="brand-section">
            <div className="brand-icon">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="brand-title">{BRAND.name}</h1>
              <p className="brand-subtitle">{BRAND.tagline}</p>
            </div>
          </div>
          
          <div className="trust-badges">
            <div className="trust-badge">
              <Shield className="w-4 h-4" />
              <span>HIPAA</span>
            </div>
            <div className="trust-badge">
              <Database className="w-4 h-4" />
              <span>SOC 2</span>
            </div>
          </div>
        </div>

        {/* Quick Access Demo Cards */}
        <div className="quick-access">
          <p className="quick-access-title">Quick Access</p>
          <div className="demo-cards">
            {Object.entries(demoCredentials).map(([key, demo]) => (
              <button
                key={key}
                onClick={() => handleQuickLogin(key, demo)}
                className="demo-card"
                disabled={isLoading}
              >
                <div className={`demo-icon ${demo.color}`}>
                  <demo.icon className="w-5 h-5 text-white" />
                </div>
                <div className="demo-info">
                  <p className="demo-label">{demo.label}</p>
                  <p className="demo-email">{demo.email}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <div className="divider-line"></div>
          <span className="divider-text">OR</span>
          <div className="divider-line"></div>
        </div>

        {/* Login Form */}
        <form id="login-form" onSubmit={handleSubmit} className="login-form">
          {/* Facility Selection */}
          <div className="form-group">
            <label className="form-label">Facility</label>
            <div className={`input-group ${focusedField === 'tenant' ? 'focused' : ''}`}>
              <Database className="input-icon" />
              <select
                name="tenantId"
                className="form-input"
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
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}>
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="name@facility.org"
                className="form-input"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}>
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="form-input pr-12"
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
            <div className="error-message">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
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
        <div className="login-footer">
          <p className="footer-text">
            © {new Date().getFullYear()} {BRAND.name}. Secure hospital management system.
          </p>
        </div>
      </div>
    </div>
  );
}
