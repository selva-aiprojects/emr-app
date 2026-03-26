import { useState, useMemo, useEffect } from 'react';
import { api } from '../api';
import { getAIDischargeSummary } from '../ai-api.js';
import '../styles/critical-care.css';
import { 
  Bed as BedIcon, 
  Activity, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  Stethoscope,
  Grid,
  Plus,
  UserPlus,
  Search,
  Users,
  ShieldAlert,
  Sparkles,
  Bot,
  Loader2
} from 'lucide-react';
import PatientSearch from '../components/PatientSearch.jsx';

export default function InpatientPage({ tenant, providers, onDischarge }) {
  const [encounters, setEncounters] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'occupancy'
  const [showSummary, setShowSummary] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [dischargeMeds, setDischargeMeds] = useState('');

  // Load active admissions and wards
  useEffect(() => {
    async function load() {
      if (!tenant?.id) return;
      setLoading(true);
      try {
        const [encData, wardData] = await Promise.all([
          api.getEncounters(tenant.id),
          api.getWards(tenant.id)
        ]);
        setEncounters(encData.filter(e => e.status === 'open' && (e.encounter_type === 'In-patient' || e.type === 'In-patient')));
        setWards(wardData || []);
        
        // Load beds for each ward
        if (wardData) {
          const bedMap = {};
          await Promise.all(wardData.map(async (w) => {
            const b = await api.getBeds(w.id);
            bedMap[w.id] = b || [];
          }));
          setBeds(bedMap);
        }
      } catch (err) {
        console.error('Failed to load admissions/wards', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenant?.id]);

  const handleDischarge = async (encounter) => {
    // Stage 1: Generate Discharge Summary
    setDischargeDiagnosis('');
    setDischargeMeds('');
    setShowSummary(encounter);
  };

  const finalizeDischarge = async (encounterId, summaryData) => {
    try {
      setLoading(true);
      // Create final billing bridge & Discharge Summary record
      await api.autoBillItem(tenant.id, {
        patientId: showSummary.patient_id,
        description: `Final Discharge Settlement: ${showSummary.ward_name || 'General Ward'}`,
        amount: 5000, // Simulated final room + service charges
        type: 'service'
      });
      
      await api.dischargePatient(encounterId, { 
        tenantId: tenant.id,
        summary: summaryData 
      });
      
      setEncounters(prev => prev.filter(e => e.id !== encounterId));
      setShowSummary(null);
      if (onDischarge) onDischarge();
    } catch (err) {
      alert('DISCHARGE LOCK: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBestFitBed = (wardId) => {
    const wardBeds = beds[wardId] || [];
    // Filter out beds that are occupied by active encounters
    // (In a real DB, beds table would have a 'status', but here we derive from active encounters)
    const occupiedBedIds = new Set(encounters.map(e => e.bed_id));
    return wardBeds.find(b => !occupiedBedIds.has(b.id));
  };

  const metrics = {
    active: encounters.length,
    pending: encounters.filter(e => !e.diagnosis).length,
    critical: (wards.reduce((sum, w) => sum + (beds[w.id]?.length || 0), 0))
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Institutional Inpatient Care Hub
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Clinical Node</span>
           </h1>
           <p className="dim-label">Active inpatient management, bed allocation, and discharge infrastructure for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Census Integrity Validated • Live Ward updates Active
           </p>
        </div>
        <div className="flex bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit">
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('ledger')}
          >
            Admission Ledger
          </button>
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'occupancy' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('occupancy')}
          >
            Occupancy Map
          </button>
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admit' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('admit')}
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" /> New Admission
          </button>
        </div>
      </header>

      <section className="vitals-monitor mb-10">
        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">Facility Census</span>
              <BedIcon className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{metrics.active} / {metrics.critical}</span>
           <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase">Institutional Load Target</p>
        </div>

        <div className="vital-node vital-node--warning shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">Discharge Pipeline</span>
              <LogOut className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{metrics.pending}</span>
           <p className="text-[10px] font-black text-amber-600 mt-2 uppercase">Awaiting Clearance</p>
        </div>

        <div className="vital-node vital-node--critical shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">Emergency Shards</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{encounters.filter(e => e.type === 'Emergency').length}</span>
           <p className="text-[10px] font-black text-rose-600 mt-2 uppercase">High Priority Shift</p>
        </div>
      </section>

      {/* ALERT NODE */}
      {metrics.active > (metrics.critical * 0.8) && (
        <article className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-6 animate-pulse">
           <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <ShieldAlert className="w-6 h-6" />
           </div>
           <div className="flex-1">
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Facility Capacity Breach IMMINENT</h4>
              <p className="text-[11px] font-medium text-rose-700 mt-1">Institutional load exceeds 80% saturation. Diversion protocols should be considered for non-stabilization influx.</p>
           </div>
           <button className="clinical-btn bg-white text-rose-600 border-none px-6 rounded-xl text-[10px]" onClick={() => setActiveTab('occupancy')}>Audit Map</button>
        </article>
      )}

      {activeTab === 'admit' && (
        <section className="animate-fade-in grid grid-cols-12 gap-8">
           <article className="col-span-12 lg:col-span-8 clinical-card p-12">
              <header className="mb-12 border-b border-slate-50 pb-8 flex justify-between items-end">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Bed Allocation Protocol</h3>
                    <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Subject Admission & Infrastructure Binding • Facility Node</p>
                 </div>
                 <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                    <BedIcon className="w-7 h-7" />
                 </div>
              </header>
              
              <form className="space-y-12" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                try {
                  setLoading(true);
                  const patientId = fd.get('patientId');
                  const bedId = fd.get('bedId');
                  const wardId = fd.get('wardId');
                  const type = fd.get('type') || 'In-patient';

                  // 1. Create Encounter
                  await api.createEncounter({
                    tenantId: tenant.id,
                    userId: providers[0]?.id, // Default to first provider if not chosen
                    patientId,
                    providerId: fd.get('providerId') || providers[0]?.id,
                    type,
                    complaint: fd.get('notes') || 'In-patient Admission',
                    diagnosis: 'Assessment Pending',
                    notes: `Admitted to ${wards.find(w => w.id === wardId)?.name}, Bed: ${bedId}`
                  });

                  // Refresh data
                  window.location.reload();
                } catch (err) {
                  alert('ADMISSION BREACH: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Identity Search</label>
                         <div className="p-1 bg-slate-50 rounded-2xl border border-slate-100">
                            <PatientSearch tenantId={tenant?.id} />
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admitting Physician Shard</label>
                        <select name="providerId" className="input-field h-[60px] bg-slate-50 border-none font-black text-slate-800 rounded-2xl" required>
                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admission Shard Type</label>
                        <select name="type" className="input-field h-[60px] bg-slate-50 border-none font-black text-slate-800 rounded-2xl">
                          <option value="In-patient">Routine Admission (IPD)</option>
                          <option value="Emergency">Emergency Stabilization (ER)</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Clinical Ward</label>
                        <select name="wardId" className="input-field h-[60px] bg-slate-50 border-none font-black text-slate-800 rounded-2xl" required>
                          {wards.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Infrastructure Node (Bed)</label>
                        <input name="bedId" placeholder="e.g. Unit-01, ICU-B-04" className="input-field h-[60px] bg-slate-50 border-none font-black text-slate-800 rounded-2xl" required />
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-2 italic px-1">Verify occupancy map before assignment.</p>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                         <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                         <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                           All facility admissions are logged into the institutional persistence ledger for automatic billing cycles.
                         </p>
                      </div>
                   </div>
                 </div>

                 <div className="pt-10 border-t border-slate-50 flex justify-end gap-6 items-center">
                    <button type="button" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-rose-500 transition-colors" onClick={() => setActiveTab('ledger')}>Abort Protocol</button>
                    <button type="submit" className="clinical-btn bg-slate-900 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all border-none">
                       CONFIRM CLINICAL ADMISSION
                    </button>
                 </div>
              </form>
           </article>

           <aside className="col-span-12 lg:col-span-4 space-y-8">
              <div className="clinical-card bg-emerald-50/50 border-emerald-100">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-6">Facility Status</h4>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                       <span className="text-slate-400">Available Beds</span>
                       <span className="text-emerald-700">{metrics.critical - metrics.active}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-emerald-500 h-full" style={{ width: `${(metrics.active / (metrics.critical || 1)) * 100}%` }}></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 leading-relaxed">
                       Operating at {((metrics.active / (metrics.critical || 1)) * 100).toFixed(0)}% facility saturation.
                    </div>
                 </div>
              </div>
           </aside>
        </section>
      )}

      {activeTab === 'ledger' && (
        <main className="clinical-card !p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
             <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Admission Ledger</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Institutional Node Monitoring</p>
             </div>
             <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                <Activity className="w-4 h-4" />
             </div>
          </div>

          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="tracking-widest">Clinical Identity</th>
                  <th className="tracking-widest">Ward / Unit Link</th>
                  <th className="tracking-widest">Vitals Shard</th>
                  <th className="tracking-widest">Medical Clearance</th>
                  <th style={{ textAlign: 'right' }} className="tracking-widest">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-24 text-slate-300 italic font-medium">Syncing clinical feed...</td></tr>
                ) : encounters.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-24">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                        <BedIcon className="w-8 h-8 text-slate-300" />
                     </div>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No active admissions detected.</p>
                  </td></tr>
                ) : encounters.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg">
                            {(e.patient_name || 'P')[0]}
                         </div>
                         <div>
                            <div className="text-sm font-black text-slate-900">{e.patient_name || 'Clinical Subject'}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 tabular-nums">MRN-${(e.patient_id || 'X').slice(0, 8)}</div>
                         </div>
                      </div>
                    </td>
                    <td>
                       <div className="text-xs font-black text-slate-700 uppercase">{e.ward_name || 'General Ward'}</div>
                       <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 tabular-nums">Unit: {e.bed_number || 'U-01'}</div>
                    </td>
                    <td>
                       <div className="flex gap-3">
                          <div className="px-3 py-1 bg-slate-100 rounded-lg">
                             <span className="block text-[8px] font-black text-slate-400 uppercase">BP</span>
                             <span className="text-xs font-black text-slate-700 tabular-nums">{e.bp || '--'}</span>
                          </div>
                          <div className="px-3 py-1 bg-slate-100 rounded-lg">
                             <span className="block text-[8px] font-black text-slate-400 uppercase">HR</span>
                             <span className="text-xs font-black text-slate-700 tabular-nums">{e.hr || '--'}</span>
                          </div>
                       </div>
                    </td>
                    <td>
                       <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${e.diagnosis ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`}></span>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{e.diagnosis ? 'Verified Outcome' : 'Assessment Lag'}</span>
                       </div>
                    </td>
                    <td className="text-right">
                      <button 
                        className="clinical-btn !min-h-[40px] px-6 bg-slate-900 text-white hover:bg-emerald-600 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border-none"
                        onClick={() => handleDischarge(e)}
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2" /> Discharge protocol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {activeTab === 'occupancy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
           {wards.map(ward => (
             <article key={ward.id} className="clinical-card">
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{ward.name}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{ward.type} Node • ₹{ward.base_rate}/day</p>
                   </div>
                   <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400">
                      <Plus className="w-4 h-4" />
                   </button>
                </header>

                <div className="grid grid-cols-4 gap-4">
                   {(beds[ward.id] || []).map(bed => {
                     const occupant = encounters.find(e => e.bed_id === bed.id);
                     return (
                       <div 
                         key={bed.id} 
                         title={occupant ? `Occupied: ${occupant.patient_name}` : 'Available'}
                         className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all group relative ${
                           occupant 
                           ? 'bg-slate-900 border-slate-900' 
                           : 'bg-white border-slate-50 hover:border-emerald-200'
                         }`}
                       >
                          <div className={`text-[10px] font-black tabular-nums ${occupant ? 'text-slate-400' : 'text-slate-200'}`}>{bed.bed_number}</div>
                          <BedIcon className={`w-5 h-5 mt-1 ${occupant ? 'text-emerald-500' : 'text-slate-100 group-hover:text-emerald-100'}`} />
                          {occupant && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm"></div>
                          )}
                       </div>
                     );
                   })}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                   <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Automatic Shard Allocation</span>
                      <button 
                        onClick={() => {
                          const bestBed = getBestFitBed(ward.id);
                          if (bestBed) {
                            alert(`AUTONOMOUS NODE ALLOCATION:\nBed ${bestBed.bed_number} identified as optimal best-fit for new influx.`);
                          } else {
                            alert('FACILITY CAPACITY BREACH: No available shards in this sector.');
                          }
                        }}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                      >
                         Detect Best Fit
                      </button>
                   </div>
                </div>
             </article>
           ))}
        </div>
      )}

      {showSummary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="relative clinical-card w-full max-w-4xl p-0 overflow-hidden shadow-2xl animate-scale-up">
              <header className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Institutional Discharge Summary</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Patient Release Protocol • Subject-${showSummary.patient_id?.slice(0, 8)}</p>
                 </div>
                 <button onClick={() => setShowSummary(null)} className="text-white/40 hover:text-white">
                    <Plus className="w-6 h-6 rotate-45" />
                 </button>
              </header>

              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Clinical Documentation</h4>
                       <div className="space-y-4">
                           <label className="block">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Final Diagnosis Shard</span>
                               <button 
                                 type="button"
                                 onClick={async () => {
                                   try {
                                     setIsGeneratingAI(true);
                                     const { summary } = await getAIDischargeSummary(showSummary.id);
                                     const parts = summary.split('2. Hospital Course');
                                     setDischargeDiagnosis(parts[0].replace('1. Final Diagnosis', '').trim());
                                     setDischargeMeds(summary); // Put full report in meds as a draft
                                   } catch (err) {
                                     alert('AI Generation failed');
                                   } finally {
                                     setIsGeneratingAI(false);
                                   }
                                 }}
                                 disabled={isGeneratingAI}
                                 className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50"
                               >
                                 {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                 {isGeneratingAI ? 'Synthesizing...' : 'Auto-Generate AI Summary'}
                               </button>
                             </div>
                             <textarea 
                               value={dischargeDiagnosis || showSummary.diagnosis} 
                               onChange={(e) => setDischargeDiagnosis(e.target.value)}
                               className="input-field min-h-[100px] bg-slate-50 border-none font-bold text-slate-800" 
                             />
                          </label>
                           <label className="block">
                             <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Post-Discharge Stabilizers & Narrative</span>
                             <textarea 
                               value={dischargeMeds} 
                               onChange={(e) => setDischargeMeds(e.target.value)}
                               placeholder="List medications or AI report content here..." 
                               className="input-field min-h-[150px] mt-2 bg-slate-50 border-none font-bold text-slate-800" 
                             />
                          </label>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Fiscal Settlement Summary</h4>
                       <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[11px] font-black text-slate-400 uppercase">Gross Clinical Accrual</span>
                             <span className="text-sm font-black text-slate-900 uppercase">₹12,450.00</span>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                             <span className="text-[11px] font-black text-emerald-600 uppercase italic">Insurance Provision (80%)</span>
                             <span className="text-sm font-black text-emerald-600">- ₹9,960.00</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                             <span className="text-xs font-black text-slate-900 uppercase">Subject Liability (Total)</span>
                             <span className="text-xl font-black text-indigo-600">₹2,490.00</span>
                          </div>
                       </div>
                       <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-[11px] font-medium text-emerald-700 leading-relaxed italic">
                             Insurance eligibility verified. Provider: <span className="font-black">Global Healthcare Mutual</span>. Coverage exceeds 75% of clinical quantum.
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-8 border-t border-slate-50 flex gap-4">
                    <button 
                      onClick={() => finalizeDischarge(showSummary.id, {})}
                      className="clinical-btn bg-slate-900 text-white px-12 !min-h-[60px] rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl border-none"
                    >
                       Authorize Egress & Commit Billing
                    </button>
                    <button onClick={() => setShowSummary(null)} className="clinical-btn bg-white border border-slate-200 text-slate-400 px-8 rounded-2xl text-xs font-black uppercase">Cancel Protocol</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="mt-10 p-8 clinical-card border-l-4 border-l-amber-500 flex items-start gap-6 bg-amber-50/20">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
           <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">Institutional Discharge Guideline</h4>
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-4xl">
            Discharge authorization requires cross-verification of medical stability and financial clearance. Ensure all clinical trajectories are finalized and recorded in the health ledger before initiating the egress protocol. Post-discharge follow-ups should be scheduled within the Appointments Shard.
          </p>
        </div>
      </div>
    </div>
  );
}

