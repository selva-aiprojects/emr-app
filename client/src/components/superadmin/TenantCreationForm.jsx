import React, { useState } from 'react';
import { Building2, Hash, Globe, Palette, Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const TIERS = [
  { value: 'Free',         label: 'Free',         color: '#8b5cf6', icon: '🆓', price: 'Free' },
  { value: 'Basic',        label: 'Basic',        color: '#6b7280', icon: '🩺', price: '$99/mo' },
  { value: 'Professional', label: 'Professional', color: '#3b82f6', icon: '⭐', price: '$299/mo' },
  { value: 'Enterprise',   label: 'Enterprise',   color: '#10b981', icon: '🏢', price: '$599/mo' },
];

const INITIAL = {
  name: '',
  code: '',
  subdomain: '',
  contactEmail: '',
  subscriptionTier: 'Professional',
  primaryColor: '#0f5a6e',
  accentColor: '#f57f17',
};

export default function TenantCreationForm({ onCreate }) {
  const [form, setForm]       = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState(null); // null | 'success' | 'error'
  const [errMsg, setErrMsg]   = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Auto-generate code + subdomain from name if user hasn't touched them
      if (name === 'name') {
        const slug = value.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase().split(/\s+/).map(w => w[0] || '').join('').slice(0, 5);
        const sub  = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
        if (!prev._codeManual)      next.code      = slug;
        if (!prev._subManual)       next.subdomain = sub;
      }
      if (name === 'code')      next._codeManual = true;
      if (name === 'subdomain') next._subManual  = true;
      return next;
    });
    setStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrMsg('');

    try {
      await onCreate({
        name:             form.name.trim(),
        code:             form.code.trim().toUpperCase(),
        subdomain:        form.subdomain.trim().toLowerCase(),
        contactEmail:     form.contactEmail.trim().toLowerCase(),
        subscriptionTier: form.subscriptionTier,
        primaryColor:     form.primaryColor,
        accentColor:      form.accentColor,
      });
      setStatus('success');
      setForm(INITIAL);
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  }

  const selectedTier = TIERS.find(t => t.value === form.subscriptionTier);

  return (
    <section className="clinical-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Provision New Tenant</h2>
          <p className="text-xs text-slate-400 mt-0.5">Create a new clinic / hospital workspace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Tenant Name */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            <Building2 className="w-3 h-3 inline mr-1" />Tenant Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. MedFlow Basic Clinic"
            required
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Contact Email */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
           <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 leading-none">
             Primary Admin Contact Unit
           </label>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                 <Building2 className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                placeholder="Institutional Admin Email"
                required
                className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none placeholder:text-slate-300"
              />
           </div>
           <p className="text-[9px] font-bold text-slate-400 mt-2 italic uppercase tracking-widest">
             * Credentials and node access keys strictly dispatched here.
           </p>
        </div>

        {/* Code + Subdomain row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              <Hash className="w-3 h-3 inline mr-1" />Short Code *
            </label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. MBC"
              maxLength={10}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 placeholder-slate-400 uppercase"
            />
            <p className="text-[10px] text-slate-400 mt-1">Used for patient MRNs</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              <Globe className="w-3 h-3 inline mr-1" />Subdomain *
            </label>
            <input
              type="text"
              name="subdomain"
              value={form.subdomain}
              onChange={handleChange}
              placeholder="e.g. medflow-basic"
              maxLength={50}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 placeholder-slate-400 lowercase"
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be unique</p>
          </div>
        </div>

        {/* Subscription Tier */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <Star className="w-3 h-3 inline mr-1" />Subscription Tier *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map(tier => (
              <button
                key={tier.value}
                type="button"
                onClick={() => { setForm(f => ({ ...f, subscriptionTier: tier.value })); setStatus(null); }}
                className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  form.subscriptionTier === tier.value
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-[1.02]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                <div className="text-lg">{tier.icon}</div>
                <div className="text-[11px] font-black uppercase tracking-wide mt-0.5">{tier.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{tier.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Colors */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <Palette className="w-3 h-3 inline mr-1" />Brand Colors
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white">
              <input
                type="color"
                name="primaryColor"
                value={form.primaryColor}
                onChange={handleChange}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Primary</div>
                <div className="text-xs text-slate-700 font-mono">{form.primaryColor}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white">
              <input
                type="color"
                name="accentColor"
                value={form.accentColor}
                onChange={handleChange}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Accent</div>
                <div className="text-xs text-slate-700 font-mono">{form.accentColor}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview badge */}
        {form.name && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow"
              style={{ backgroundColor: form.primaryColor }}
            >
              {form.code?.slice(0,2) || '?'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{form.name || 'Tenant Name'}</div>
              <div className="text-[10px] text-slate-400">{form.subdomain || 'subdomain'}.medflow.app · {selectedTier?.icon} {form.subscriptionTier}</div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Tenant provisioned successfully!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="font-semibold">{errMsg}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.name || !form.code || !form.subdomain || !form.contactEmail}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</>
          ) : (
            <><Building2 className="w-4 h-4" /> Provision Tenant</>
          )}
        </button>
      </form>
    </section>
  );
}
