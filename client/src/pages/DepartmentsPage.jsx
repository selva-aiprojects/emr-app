import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Building2, Plus, Users, Search, Activity, ChevronRight, UserCircle, ShieldCheck, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api.js';

export default function DepartmentsPage({ tenant }) {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', hod_user_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const dept = await api.createDepartment(form);
      setDepartments([...departments, dept]);
      showToast({ message: 'Department saved successfully!', type: 'success', title: 'Departments' });
      setShowAdd(false);
      setForm({ name: '', code: '', hod_user_id: '' });
    } catch (err) {
      setError('Failed to create department');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(query.toLowerCase()) || 
    d.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-shell-premium slide-up">
      <header className="page-header-premium mb-10">
        <div>
          <h1 className="page-title-rich flex items-center gap-3">
             <Building2 className="w-8 h-8 text-slate-900" />
             Institutional Departments Master
          </h1>
          <p className="dim-label italic">Manage clinical specialties, ward assignments, and department governance shards for {tenant?.name}.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="clinical-btn bg-slate-900 text-white px-8 rounded-2xl shadow-2xl hover:bg-emerald-600 transition-all border-none"
        >
           <Plus className="w-4 h-4 mr-2" /> {showAdd ? 'Cancel Action' : 'Add Department Shard'}
        </button>
      </header>

      {showAdd && (
        <section className="clinical-card p-10 mb-10 border-2 border-slate-100 bg-white shadow-2xl animate-slide-in">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Department Identity</label>
                 <input 
                   type="text" 
                   className="input-field"
                   placeholder="e.g. Cardiology"
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
                   placeholder="e.g. CARD-01"
                   value={form.code}
                   onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
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
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter department name or code..." 
              className="input-field pl-16 h-[60px] bg-white border-2 border-slate-50 rounded-2xl shadow-sm focus:shadow-xl transition-all font-black"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
         <main className="col-span-12 lg:col-span-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-30">
                 <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
                 <span className="text-xs font-black uppercase tracking-widest">Synchronizing Registry...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="clinical-card flex flex-col items-center justify-center p-20 opacity-30 border-dashed">
                 <Building2 className="w-20 h-20 mb-6 text-slate-900" />
                 <p className="text-lg font-black text-slate-800 uppercase tracking-widest">No Department Shards Detected</p>
                 <p className="text-sm font-medium text-slate-500 italic mt-2">Begin institutional configuration by adding a department.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map(dept => (
                  <article key={dept.id} className="clinical-card group p-8 hover:bg-slate-900 hover:scale-[1.02] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 group-hover:bg-white/5 rounded-full -mr-12 -mt-12 transition-all"></div>
                    <header className="flex items-center gap-4 mb-6 relative z-10">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-white/10 flex items-center justify-center text-indigo-600 group-hover:text-white shadow-sm">
                          <Building2 size={24} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-white uppercase leading-tight mb-1">{dept.name}</h4>
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-white/40 uppercase tracking-[0.15em]">{dept.code}</span>
                       </div>
                    </header>
                    
                    <footer className="flex items-center justify-between border-t border-slate-50 group-hover:border-white/5 pt-6 relative z-10">
                       <div className="flex items-center gap-2">
                          <UserCircle size={14} className="text-slate-300 group-hover:text-white/20" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-white/40 uppercase tracking-wider">HOD: Unassigned</span>
                       </div>
                       <button className="text-slate-400 group-hover:text-white/80 transition-colors">
                          <ChevronRight size={18} />
                       </button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
         </main>

         <aside className="col-span-12 lg:col-span-4 space-y-8">
            <article className="clinical-card bg-indigo-900 text-white border-none shadow-2xl p-10 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <TrendingUp className="w-10 h-10 text-indigo-400/50 mb-8" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4">Registry Summary</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                     <span className="text-[10px] uppercase font-black text-white/40">Total Departments</span>
                     <span className="text-2xl font-black">{departments.length}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                     <span className="text-[10px] uppercase font-black text-white/40">Clinical Shards</span>
                     <span className="text-2xl font-black">{departments.length}</span>
                  </div>
               </div>
            </article>

            <article className="clinical-card border-none bg-emerald-50/30 p-8">
               <div className="flex items-center gap-4 mb-4">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">Institutional Compliance</h4>
               </div>
               <p className="text-[10px] font-medium text-emerald-700/70 leading-relaxed italic">
                  Department IDs are immutable after creation to maintain clinical record referential integrity. Ensure codes align with national healthcare terminology standards.
               </p>
            </article>
         </aside>
      </div>
    </div>
  );
}
