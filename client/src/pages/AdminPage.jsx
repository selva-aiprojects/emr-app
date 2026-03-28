import { Shield, Layout, Palette, Users, Save, Plus, Settings, Activity, Lock, Building, CreditCard, ShieldCheck } from 'lucide-react';
import '../styles/critical-care.css';

export default function AdminPage({ tenant, patients, onSaveSettings, onCreateUser }) {
  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Facility Governance & Control
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">System Root</span>
           </h1>
           <p className="dim-label">Organizational control and strategic tenant trajectory configuration for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Administrative Integrity Verified • System wide overrides active
           </p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT: STRATEGIC SETTINGS */}
        <section className="col-span-12 lg:col-span-6 space-y-8">
          <article className="clinical-card">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Visual identity & Branding</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Institutional Theme Engine</p>
              </div>
            </div>

            <form className="space-y-8" onSubmit={onSaveSettings}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Organization Nominal Identity</label>
                <input name="displayName" defaultValue={tenant?.name} className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black text-slate-800" required />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Primary Core Shard</label>
                  <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl">
                    <input name="primaryColor" type="color" defaultValue={tenant?.theme?.primary || '#0f5a6e'} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent shadow-sm" />
                    <span className="text-xs font-black text-slate-700 font-tabular tracking-widest uppercase">{tenant?.theme?.primary || '#0f5A6E'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Accent Velocity</label>
                   <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl">
                    <input name="accentColor" type="color" defaultValue={tenant?.theme?.accent || '#f57f17'} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent shadow-sm" />
                    <span className="text-xs font-black text-slate-700 font-tabular tracking-widest uppercase">{tenant?.theme?.accent || '#F57F17'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Service Module Provisioning</p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 cursor-pointer transition-all group">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Clinical Inventory</span>
                    <input name="featureInventory" type="checkbox" defaultChecked={tenant?.features?.inventory} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </label>
                  <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 cursor-pointer transition-all group">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Virtual Care Node</span>
                    <input name="featureTelehealth" type="checkbox" defaultChecked={tenant?.features?.telehealth} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </label>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Institutional Financial Settlement</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gateway Shard</label>
                    <select name="billingProvider" className="input-field h-[56px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" defaultValue={tenant?.billing_config?.provider || 'manual'}>
                      <option value="manual">Manual Settlement (Standard)</option>
                      <option value="stripe">Stripe Protocol</option>
                      <option value="razorpay">Razorpay Shard</option>
                      <option value="paypal">PayPal Institutional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Settlement Currency</label>
                    <select name="billingCurrency" className="input-field h-[56px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" defaultValue={tenant?.billing_config?.currency || 'INR'}>
                      <option>INR</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Gateway Key</label>
                  <input name="billingKey" type="password" defaultValue={tenant?.billing_config?.gatewayKey || ''} placeholder="sk_test_••••••••••••••••" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-mono text-xs" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest italic">All transaction shards will route through this identity node.</p>
                </div>
              </div>

              <button type="submit" className="clinical-btn bg-slate-900 text-white w-full py-5 uppercase tracking-[0.25em] text-[10px] font-black flex items-center justify-center gap-3 shadow-2xl rounded-2xl">
                <Save className="w-4 h-4" /> COMMIT SYSTEM CONSTANTS
              </button>
            </form>
          </article>
        </section>

        {/* RIGHT: IDENTITY PROVISIONING */}
        <section className="col-span-12 lg:col-span-6 space-y-8">
          <article className="clinical-card border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Identity Authorization</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Practitioner Node Provisioning</p>
              </div>
            </div>

            <form className="space-y-8" onSubmit={onCreateUser}>
               <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Legal Identity</label>
                  <input name="name" placeholder="E.g. Dr. Sarah Chen" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional E-Mail</label>
                  <input name="email" type="email" placeholder="sarah.c@facility.int" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operational Role Shard</label>
                  <select name="role" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" defaultValue="Doctor">
                    <option>Admin</option>
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Lab</option>
                    <option>Pharmacy</option>
                    <option>HR</option>
                    <option>Accounts</option>
                    <option>Support Staff</option>
                    <option>Front Office</option>
                    <option>Billing</option>
                    <option>Inventory</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Data Link</label>
                  <select name="patientId" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" defaultValue="">
                    <option value="">No Registry Link</option>
                    {Array.isArray(patients) && patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} [MRN-{p.mrn}]</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                   <Lock className="w-5 h-5" />
                </div>
                <div>
                   <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Security Directive</h5>
                   <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                    Provisioning a new identity node triggers a secure access initiation. Ensure the subject is cleared for clinical data oversight according to institutional protocols.
                   </p>
                </div>
              </div>

              <button type="submit" className="clinical-btn bg-emerald-600 text-white w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-emerald-700 transition-all shadow-2xl border-none">
                <Plus className="w-4 h-4 mr-3" /> AUTHORIZE CLINICAL IDENTITY NODE
              </button>
            </form>
          </article>

          <article className="clinical-card border-l-4 border-l-indigo-500 bg-indigo-50/20">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-indigo-500 flex items-center justify-center shadow-sm">
                   <Building className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em]">Institutional Infrastructure</h3>
                   <p className="text-[10px] font-bold text-indigo-600/60 uppercase mt-1">Node stability: 99.9% • Encryption: AES-256</p>
                </div>
             </div>
          </article>
        </section>
      </div>
    </div>
  );
}
