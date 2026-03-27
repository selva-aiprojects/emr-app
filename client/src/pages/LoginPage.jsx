import { useMemo, useState } from 'react';
import { BRAND } from '../config/branding.js';
import { AlertCircle, ArrowRight, Activity, Zap, Database, ChevronRight, Mail, Lock } from 'lucide-react';

export default function LoginPage({ onLogin, tenants }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  // Derive tenantOptions safely
  const tenantOptions = useMemo(() => tenants || [], [tenants]);

  const demoCredentials = {
    superadmin: {
      label: 'Platform Governance',
      email: 'superadmin@emr.local',
      password: 'Admin@123',
      color: 'indigo'
    },
    nah: {
      label: 'New Age Hospital',
      email: 'admin@nah.local',
      password: 'Admin@123',
      color: 'emerald'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!credentials.tenantId) {
      setError('Organizational node selection is required for authentication.');
      setIsLoading(false);
      return;
    }

    try {
      const { api } = await import('../api.js');
      const data = await api.login(credentials.tenantId, credentials.email, credentials.password);
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Identity verification failed. Protocol breach or invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCreds = (key, demo) => {
    // Dynamically find the correct tenantId from options (so we don't hardcode 'nah' if the DB generates a UUID or code)
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
    <div className="login-compact-portal">
      <div className="login-compact-card">
        {/* Static Visual Side */}
        <div className="login-compact-visual hidden md:flex">
          {/* Logo at the top as requested */}
          <div className="absolute top-12 left-12">
            <img src="/medflow-icon.svg" alt={BRAND.name} className="h-20 w-20 drop-shadow-2xl" />
          </div>

          <div className="flex flex-col items-center justify-center text-center px-12">
            <div className="mb-6 p-5 bg-white/5 rounded-[2.5rem] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
               <div className="text-5xl font-[1000] tracking-tighter text-white/95 italic drop-shadow-lg">MedFlow</div>
            </div>
            <div className="h-1 w-12 bg-sky-500/50 rounded-full mb-6"></div>
            <p className="text-[11px] font-black text-sky-200/60 max-w-[300px] leading-relaxed uppercase tracking-[0.3em]">
              Precision Clinical Management & Institutional Excellence
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="login-form-side">
          <div className="mb-10">
            <div className="md:hidden flex flex-col items-center mb-8">
              <img src="/medflow-icon.svg" alt={BRAND.name} className="h-16 w-16 mb-2" />
               <span className="text-xl font-black text-slate-800 italic">MedFlow</span>
            </div>

            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Workspace Entry</h2>
            <p className="text-sm font-medium text-slate-500">Sign in to your clinical institutional node.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Point / Organization</label>
              <div className="relative group">
                <select
                  name="tenantId"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 pl-12 font-bold text-slate-800 hover:border-slate-200 focus:bg-white focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                  value={credentials.tenantId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, tenantId: e.target.value }))}
                >
                  <option value="">Select organizational node...</option>
                  <option value="superadmin">Platform Governance Center</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.code || tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-sky-500 transition-colors pointer-events-none" />
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Identifier</label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="professional@medflow.org"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 pl-12 font-bold text-slate-800 hover:border-slate-200 focus:bg-white focus:border-sky-500 outline-none transition-all"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-sky-500 transition-colors pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol Key</label>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 pl-12 font-bold text-slate-800 hover:border-slate-200 focus:bg-white focus:border-sky-500 outline-none transition-all"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-sky-500 transition-colors pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-600 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-sky-600/25 hover:bg-sky-700 hover:shadow-2xl hover:shadow-sky-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authorize Entry
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Developer Sandbox */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-between group"
            >
              <div className="text-left">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic Bypass</div>
                <div className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Developer Cloud Sandbox</div>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center transition-all ${showDemoCredentials ? 'rotate-90 bg-sky-50 text-sky-600' : 'text-slate-300'}`}>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {showDemoCredentials && (
              <div className="mt-6 space-y-3 animate-slide-up-fade">
                {Object.entries(demoCredentials).map(([key, demo]) => (
                  <button
                    key={key}
                    onClick={() => setDemoCreds(key, demo)}
                    className="w-full p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl flex items-center justify-between transition-all group/item shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover/item:bg-${demo.color}-600 group-hover/item:text-white transition-colors border border-slate-100`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{demo.label}</div>
                        <div className="text-[9px] font-medium text-slate-400">{demo.email}</div>
                      </div>
                    </div>
                    <Zap className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover/item:opacity-100 transition-all shadow-sm" />
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
