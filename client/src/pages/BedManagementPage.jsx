import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Bed, Plus, Search, Loader2, ShieldCheck, Activity, UserCircle, ChevronRight, LayoutPanelTop, Building2, TrendingUp, Filter } from 'lucide-react';
import { api } from '../api.js';

export default function BedManagementPage({ tenant }) {
  const { showToast } = useToast();

  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState({}); // { wardId: [beds] }
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState(null);
  const [showAddWard, setShowAddWard] = useState(false);
  const [wardForm, setWardForm] = useState({ name: '', type: 'General', base_rate: 0 });
  const [bedForm, setBedForm] = useState({ bed_number: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWards();
  }, []);

  async function loadWards() {
    try {
      setLoading(true);
      const data = await api.getWards();
      setWards(data);
      if (data.length > 0) {
        setSelectedWard(data[0]);
        loadBeds(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch wards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBeds(wardId) {
    try {
      if (beds[wardId]) return;
      const data = await api.getBeds(wardId);
      setBeds(prev => ({ ...prev, [wardId]: data }));
    } catch (err) {
      console.error('Failed to fetch beds:', err);
    }
  }

  async function handleAddWard(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const ward = await api.createWard(wardForm);
      setWards([...wards, ward]);
      showToast({ message: 'Ward saved successfully!', type: 'success', title: 'Bed Management' });
      setShowAddWard(false);
      setWardForm({ name: '', type: 'General', base_rate: 0 });
    } catch (err) {
      console.error('Failed to create ward:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddBed(e) {
    e.preventDefault();
    if (!selectedWard) return;
    try {
      setSubmitting(true);
      const bed = await api.createBed({ ...bedForm, ward_id: selectedWard.id });
      showToast({ message: 'Bed record saved!', type: 'success', title: 'Bed Management' });
      setBeds(prev => ({ ...prev, [selectedWard.id]: [...(prev[selectedWard.id] || []), bed] }));
      setBedForm({ bed_number: '' });
    } catch (err) {
      console.error('Failed to create bed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const currentBeds = selectedWard ? (beds[selectedWard.id] || []) : [];

  return (
    <div className="page-shell-premium slide-up">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="page-title-rich flex items-center gap-3">
              <LayoutPanelTop className="w-8 h-8 text-slate-900" />
              Institutional Ward & Bed Management
           </h1>
           <p className="dim-label italic">Monitor ward throughput, bed occupancy shards, and real-time facility asset allocation for {tenant?.name}.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowAddWard(!showAddWard)}
             className="clinical-btn bg-slate-900 text-white px-8 rounded-2xl shadow-2xl hover:bg-slate-700 transition-all border-none"
           >
              <Plus className="w-4 h-4 mr-2" /> {showAddWard ? 'Cancel' : 'Register Ward'}
           </button>
        </div>
      </header>

      {showAddWard && (
        <section className="clinical-card p-8 mb-10 bg-white border-2 border-slate-100 shadow-2xl animate-slide-in">
           <form onSubmit={handleAddWard} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ward Identifier</label>
                 <input 
                   type="text" 
                   className="input-field h-[50px] !rounded-xl"
                   placeholder="e.g. ICU Wing A"
                   value={wardForm.name}
                   onChange={e => setWardForm({...wardForm, name: e.target.value})}
                   required
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ward Classification</label>
                 <select 
                   className="input-field h-[50px] !rounded-xl"
                   value={wardForm.type}
                   onChange={e => setWardForm({...wardForm, type: e.target.value})}
                 >
                   {['General', 'Emergency', 'ICU', 'Private', 'Semi-Private'].map(t => (
                     <option key={t} value={t}>{t} Ward</option>
                   ))}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Base rate (₹/day)</label>
                 <input 
                   type="number" 
                   className="input-field h-[50px] !rounded-xl"
                   value={wardForm.base_rate}
                   onChange={e => setWardForm({...wardForm, base_rate: e.target.value})}
                   required
                 />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="clinical-btn bg-emerald-600 !text-white rounded-xl h-[50px] shadow-lg hover:shadow-2xl transition-all"
              >
                 {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Persist Ward'}
              </button>
           </form>
        </section>
      )}

      <div className="grid grid-cols-12 gap-8">
         <aside className="col-span-12 lg:col-span-3 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
               <Building2 size={12} />
               Ward Registry
            </h3>
            <div className="space-y-2">
              {wards.map(ward => (
                <button 
                  key={ward.id}
                  onClick={() => { setSelectedWard(ward); loadBeds(ward.id); }}
                  className={`w-full p-6 rounded-2xl text-left transition-all border-2 flex justify-between items-center ${
                    selectedWard?.id === ward.id 
                    ? 'bg-slate-50 border-slate-900 shadow-xl' 
                    : 'bg-white border-slate-50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div>
                    <div className={`text-xs font-black uppercase tracking-widest mb-1 ${selectedWard?.id === ward.id ? 'text-slate-900' : 'text-slate-400'}`}>{ward.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ward.type} • ₹{parseFloat(ward.base_rate).toLocaleString()}/day</div>
                  </div>
                  {selectedWard?.id === ward.id && <ChevronRight size={16} className="text-slate-900" />}
                </button>
              ))}
            </div>
         </aside>

         <main className="col-span-12 lg:col-span-9 space-y-8">
            <div className="clinical-card !p-0 bg-white border-2 border-slate-50 shadow-premium overflow-hidden">
               <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Bed size={24} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          {selectedWard ? `${selectedWard.name} Bed Assets` : 'No Ward Selected'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physical Ward Capacity Allocation</p>
                     </div>
                  </div>
                  {selectedWard && (
                    <form onSubmit={handleAddBed} className="flex gap-4 items-end">
                       <div>
                          <input 
                            type="text" 
                            className="input-field h-[44px] !rounded-xl !text-xs w-48"
                            placeholder="Register Bed Number (e.g. B-102)"
                            value={bedForm.bed_number}
                            onChange={e => setBedForm({ ...bedForm, bed_number: e.target.value })}
                            required
                          />
                       </div>
                       <button 
                         type="submit" 
                         disabled={submitting}
                         className="clinical-btn bg-slate-900 !text-white rounded-xl h-[44px] px-6"
                       >
                          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                       </button>
                    </form>
                  )}
               </header>

               <div className="p-10">
                 {loading ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                      <Loader2 size={40} className="animate-spin text-indigo-600" />
                      <span className="text-xs font-black uppercase tracking-widest">Hydrating Assets...</span>
                   </div>
                 ) : !selectedWard ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                      <Filter size={40} className="text-slate-400" />
                      <span className="text-xs font-black uppercase tracking-widest">Select a ward to manage bed inventory</span>
                   </div>
                 ) : currentBeds.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-30">
                      <Bed size={60} className="text-slate-400" />
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">No Bed Units Detected</p>
                        <p className="text-[10px] font-bold text-slate-500 italic mt-2">Initialize floor plan by adding the first bed asset.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                     {currentBeds.map(bed => (
                       <article key={bed.id} className={`p-6 rounded-3xl border-2 transition-all group ${
                         bed.status === 'occupied' 
                         ? 'bg-rose-50 border-rose-100 text-rose-700' 
                         : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:scale-[1.05] hover:shadow-2xl'
                       }`}>
                          <div className="flex justify-between items-start mb-4">
                             <Bed size={20} className={bed.status === 'occupied' ? 'text-rose-400' : 'text-emerald-400'} />
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                               bed.status === 'occupied' ? 'bg-rose-100 border-rose-200' : 'bg-emerald-100 border-emerald-200'
                             }`}>
                               {bed.status || 'Available'}
                             </span>
                          </div>
                          <div className="text-lg font-black tracking-tight">{bed.bed_number}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-0.5">{selectedWard.name}</div>
                          
                          <div className="mt-4 pt-4 border-t border-current/10 flex items-center gap-2">
                             <UserCircle size={10} className="opacity-40" />
                             <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                               {bed.status === 'occupied' ? 'Patient Linked' : 'No Assignment'}
                             </span>
                          </div>
                       </article>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <article className="clinical-card bg-slate-900 text-white border-none p-8 flex items-center justify-between">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ward Occupancy</h5>
                    <div className="flex items-end gap-3">
                       <span className="text-3xl font-black">
                         {selectedWard ? currentBeds.filter(b => b.status === 'occupied').length : 0}
                         <span className="text-slate-600 text-sm ml-1">/ {currentBeds.length}</span>
                       </span>
                    </div>
                  </div>
                  <Activity size={32} className="text-indigo-500 opacity-50" />
               </article>

               <article className="clinical-card bg-white border-none shadow-premium p-8 flex items-center justify-between">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Available Capacity</h5>
                    <div className="flex items-end gap-3 text-emerald-600">
                       <span className="text-3xl font-black">{selectedWard ? currentBeds.filter(b => b.status !== 'occupied').length : 0}</span>
                       <span className="text-[10px] font-bold uppercase mb-1">UNITS Ready</span>
                    </div>
                  </div>
                  <TrendingUp size={32} className="text-emerald-500 opacity-20" />
               </article>

               <article className="clinical-card bg-white border-none shadow-premium p-8 overflow-hidden relative group">
                  <div className="relative z-10">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Operational Policy</h5>
                     <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                        Real-time bed shards drive automatic daily billing. Changing ward rates will apply to current admissions at next census (midnight).
                     </p>
                  </div>
                  <ShieldCheck size={40} className="absolute -bottom-4 -right-4 text-slate-50 opacity-10 group-hover:scale-[1.5] transition-transform" />
               </article>
            </div>
         </main>
      </div>
    </div>
  );
}
