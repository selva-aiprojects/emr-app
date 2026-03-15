import { useMemo, useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

export default function LoginPage({ onLogin, tenants }) {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const tenantOptions = useMemo(() => tenants || [], [tenants]);

  const demoCredentials = {
    superadmin: {
      label: 'Platform Administration',
      email: 'superadmin@healthcare.com',
      password: 'Admin@123'
    },
    EHS: {
      label: 'Enterprise Health Systems',
      email: 'admin.ehs@healthcare.com',
      password: 'Test@123'
    },
    city_general: {
      label: 'City General Hospital',
      email: 'admin.citygeneral@healthcare.com',
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
    <div className="login-split-portal animate-fade-in">
      <section className="login-brand-panel">
        <div className="relative z-10 max-w-2xl">
          <div className="clinical-chip !bg-white/10 !border-white/15 !text-white mb-8">
            <ShieldCheck className="w-4 h-4" />
            HIPAA-aware care operations workspace
          </div>

          <div className="flex items-center gap-4 mb-10">
            <div className="w-[72px] h-[72px] rounded-[28px] border border-white/16 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <HeartPulse className="w-9 h-9 text-cyan-100" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/72 font-extrabold">MedFlow EMR</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-white">Clinical systems built for calm, safe care delivery</h1>
            </div>
          </div>

          <p className="max-w-xl text-lg md:text-xl text-cyan-50/86 leading-8">
            A healthcare-first workspace for registration, scheduling, charting, billing, pharmacy, and operational oversight.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-2xl bg-white/12 flex items-center justify-center mb-4">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">Clinical reliability</h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/78">Clear hierarchies, safer colors, and fast access to patient-critical workflows.</p>
            </div>

            <div className="rounded-[24px] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-2xl bg-white/12 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">Audit readiness</h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/78">Professional visual language for regulated environments and multi-role accountability.</p>
            </div>

            <div className="rounded-[24px] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-2xl bg-white/12 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">Live operations</h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/78">Built to support front desk, clinical teams, diagnostics, and financial coordination.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-pro-card">
          <div className="mb-8">
            <div className="clinical-chip mb-4">
              <Lock className="w-4 h-4 text-[var(--primary)]" />
              Secure staff sign-in
            </div>
            <h2 className="text-[1.55rem] md:text-[1.75rem] font-extrabold tracking-[-0.03em] text-[var(--primary)] whitespace-nowrap">
              Access your healthcare workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Choose your organization and sign in with your assigned staff credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="clinical-grid">
            <div>
              <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Organization</label>
              <div className="relative">
                <select
                  className="clinical-select px-4 py-4 pr-12 text-sm font-semibold appearance-none"
                  value={credentials.tenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                >
                  <option value="">Select platform or facility</option>
                  <option value="superadmin">Healthcare Platform</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.code || tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-soft)] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  className="clinical-input pl-12 pr-4 py-4 text-sm font-semibold"
                  placeholder="name@hospital.org"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-soft)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="clinical-input pl-12 pr-4 py-4 text-sm font-semibold"
                  placeholder="Enter your secure password"
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-soft)]" />
              </div>
            </div>

            {error && (
              <div className="rounded-[18px] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5" />
                  <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full !h-14 !rounded-[18px]">
              {isLoading ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Continue to workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
            <button
              type="button"
              onClick={() => setShowDemoCredentials((prev) => !prev)}
              className="w-full flex items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--text-soft)]">Developer Access</p>
                <p className="text-sm font-bold text-[var(--text-main)] mt-1">Use seeded demo accounts for validation</p>
              </div>
              <ArrowRight className={`w-4 h-4 text-[var(--text-soft)] transition-transform ${showDemoCredentials ? 'rotate-90' : ''}`} />
            </button>

            {showDemoCredentials && (
              <div className="mt-4 grid gap-3">
                {Object.entries(demoCredentials).map(([key, demo]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => useDemoCredentials(key)}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-left transition-all hover:border-[var(--accent)]/30 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--text-main)] truncate">{demo.label}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate">{demo.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-soft)] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
