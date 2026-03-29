import { useState } from 'react';
import { KeyRound, Building, Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { resetTenantUserPassword } from '../../api.js';

const INITIAL = { tenantId: '', email: '', newPassword: 'Healthezee@2026' };

export default function ResetPasswordForm({ tenants = [] }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [msg, setMsg] = useState('');
  const [showPw, setShowPw] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tenantId || !form.email || !form.newPassword) return;
    setLoading(true);
    setStatus(null);

    try {
      const result = await resetTenantUserPassword(form.tenantId, form.email.trim().toLowerCase(), form.newPassword);
      setStatus('success');
      setMsg(result.message || 'Password reset successfully.');
      setForm(prev => ({ ...prev, email: '' }));
    } catch (err) {
      setStatus('error');
      setMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  const selectedTenant = tenants.find(t => t.id === form.tenantId);

  return (
    <section className="clinical-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-200">
          <KeyRound className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Password Reset</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Override credentials for any tenant user</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tenant Selection */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            Hospital Node *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              name="tenantId"
              value={form.tenantId}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-slate-800 appearance-none font-bold"
            >
              <option value="">-- Select Tenant --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* User Email */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            User Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@hospital.com"
              required
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            New Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPw ? 'text' : 'password'}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50 font-mono font-bold text-rose-700"
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 italic font-medium">
            Default: Healthezee@2026 — change if needed before submitting.
          </p>
        </div>

        {/* Status */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-bold">{msg}</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-bold">{msg}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.tenantId || !form.email || !form.newPassword}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-rose-100"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" />
              Reset Password
            </>
          )}
        </button>
      </form>
    </section>
  );
}
