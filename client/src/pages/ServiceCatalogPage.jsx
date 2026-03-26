import { useState } from 'react';
import { 
  Briefcase, 
  Stethoscope, 
  FlaskConical, 
  Bed, 
  Plus, 
  Search, 
  ChevronRight, 
  Activity, 
  ShieldCheck,
  TrendingUp,
  Settings,
  Edit2,
  Trash2
} from 'lucide-react';
import '../styles/critical-care.css';

const DEFAULT_SERVICES = [
  { id: 'SVC-101', name: 'General Physician Consultation', category: 'Clinical', price: 500, tax: 0, code: 'CONS-GP' },
  { id: 'SVC-102', name: 'Specialist Consultation (Senior)', category: 'Clinical', price: 1200, tax: 0, code: 'CONS-SPEC' },
  { id: 'SVC-201', name: 'Complete Blood Count (CBC)', category: 'Laboratory', price: 1500, tax: 18, code: 'LAB-CBC' },
  { id: 'SVC-202', name: 'Lipid Profile Shard', category: 'Laboratory', price: 2200, tax: 18, code: 'LAB-LIP' },
  { id: 'SVC-301', name: 'Emergency Triage & Stability', category: 'Emergency', price: 2000, tax: 5, code: 'ER-TRIAGE' },
  { id: 'SVC-401', name: 'Standard General ward (per day)', category: 'IPD', price: 3500, tax: 12, code: 'IPD-GW' },
  { id: 'SVC-402', name: 'ICU Unit Isolation (per day)', category: 'IPD', price: 12000, tax: 18, code: 'IPD-ICU' },
];

export default function ServiceCatalogPage({ tenant }) {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filtered = services.filter(s => {
    const matchQuery = s.name.toLowerCase().includes(query.toLowerCase()) || s.code.toLowerCase().includes(query.toLowerCase());
    if (activeTab === 'all') return matchQuery;
    return s.category.toLowerCase() === activeTab && matchQuery;
  });

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="page-title-rich flex items-center gap-3">
              Institutional Service Catalog
              <span className="text-meta-sm bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 shadow-lg">Revenue Engine</span>
           </h1>
           <p className="dim-label italic">Manage standardized clinical procedures, diagnostic pricing, and facility service shards for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Fiscal Policy: Active • Currency: INR (₹)
           </p>
        </div>
        <button className="clinical-btn bg-slate-900 text-white px-8 rounded-2xl text-meta-sm shadow-2xl hover:bg-emerald-600 transition-all border-none">
           <Plus className="w-4 h-4 mr-2" /> Add Service Shard
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--clinical-blue)] transition-colors" />
            <input 
              type="text" 
              placeholder="Search service name or institutional code..." 
              className="input-field pl-16 h-[60px] bg-white border-2 border-slate-50 rounded-2xl shadow-sm focus:shadow-xl transition-all font-black text-slate-800"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
         </div>
         <nav className="flex bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit h-[60px]">
           {['all', 'clinical', 'laboratory', 'emergency', 'ipd'].map(tab => (
             <button 
               key={tab}
               className={`clinical-btn !min-h-[44px] px-6 rounded-xl text-meta-sm transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
               onClick={() => setActiveTab(tab)}
             >
               {tab}
             </button>
           ))}
         </nav>
      </div>

      <div className="grid grid-cols-12 gap-10">
         <main className="col-span-12 lg:col-span-8">
            <div className="clinical-card !p-0 overflow-hidden border-none shadow-premium bg-white">
               <div className="premium-table-container">
                 <table className="premium-table">
                    <thead>
                       <tr>
                          <th className="tracking-widest">Service Shard Identity</th>
                          <th className="tracking-widest text-center">Department</th>
                          <th className="tracking-widest">Base Rate (₹)</th>
                          <th className="tracking-widest">Fiscal (Tax)</th>
                          <th className="tracking-widest text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filtered.map(svc => (
                         <tr key={svc.id} className="group hover:bg-slate-50 transition-all">
                            <td>
                               <div>
                                  <div className="text-sm font-black text-slate-900 group-hover:translate-x-1 transition-transform">{svc.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 tabular-nums">{svc.code}</div>
                               </div>
                            </td>
                            <td className="text-center">
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                 svc.category === 'Clinical' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                 svc.category === 'Laboratory' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                 svc.category === 'Emergency' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                 'bg-amber-50 text-amber-600 border-amber-100'
                               }`}>{svc.category}</span>
                            </td>
                            <td><span className="text-sm font-black text-slate-900 tabular-nums">₹{svc.price.toLocaleString()}</span></td>
                            <td><span className="text-[10px] font-black text-slate-400 tabular-nums">+{svc.tax}% GST</span></td>
                            <td className="text-right">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-xl shadow-sm"><Edit2 size={12} /></button>
                                  <button className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-xl shadow-sm"><Trash2 size={12} /></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
         </main>

         <aside className="col-span-12 lg:col-span-4 space-y-8">
            <article className="clinical-card bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <header className="mb-10 relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/50">Fiscal Intelligence</h3>
                  <p className="text-[10px] text-indigo-400 font-black uppercase mt-1">Revenue Shard Overview</p>
               </header>
               
               <div className="space-y-8 relative z-10">
                  <div className="flex items-center gap-10">
                     <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <TrendingUp size={24} />
                     </div>
                     <div>
                        <div className="stat-label text-white/30">Total Service Nodes</div>
                        <div className="stat-value text-white tabular-nums">{services.length}</div>
                     </div>
                  </div>
                  <div className="flex justify-between p-6 bg-white/5 rounded-2xl border border-white/10 items-end">
                     <div>
                        <div className="stat-label text-white/30">Avg. Consultation Fee</div>
                        <div className="stat-value text-white tabular-nums">₹850</div>
                     </div>
                     <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">+12% Quarterly Adjustment</span>
                  </div>
               </div>
            </article>

            <article className="clinical-card border-none bg-indigo-50/30">
               <div className="flex items-center gap-4 mb-4">
                  <Activity size={18} className="text-indigo-600" />
                  <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Revenue Policy Guidance</h4>
               </div>
               <p className="text-[11px] font-medium text-indigo-700/70 leading-relaxed italic">
                  Standardized pricing is mandatory for institutional transparency. Updates to service shards will automatically propagate to all future billing cycles in the EMR Persistence Ledger.
               </p>
            </article>
         </aside>
      </div>

      <footer className="mt-12 py-10 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 rounded-3xl px-8">
         <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <Settings className="w-4 h-4" /> MASTER SERVICE ENGINE • v1.0 • SHARD-RCM-99
         </div>
      </footer>
    </div>
  );
}
