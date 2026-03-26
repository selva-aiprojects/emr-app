import { useState, useEffect } from 'react';
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
  Trash2,
  Loader2
} from 'lucide-react';
import { api } from '../api.js';
import '../styles/critical-care.css';

export default function ServiceCatalogPage({ tenant }) {
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', category: 'Clinical', base_rate: 0, tax_percent: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const service = await api.createService(form);
      setServices([...services, service]);
      setShowAdd(false);
      setForm({ name: '', code: '', category: 'Clinical', base_rate: 0, tax_percent: 0 });
    } catch (err) {
      console.error('Failed to create service:', err);
    } finally {
      setSubmitting(false);
    }
  }

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
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="clinical-btn bg-slate-900 text-white px-8 rounded-2xl text-meta-sm shadow-2xl hover:bg-emerald-600 transition-all border-none"
        >
           <Plus className="w-4 h-4 mr-2" /> {showAdd ? 'Cancel' : 'Add Service Shard'}
        </button>
      </header>

      {showAdd && (
        <section className="clinical-card p-10 mb-10 border-2 border-slate-100 bg-white shadow-2xl animate-slide-in">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Shard Identity</label>
                 <input 
                   type="text" 
                   className="input-field"
                   placeholder="e.g. CBC Test"
                   value={form.name}
                   onChange={e => setForm({...form, name: e.target.value})}
                   required
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Institutional Code</label>
                 <input 
                   type="text" 
                   className="input-field"
                   placeholder="e.g. LAB-001"
                   value={form.code}
                   onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                   required
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                 <select 
                   className="input-field"
                   value={form.category}
                   onChange={e => setForm({...form, category: e.target.value})}
                 >
                   {['Clinical', 'Laboratory', 'Emergency', 'IPD', 'Radiology', 'Pathology'].map(c => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Base Rate (₹)</label>
                 <input 
                   type="number" 
                   className="input-field"
                   value={form.base_rate}
                   onChange={e => setForm({...form, base_rate: e.target.value})}
                   required
                 />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="clinical-btn bg-emerald-600 !text-white rounded-2xl h-[60px] shadow-lg hover:shadow-2xl transition-all"
              >
                 {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Persist Shard'}
              </button>
           </form>
        </section>
      )}

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
                 {loading ? (
                   <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-30">
                      <Loader2 size={40} className="animate-spin text-slate-900" />
                      <span className="text-xs font-black uppercase tracking-widest">Hydrating Revenue Registry...</span>
                   </div>
                 ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-20">
                       <Activity size={60} />
                       <span className="text-xs font-black uppercase tracking-widest">No matching service shards found</span>
                    </div>
                 ) : (
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
                             <td><span className="text-sm font-black text-slate-900 tabular-nums">₹{parseFloat(svc.base_rate).toLocaleString()}</span></td>
                             <td><span className="text-[10px] font-black text-slate-400 tabular-nums">+{svc.tax_percent}% GST</span></td>
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
                 )}
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
                        <div className="stat-value text-white tabular-nums">₹{services.length > 0 ? (services.reduce((acc, s) => acc + parseFloat(s.base_rate), 0) / services.length).toFixed(0) : 0}</div>
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
