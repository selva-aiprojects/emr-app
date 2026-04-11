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

  return (
    <div className="redesigned-login-container">
      <div className="unified-login-card">
        {/* Left Panel - Branding */}
        <div className="login-left-panel">
          <div className="branding-content">
            {/* Logo Section */}
            <img src="/healthezee-logo.png" alt="Healthezee" className="w-32 h-auto mb-10 object-contain drop-shadow-2xl" />

            {/* Hero Content */}
            <div className="hero-content">
              <h2 className="hero-title">
                Next-Gen <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Hospital</span> <br />
                Management System
              </h2>
              <p className="hero-description">
                Empowering healthcare providers with intelligent EMR solutions for precision care delivery and operational excellence.
              </p>
            </div>

            {/* New Screenshot Features Layout */}
            <div className="branding-footer mt-auto">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/30 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="trust-text">
                  <h4 className="text-slate-300 ">Enterprise-Grade Security</h4>
                  <p className="text-slate-300 text-[10px] m-0">HIPAA Compliant • SOC 2 Certified</p>
                </div>
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

        <div className="login-right-panel">
          <div className="form-container">
            {/* Form Header */}
            <div className="form-header">
              <h2 className="form-title">Welcome Back</h2>
              <p className="form-subtitle">Sign in to access your healthcare workspace</p>
            </div>

            {/* Login Form */}
            <form id="login-form" onSubmit={handleSubmit} className="login-form mt-8">
              {/* Facility Selection */}
              <div className="form-field mb-5">
                <label className="field-label uppercase tracking-widest text-[10px] font-black text-slate-400 mb-2 block">Facility</label>
                <div className={`input-wrapper ${focusedField === 'tenant' ? 'focused' : ''} bg-slate-50 rounded-2xl border border-slate-100 px-4 py-1 flex items-center shadow-sm`}>
                  <Building2 className="text-slate-400 mr-2" size={18} />
                  <select
                    name="tenantId"
                    className="w-full bg-transparent border-none py-3 text-sm font-bold text-slate-700 outline-none"
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
              <div className="form-field mb-5">
                <label className="field-label uppercase tracking-widest text-[10px] font-black text-slate-400 mb-2 block">Email Address</label>
                <div className={`input-wrapper ${focusedField === 'email' ? 'focused' : ''} bg-slate-50 rounded-2xl border border-slate-100 px-4 py-1 flex items-center shadow-sm`}>
                  <Mail className="text-slate-400 mr-2" size={18} />
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@ehs.com"
                    className="w-full bg-transparent border-none py-3 text-sm font-bold text-slate-700 outline-none"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-field mb-6">
                <label className="field-label uppercase tracking-widest text-[10px] font-black text-slate-400 mb-2 block">Password</label>
                <div className={`input-wrapper ${focusedField === 'password' ? 'focused' : ''} bg-slate-50 rounded-2xl border border-slate-100 px-4 py-1 flex items-center shadow-sm`}>
                  <Lock className="text-slate-400 mr-2" size={18} />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none py-3 text-sm font-bold text-slate-700 outline-none"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="error-alert bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 mb-6 animate-shake">
                  <AlertCircle className="text-rose-500" size={18} />
                  <span className="text-rose-600 text-[11px] font-bold">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="submit-button group"
              >
                {isLoading ? (
                  <div className="spinner border-2 border-white/30 border-t-white w-5 h-5 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Access Cards */}
            <div className="quick-access-section mt-10">
              {/* Ready for Production: Sample access removed */}
            </div>

            {/* Footer */}
            <div className="form-footer">
              <p className="footer-text">
                © {new Date().getFullYear()} {BRAND.name}. Secure healthcare platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
