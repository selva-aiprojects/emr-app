import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Bed, Plus, Search, Loader2, ShieldCheck, Activity, UserCircle, ChevronRight, LayoutPanelTop, Building2, TrendingUp, Filter } from 'lucide-react';
import { api } from '../api.js';
import WardGraphics from '../components/WardGraphics.jsx';
import EnhancedBedCards from '../components/EnhancedBedCards.jsx';

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
  const [viewMode, setViewMode] = useState('plan'); // 'grid' | 'plan'
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

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

  const currentBeds = React.useMemo(() => {
    let list = selectedWard ? (beds[selectedWard.id] || []) : [];
    if (searchTerm) {
      list = list.filter(b => b.bed_number?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (availableOnly) {
      list = list.filter(b => b.status !== 'occupied');
    }
    return list;
  }, [selectedWard, beds, searchTerm, availableOnly]);

  return (
    <div className="page-shell-premium slide-up">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Ward & Bed Inventory Governance
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Institutional Shard</span>
           </h1>
           <p className="dim-label text-white/70">Track inpatient capacity, ward utilization, and bed availability for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Operational Integrity Validated • Resource sync operational
           </p>
        </div>
        <div className="flex flex-col items-end gap-3">
           <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
            {[
              { id: 'grid', label: 'Resource Grid', icon: LayoutPanelTop },
              { id: 'plan', label: 'Visual Floor Plan', icon: Building2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === tab.id 
                    ? 'bg-white text-slate-900 shadow-xl' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

           <div className="flex gap-3">
              <div className="relative group bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden px-4">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                 <input 
                   type="text"
                   placeholder="Locate bed..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="bg-transparent text-white font-black text-[10px] uppercase tracking-widest h-11 pl-8 w-40 outline-none placeholder:text-white/30"
                 />
              </div>

              <button 
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`px-6 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center backdrop-blur-md border ${
                  availableOnly ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/10 text-white/60 border-white/10'
                }`}
              >
                 <ShieldCheck className="w-3.5 h-3.5" />
                 Ready Units
              </button>

              <button 
                onClick={() => setShowAddWard(!showAddWard)}
                className="px-8 h-11 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 flex items-center gap-2"
              >
                 <Plus className="w-4 h-4" /> 
                 Provision Ward
              </button>
           </div>
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
               Ward List
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
               <header className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/20 gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Bed size={24} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          {selectedWard ? `${selectedWard.name} Beds` : 'No Ward Selected'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Bed Availability Summary</p>
                     </div>
                  </div>

                  {selectedWard && (
                    <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                      <button 
                         onClick={() => setViewMode('grid')}
                         className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}
                      >
                         Resource Grid
                      </button>
                      <button 
                         onClick={() => setViewMode('plan')}
                         className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'plan' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}
                      >
                         Floor plan
                      </button>
                    </div>
                  )}

                  {selectedWard && (
                    <form onSubmit={handleAddBed} className="flex gap-4 items-end">
                       <div>
                          <input 
                            type="text" 
                            className="input-field h-[44px] !rounded-xl !text-xs w-48"
                            placeholder="Bed Number (e.g. B-102)"
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
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">No Beds Found</p>
                        <p className="text-[10px] font-bold text-slate-500 italic mt-2">Add your first bed to start tracking.</p>
                      </div>
                   </div>
                 ) : viewMode === 'plan' ? (
                    <WardGraphics 
                      beds={currentBeds} 
                      onBedClick={() => {}} 
                    />
                 ) : (
                   <EnhancedBedCards 
                     currentBeds={currentBeds} 
                     selectedWard={selectedWard} 
                   />
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Ward Occupancy Card */}
               <article className="clinical-card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none p-8 flex items-center justify-between relative overflow-hidden group">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff10%22%20fill-opacity%3D%220.1%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2220%22/%3E%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%2220%22%20height%3D%2220%22/%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
                  
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                           <Activity size={24} className="animate-pulse" />
                        </div>
                        <div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Ward Occupancy</h5>
                           <p className="text-xs text-slate-400 font-medium">Real-time bed utilization</p>
                        </div>
                     </div>
                     <div className="flex items-end gap-3">
                        <div className="text-center">
                           <div className="text-3xl font-black text-white">{selectedWard ? currentBeds.filter(b => b.status === 'occupied').length : 0}</div>
                           <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Occupied</div>
                        </div>
                        <div className="text-center">
                           <div className="text-lg font-bold text-slate-300">/</div>
                           <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</div>
                           <div className="text-3xl font-black text-white">{currentBeds.length}</div>
                           <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Beds</div>
                        </div>
                        <div className="text-center">
                           <div className="text-2xl font-bold text-indigo-200">{currentBeds.length > 0 ? Math.round((currentBeds.filter(b => b.status === 'occupied').length / currentBeds.length) * 100) : 0}%</div>
                           <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Occupancy Rate</div>
                        </div>
                     </div>
                  </div>
               </article>

               {/* Available Capacity Card */}
               <article className="clinical-card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-emerald-100/50 p-8 flex items-center justify-between relative overflow-hidden group">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%2310b9810%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%2215%22/%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%2220%22%20fill-opacity%3D%220.2%22/%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%2215%22%20fill-opacity%3D%220.3%22/%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
                  
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                           <TrendingUp size={24} />
                        </div>
                        <div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">Available Capacity</h5>
                           <p className="text-xs text-emerald-600 font-medium">Ready for admission</p>
                        </div>
                     </div>
                     <div className="flex items-end gap-4">
                        <div className="text-center">
                           <div className="text-5xl font-black text-emerald-700">{selectedWard ? currentBeds.filter(b => b.status !== 'occupied').length : 0}</div>
                           <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">UNITS READY</div>
                        </div>
                        <div className="flex-1 flex items-end justify-end">
                           <div className="text-right">
                              <div className="text-3xl font-black text-emerald-700">{selectedWard ? Math.round((currentBeds.filter(b => b.status !== 'occupied').length / currentBeds.length) * 100) : 0}%</div>
                              <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Available Rate</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </article>

               {/* Operational Status Card */}
               <article className="clinical-card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-amber-100/50 p-8 overflow-hidden relative group">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23f59e0b10%22%20fill-opacity%3D%220.1%22%3E%3Cpolygon%20points%3D%2220%2C10%2050%2C50%2010%2C50%22/%3E%3Cpolygon%20points%3D%2230%2C20%2045%2C45%2015%2C45%22/%3E%3Cpolygon%20points%3D%2230%2C30%2040%2C40%2020%2C40%22/%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
                  
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
                           <ShieldCheck size={24} />
                        </div>
                        <div>
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Operational Status</h5>
                           <p className="text-xs text-amber-600 font-medium">System performance</p>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-xl">
                           <span className="text-sm font-medium text-amber-800">System Status</span>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-bold text-amber-700">Operational</span>
                           </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-xl">
                           <span className="text-sm font-medium text-amber-800">Last Update</span>
                           <span className="text-sm font-bold text-amber-700">{new Date().toLocaleTimeString()}</span>
                        </div>
                     </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-amber-200 opacity-20 group-hover:scale-110 transition-transform duration-500">
                     <ShieldCheck size={80} />
                  </div>
               </article>
            </div>
         </main>
      </div>
    </div>
  );
}
