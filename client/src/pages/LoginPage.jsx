import { useMemo, useState } from 'react';
import { BRAND } from '../config/branding.js';
import { AlertCircle, ArrowRight, Activity, Database, Mail, Lock, ChevronRight } from 'lucide-react';

export default function LoginPage({ onLogin, tenants, loading: propLoading, error: propError }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const isLoading = propLoading || internalLoading;
  const error = propError || internalError;

  const tenantOptions = useMemo(() => tenants || [], [tenants]);

  const demoCredentials = {
    superadmin: {
      label: 'Platform Governance',
      email: 'superadmin@emr.local',
      password: 'Admin@123'
    },
    nah: {
      label: 'New Age Hospital',
      email: 'admin@nah.local',
      password: 'Admin@123'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-[28px] overflow-hidden border border-slate-100 grid grid-cols-1 md:grid-cols-2">
        {/* Left Panel - Hero Section */}
        <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

          <div className="relative z-10 flex items-center gap-4">
            <img src="/medflow-icon.svg" alt={BRAND.name} className="h-12 w-12" />
            <div>
              <div className="text-xl font-black tracking-tight" style={{ color: '#ffffff' }}>{BRAND.name}</div>
              <div className="text-xs uppercase tracking-widest mt-1" style={{ color: '#94a3b8' }}>Clinical Operations Suite</div>
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl font-black leading-tight mb-4" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              Secure access for{' '}
              <span style={{ color: '#60a5fa' }}>every care team.</span>
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>
              Manage patients, appointments, and clinical workflows with confidence. Your data stays encrypted and role-secured.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs font-bold" style={{ color: '#94a3b8' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Database className="w-4 h-4" style={{ color: '#818cf8' }} />
              </div>
              Tenant-aware access control
            </div>
          </div>
        </div>

        {/* Right Panel - Form Section */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <img src="/medflow-icon.svg" alt={BRAND.name} className="h-10 w-10" />
            <div>
              <div className="text-lg font-black">{BRAND.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Clinical Operations Suite</div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">Sign in</h2>
          <p className="text-sm text-slate-600 mb-6">Access your facility workspace with secure credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Facility</label>
              <div className="relative">
                <select
                  name="tenantId"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all appearance-none"
                  value={credentials.tenantId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, tenantId: e.target.value }))}
                >
                  <option value="">Select facility...</option>
                  <option value="superadmin">Platform Governance Center</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.code || tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@facility.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secret Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition-all"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl py-3.5 font-black uppercase tracking-widest text-[11px] shadow-xl hover:shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in to Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-between group"
            >
              <div className="text-left">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Demo Environment</div>
                <div className="text-xs font-bold text-slate-600">Quick-fill demo identity</div>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center transition-all ${showDemoCredentials ? 'rotate-90 text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {showDemoCredentials && (
              <div className="mt-5 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                {Object.entries(demoCredentials).map(([key, demo]) => (
                  <button
                    key={key}
                    onClick={() => setDemoCreds(key, demo)}
                    className="w-full p-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:border-indigo-100">
                        <Activity className="w-4 h-4 text-slate-600 group-hover:text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-[11px] font-black text-slate-900">{demo.label}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{demo.email}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Select</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
