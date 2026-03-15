import { Shield, Layout, Palette, Users, Save, Plus } from 'lucide-react';

export default function AdminPage({ tenant, patients, onSaveSettings, onCreateUser }) {
  return (
    <div className="page-shell-premium animate-fade-in">
      <div className="page-header-premium">
        <div>
          <h1>Facility Governance</h1>
          <p>Administrative Control & Tenant Configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT: SETTINGS */}
        <section className="col-span-12 lg:col-span-6 space-y-6">
          <article className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Visual Identity</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branding & Theme Engine</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={onSaveSettings}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Display Name</label>
                <input name="displayName" defaultValue={tenant?.name} className="input-field py-4" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Core Color</label>
                  <div className="flex gap-3 items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <input name="primaryColor" type="color" defaultValue={tenant?.theme?.primary || '#0f5a6e'} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                    <span className="text-[11px] font-bold text-slate-600 font-mono tracking-wider">{tenant?.theme?.primary || '#0f5A6E'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accent Highlight</label>
                   <div className="flex gap-3 items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <input name="accentColor" type="color" defaultValue={tenant?.theme?.accent || '#f57f17'} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                    <span className="text-[11px] font-bold text-slate-600 font-mono tracking-wider">{tenant?.theme?.accent || '#F57F17'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Module Provisioning</p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                    <input name="featureInventory" type="checkbox" defaultChecked={tenant?.features?.inventory} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-700">Clinical Inventory</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                    <input name="featureTelehealth" type="checkbox" defaultChecked={tenant?.features?.telehealth} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-700">Virtual Care</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-4 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Commit System Constants
              </button>
            </form>
          </article>
        </section>

        {/* RIGHT: USER PROVISIONING */}
        <section className="col-span-12 lg:col-span-6 space-y-6">
          <article className="glass-panel p-8 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Identity Authorization</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Practitioner Provisioning</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={onCreateUser}>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Name</label>
                  <input name="name" placeholder="E.g. Dr. Sarah Chen" className="input-field py-4" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facility E-Mail</label>
                  <input name="email" type="email" placeholder="sarah.c@medical.int" className="input-field py-4" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Role</label>
                  <select name="role" className="input-field h-[54px]" defaultValue="Doctor">
                    <option>Admin</option>
                    <option>Doctor</option>
                    <option>Nurse</option>
                    <option>Front Office</option>
                    <option>Billing</option>
                    <option>Inventory</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Linking</label>
                  <select name="patientId" className="input-field h-[54px]" defaultValue="">
                    <option value="">No Clinical Link</option>
                    {Array.isArray(patients) && patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} [{p.mrn}]</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                   <Shield className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Provisioning a new user will trigger a secure access initiation. Ensure the practitioner is cleared for clinical data access according to facility protocols.
                </p>
              </div>

              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Authorize Clinical Identity
              </button>
            </form>
          </article>
        </section>
      </div>
    </div>
  );
}
