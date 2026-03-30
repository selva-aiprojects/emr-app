import { useMemo, useState } from 'react';
import { BRAND } from '../config/branding.js';
import { AlertCircle, ArrowRight, Activity, Database, Mail, Lock, ChevronRight, HeartPulse } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-6xl bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 shadow-blue-500/10 grid grid-cols-1 lg:grid-cols-5">
        {/* Left Panel - Hero Section */}
        <div className="lg:col-span-3 hidden lg:flex flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #334155 75%, #1e293b 100%)' }}>

          <div className="relative z-10">
            <img 
              src="/healthezee-logo.png" 
              alt="Healthezee Logo" 
              className="h-20 w-auto object-contain drop-shadow-2xl" 
            />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="space-y-4">
              <h1 className="text-6xl font-black leading-tight tracking-tighter" style={{ color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.4)', fontFamily: '"Outfit", sans-serif' }}>
                Next-Gen<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Healthcare</span><br/>
                Platform
              </h1>
              <p className="text-lg leading-relaxed text-slate-200 max-w-md">
                Empowering healthcare providers with intelligent EMR solutions for precision care delivery and operational excellence.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 border-2 border-white/30 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <HeartPulse className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-2 border-white/30 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Activity className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 border-2 border-white/30 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Database className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <div className="text-white font-bold text-sm">Enterprise-Grade Security</div>
                <div className="text-slate-300 text-xs">HIPAA Compliant • SOC 2 Certified</div>
              </div>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/10 blur-sm"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-gradient-to-tr from-purple-400/15 via-pink-400/10 to-rose-400/5 blur-md"></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gradient-to-bl from-indigo-400/10 via-blue-400/5 to-cyan-400/3 blur-lg -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/15 via-teal-400/10 to-emerald-400/5 blur-sm"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-gradient-to-tr from-rose-400/10 via-pink-400/8 to-purple-400/5 blur-md"></div>
          </div>
        </div>

        {/* Right Panel - Form Section */}
        <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img 
              src="/healthezee-logo.png" 
              alt="Healthezee Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-600">Sign in to access your healthcare workspace</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Facility</label>
              <div className="relative">
                <select
                  name="tenantId"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none"
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
                <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@facility.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your secure password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 pl-12 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-[11px] shadow-xl hover:shadow-2xl hover:shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in to Workspace
                  <ArrowRight className="w-5 h-5" />
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
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Demo Environment</div>
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

          {/* Copyright Notice */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400">
              © 2026 Healthezee EMR. All rights reserved.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
