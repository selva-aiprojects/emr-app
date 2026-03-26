import { useMemo, useState, useEffect } from 'react';
import { BRAND } from '../config/branding.js';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: HeartPulse,
    title: 'Advanced Clinical Care',
    description: 'Real-time patient monitoring with AI-powered diagnostics and seamless EMR integration.',
    stats: '99.9% Uptime'
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture',
    description: 'Secure, isolated environments for each healthcare facility with enterprise-grade security.',
    stats: '500+ Facilities'
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Insights',
    description: 'Comprehensive reporting dashboard with predictive analytics and operational intelligence.',
    stats: 'Real-time Data'
  },
  {
    icon: Zap,
    title: 'Lightning Fast Performance',
    description: 'Optimized workflows and instant access to critical patient information when you need it most.',
    stats: '< 1s Response'
  }
];

export default function LoginPage({ onLogin, tenants }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const tenantOptions = useMemo(() => tenants || [], [tenants]);

  const demoCredentials = {
    superadmin: {
      label: 'Platform Services',
      email: 'superadmin@emr.local',
      password: 'Admin@123'
    },
    nah: {
      label: 'New Age Hospital (NAH)',
      email: 'admin@nah.com',
      password: 'Test@123'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!credentials.tenantId) {
      setError('Select a facility or platform organization before signing in.');
      setIsLoading(false);
      return;
    }

    try {
      const { api } = await import('../api.js');
      const data = await api.login(credentials.tenantId, credentials.email, credentials.password);
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Authentication failed. Review the credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantChange = (tenantId) => {
    setCredentials((prev) => ({ ...prev, tenantId, email: '', password: '' }));
    setShowDemoCredentials(false);
  };

  const useDemoCredentials = (key) => {
    const demo = demoCredentials[key || credentials.tenantId];
    if (!demo) return;

    setCredentials({
      tenantId: key || credentials.tenantId,
      email: demo.email,
      password: demo.password
    });
  };

  return (
    <div className="login-centered-portal">
      <div className="login-pro-card">
        {/* Branding Area */}
        <div className="logo-area">
          <div className="w-20 h-20 bg-[var(--primary-soft)] rounded-[24px] flex items-center justify-center mb-4 shadow-sm">
            <img src="/medflow_logo_8k.svg" alt={BRAND.name} className="w-12 h-12" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.25em] text-[var(--medical-navy)] mb-1">
            {BRAND.name}
          </h1>
          <div className="clinical-chip !bg-[var(--accent-soft)] !text-[var(--clinical-blue)] !border-[var(--clinical-blue)]/10 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Clinical Command Center
          </div>
        </div>

        {/* Login Form Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black tracking-tight text-[var(--text-strong)] mb-2">
            Workspace Authentication
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Institutional access for authorized clinical personnel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="clinical-grid">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-soft)] ml-1">Organization</label>
            <div className="relative">
              <select
                name="tenantId"
                className="clinical-select px-4 py-4 pr-12 text-sm font-bold bg-slate-50 border-slate-100 appearance-none focus:bg-white transition-all"
                value={credentials.tenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
              >
                <option value="">Select facility node...</option>
                <option value="superadmin">Platform Governance</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.id} value={tenant.code || tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-soft)] pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-soft)] ml-1">Identity (Email)</label>
            <div className="relative">
              <input
                type="email"
                className="clinical-input pl-12 pr-4 py-4 text-sm font-bold bg-slate-50 border-slate-100 focus:bg-white transition-all"
                placeholder="registered.staff@facility.org"
                value={credentials.email}
                onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-soft)]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-soft)] ml-1">Secure Key</label>
            <div className="relative">
              <input
                type="password"
                className="clinical-input pl-12 pr-4 py-4 text-sm font-bold bg-slate-50 border-slate-100 focus:bg-white transition-all"
                placeholder="••••••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-soft)]" />
            </div>
          </div>

          {error && (
            <div className="rounded-[18px] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5" />
                <p className="text-sm font-bold text-[var(--danger)]">{error}</p>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="btn btn-primary w-full !h-16 !rounded-[20px] flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/15 hover:shadow-2xl hover:shadow-[var(--primary)]/25 active:scale-[0.98] transition-all"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                Validating Node...
              </>
            ) : (
              <>
                Continue to Workflow
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Access */}
        <div className="mt-8 pt-8 border-t border-slate-50">
          <button
            type="button"
            onClick={() => setShowDemoCredentials((prev) => !prev)}
            className="w-full flex items-center justify-between gap-4 text-left group"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-soft)] mb-1">Developer Sandbox</p>
              <p className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--clinical-blue)] transition-colors">Launch with development credentials</p>
            </div>
            <div className={`p-2 rounded-lg bg-slate-50 text-[var(--text-soft)] transition-all ${showDemoCredentials ? 'rotate-90 bg-[var(--accent-soft)] text-[var(--clinical-blue)]' : ''}`}>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {showDemoCredentials && (
            <div className="mt-4 grid gap-2 animate-fade-in">
              {Object.entries(demoCredentials).map(([key, demo]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => useDemoCredentials(key)}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-100 bg-slate-50/50 px-4 py-3 text-left transition-all hover:bg-white hover:border-[var(--accent)]/30 hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tight truncate">{demo.label}</div>
                      <div className="text-[10px] font-medium text-[var(--text-muted)] truncate">{demo.email}</div>
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
