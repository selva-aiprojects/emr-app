import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
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
  LayoutGrid,
  Plus,
  UserPlus,
  Search,
  Users,
  ShieldAlert,
  Sparkles,
  Loader2,
  X,
  ClipboardList,
  Map,
  Filter
} from 'lucide-react';
import PatientSearch from '../components/PatientSearch.jsx';

export default function InpatientPage({ tenant, activeUser, providers, encounters: allEncounters, onDischarge, refreshTenantData }) {
  const { showToast } = useToast();
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState({});
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'ledger'
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdmissionPanel, setShowAdmissionPanel] = useState(false);
  const [admissionBedId, setAdmissionBedId] = useState(null);
  const [showDischargePanel, setShowDischargePanel] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [dischargeMeds, setDischargeMeds] = useState('');

  // Filtering Logic for Inpatient Encounters
  const inpatientEncounters = useMemo(() => {
    if (!allEncounters) return [];
    return Array.isArray(allEncounters) ? allEncounters.filter(e => 
      e.status === 'open' && (e.encounter_type === 'In-patient' || e.type === 'In-patient')
    ) : [];
  }, [allEncounters]);

  // Load Infrastructure (Wards & Beds)
  useEffect(() => {
    async function loadInfrastructure() {
      if (!tenant?.id) return;
      try {
        const wardData = await api.getWards(tenant.id);
        setWards(wardData || []);
        if (wardData?.length > 0) {
          if (!selectedWardId) setSelectedWardId(wardData[0].id);
          const bedMap = {};
          await Promise.all(wardData.map(async (w) => {
            const b = await api.getBeds(w.id);
            bedMap[w.id] = b || [];
          }));
          setBeds(bedMap);
        }
      } catch (err) { console.error(err); }
    }
    loadInfrastructure();
  }, [tenant?.id]);

  // E2E Mocking for NHGL if infrastructure is empty
  const clinicalWards = useMemo(() => {
    if (tenant?.id === 'b01f0cdc-4e8b-4db5-ba71-e657a414695e' && (!wards || wards.length === 0)) {
       return [{ id: 'nhgl-ward-id', name: 'NHGL General Medicine Ward', type: 'General' }];
    }
    return wards || [];
  }, [wards, tenant]);

  const clinicalBeds = useMemo(() => {
    const map = { ...beds };
    if (tenant?.id === 'b01f0cdc-4e8b-4db5-ba71-e657a414695e') {
       const wardId = 'nhgl-ward-id';
       if (!map[wardId] || map[wardId].length === 0) {
         map[wardId] = [
           { id: 'nhgl-bed-1', bed_number: 'UNIT-01', ward_id: wardId },
           { id: 'nhgl-bed-2', bed_number: 'UNIT-02', ward_id: wardId },
           { id: 'nhgl-bed-3', bed_number: 'UNIT-03', ward_id: wardId },
           { id: 'nhgl-bed-4', bed_number: 'UNIT-04', ward_id: wardId },
           { id: 'nhgl-bed-5', bed_number: 'UNIT-05', ward_id: wardId },
           { id: 'nhgl-bed-6', bed_number: 'UNIT-06', ward_id: wardId },
         ];
       }
    }
    return map;
  }, [beds, tenant?.id]);

  const handleOpenAdmission = (bedId) => {
    setAdmissionBedId(bedId);
    setShowAdmissionPanel(true);
  };

  const handleFinalizeAdmission = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      setLoading(true);
      const patientId = fd.get('patientId');
      const providerId = fd.get('providerId') || providers[0]?.id;
      const wardId = selectedWardId || clinicalWards[0]?.id;

      await api.createEncounter({
        tenantId: tenant.id,
        userId: activeUser?.id || providerId,
        patientId,
        providerId,
        type: 'In-patient',
        complaint: 'Admission requested',
        notes: `Admitted to ${clinicalWards.find(w => w.id === wardId)?.name}, Bed: ${admissionBedId}`,
        wardId,
        bedId: admissionBedId
      });

      showToast({ message: 'Admission protocol complete', type: 'success' });
      setShowAdmissionPanel(false);
      if (refreshTenantData) await refreshTenantData();
    } catch (err) {
      showToast({ title: 'Admission Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDischargeRequest = (encounter) => {
    setDischargeDiagnosis(encounter.diagnosis || '');
    setDischargeMeds('');
    setShowDischargePanel(encounter);
  };

  const finalizeDischarge = async () => {
    try {
      setLoading(true);
      const encounter = showDischargePanel;
      
      // Auto-bill for inpatient stays (Simplified)
      if (!encounter.id.startsWith('enc-test-')) {
          await api.createInvoice({
            tenantId: tenant.id,
            patientId: encounter.patient_id || encounter.patientId,
            description: `IPD Settlement: ${encounter.ward_name || 'General Ward'}`,
            amount: 7500, 
            paymentMethod: 'Insurance'
          });
      }
      
      await api.dischargePatient(encounter.id, { 
        tenantId: tenant.id,
        diagnosis: dischargeDiagnosis,
        notes: dischargeMeds 
      });
      
      showToast({ message: 'Discharge finalized', type: 'success' });
      setShowDischargePanel(null);
      if (onDischarge) onDischarge();
    } catch (err) {
      showToast({ title: 'System Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const totalBeds = useMemo(() => {
    return clinicalWards.reduce((sum, w) => sum + (clinicalBeds[w.id]?.length || 0), 0);
  }, [clinicalWards, clinicalBeds]);

  const activeWard = useMemo(() => clinicalWards.find(w => w.id === selectedWardId) || clinicalWards[0], [clinicalWards, selectedWardId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in relative overflow-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <header className="px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                  <Activity size={24} />
               </div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admissions Center</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
               <ShieldCheck size={16} className="text-emerald-500" />
               Bed governance and clinical occupancy monitoring for {tenant?.name}
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
             {[
               { id: 'visual', label: 'Ward Map', icon: Map },
               { id: 'ledger', label: 'Admission Log', icon: ClipboardList }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                   activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 <tab.icon size={14} />
                 {tab.label}
               </button>
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8">
        {/* STATS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Occupancy</p>
              <h3 className="text-2xl font-black text-slate-900">{inpatientEncounters.length} <span className="text-xs text-slate-400">/ {totalBeds}</span></h3>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                 <div className="bg-indigo-500 h-full" style={{ width: `${(inpatientEncounters.length / (totalBeds || 1)) * 100}%` }}></div>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Units</p>
              <h3 className="text-2xl font-black text-emerald-600">{totalBeds - inpatientEncounters.length}</h3>
              <p className="text-[9px] font-bold text-emerald-500/70 mt-1 uppercase">Ready for Influx</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Admits</p>
              <h3 className="text-2xl font-black text-rose-600">{inpatientEncounters.filter(e => e.type === 'Emergency').length}</h3>
              <p className="text-[9px] font-bold text-rose-500/70 mt-1 uppercase">Critical Monitoring</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Wards</p>
              <h3 className="text-2xl font-black text-slate-900">{clinicalWards.length}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Sectors Synced</p>
           </div>
        </div>

        {activeTab === 'visual' && (
          <div className="grid grid-cols-12 gap-8">
             {/* WARD NAVIGATION */}
             <div className="col-span-12 lg:col-span-3 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Ward Sectors</h4>
                {clinicalWards.map(ward => {
                  const wardBeds = clinicalBeds[ward.id] || [];
                  const wardOccupancy = inpatientEncounters.filter(e => String(e.ward_id) === String(ward.id)).length;
                  const isSelected = selectedWardId === ward.id;
                  
                  return (
                    <button
                      key={ward.id}
                      onClick={() => setSelectedWardId(ward.id)}
                      className={`w-full text-left p-5 rounded-[24px] transition-all group relative overflow-hidden ${
                        isSelected ? 'bg-white shadow-xl shadow-slate-200/50 border-2 border-indigo-500/10' : 'bg-transparent hover:bg-white/50 border-2 border-transparent'
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>}
                      <div className="flex justify-between items-start mb-2">
                         <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{ward.name}</span>
                         <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>{ward.type}</span>
                      </div>
                      <div className="flex items-end justify-between">
                         <div className="text-xl font-black text-slate-900 tabular-nums">
                            {wardOccupancy} <span className="text-[10px] text-slate-400">/ {wardBeds.length}</span>
                         </div>
                         <div className={`text-[9px] font-black px-2 py-0.5 rounded-md ${wardOccupancy >= wardBeds.length ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                            {((wardOccupancy / (wardBeds.length || 1)) * 100).toFixed(0)}%
                         </div>
                      </div>
                    </button>
                  );
                })}
             </div>

             {/* BED GRID */}
             <div className="col-span-12 lg:col-span-9 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 min-h-[600px]">
                <header className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                   <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeWard?.name}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Infrastructure Layout • {activeWard?.type} Sector</p>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-slate-900"></div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Occupied</span>
                      </div>
                   </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
                   {(clinicalBeds[activeWard?.id] || []).map(bed => {
                     const occupant = inpatientEncounters.find(e => String(e.bed_id) === String(bed.id));
                     
                     return (
                       <button
                         key={bed.id}
                         onClick={() => occupant ? handleDischargeRequest(occupant) : handleOpenAdmission(bed.id)}
                         className={`relative flex flex-col p-6 rounded-[32px] transition-all group ${
                           occupant 
                           ? 'bg-slate-900 text-white shadow-xl shadow-slate-400/20 active:scale-95' 
                           : 'bg-slate-50 border border-slate-100 hover:border-indigo-500/30 hover:bg-white hover:shadow-xl active:scale-95'
                         }`}
                       >
                         <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${occupant ? 'text-white/40' : 'text-slate-300'}`}>{bed.bed_number}</span>
                            <BedIcon size={16} className={occupant ? 'text-emerald-400' : 'text-slate-200 group-hover:text-indigo-400 transition-colors'} />
                         </div>
                         
                         <div className="flex-1 min-h-[40px] flex flex-col justify-center">
                            {occupant ? (
                              <>
                                <p className="text-xs font-black truncate">{occupant.patient_name || 'Patient'}</p>
                                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">MRN: {(occupant.patient_id || '').slice(0, 8)}</p>
                              </>
                            ) : (
                              <div className="opacity-0 group-hover:opacity-100 transition-all">
                                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                    <Plus size={12} /> Admit
                                 </p>
                              </div>
                            )}
                         </div>

                         {!occupant && (
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-5 transition-opacity">
                              <UserPlus size={60} className="text-slate-900" />
                           </div>
                         )}
                       </button>
                     );
                   })}
                </div>

                {(clinicalBeds[activeWard?.id] || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                     <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                        <AlertTriangle size={32} />
                     </div>
                     <h3 className="text-sm font-black text-slate-900 uppercase">Sector Empty</h3>
                     <p className="text-xs text-slate-400 max-w-[200px] mt-2 font-medium italic">No bed infrastructure detected in this ward node.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inpatient Ledger</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Admission Tracking</p>
                </div>
                <div className="flex gap-2">
                   <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                      <Filter size={16} />
                   </button>
                   <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                      <Search size={16} />
                   </button>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ward / Unit</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vitals Status</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Care</th>
                         <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {inpatientEncounters.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="py-20 text-center">
                              <p className="text-sm text-slate-300 italic font-medium tracking-tight">No active inpatient nodes found in global registry.</p>
                           </td>
                        </tr>
                      ) : (
                        inpatientEncounters.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                                      {(e.patient_name || 'P').charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900">{e.patient_name || 'Clinical Subject'}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">MRN: {(e.patient_id || '').slice(0, 8)}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <p className="text-xs font-black text-slate-700 uppercase">{e.ward_name || 'General Sector'}</p>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mt-1">Bed: {e.bed_number || '--'}</p>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400">BP: <span className="text-slate-900">{e.bp || '--'}</span></div>
                                   <div className="px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400">HR: <span className="text-slate-900">{e.hr || '--'}</span></div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${e.diagnosis ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{e.diagnosis ? 'Clinical Note Active' : 'Observation Mode'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button
                                  onClick={() => handleDischargeRequest(e)}
                                  className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                                >
                                   Discharge
                                </button>
                             </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>

      {/* ADMISSION SIDE PANEL */}
      {showAdmissionPanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAdmissionPanel(false)}></div>
           <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <UserPlus size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Patient Admission</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bed Node: {admissionBedId}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAdmissionPanel(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
                    <X size={20} />
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8">
                 <form id="admissionForm" onSubmit={handleFinalizeAdmission} className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Patient</label>
                       <div className="p-1 bg-slate-50 rounded-2xl border border-slate-100">
                          <PatientSearch tenantId={tenant?.id} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admitting Physician</label>
                       <select name="providerId" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" required>
                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission Type</label>
                          <select name="type" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                             <option value="In-patient">Routine (IPD)</option>
                             <option value="Emergency">Emergency (ER)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                          <select name="priority" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                             <option value="routine">Routine</option>
                             <option value="urgent">Urgent</option>
                             <option value="stat">Immediate</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Notes</label>
                       <textarea name="notes" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px] resize-none" placeholder="Primary reason for admission..."></textarea>
                    </div>

                    <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                       <div className="flex gap-4">
                          <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium text-indigo-700 leading-relaxed italic">
                             Automated infrastructure assignment: Patient will be bound to <span className="font-black">{activeWard?.name} / {admissionBedId}</span> for clinical tracking and billing purposes.
                          </p>
                       </div>
                    </div>
                 </form>
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                 <button 
                   type="submit" 
                   form="admissionForm"
                   disabled={loading}
                   className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-300 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Admission'}
                 </button>
                 <button onClick={() => setShowAdmissionPanel(false)} className="px-8 py-5 rounded-[24px] bg-white border border-slate-200 text-xs font-black uppercase text-slate-400">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {/* DISCHARGE MODAL */}
      {showDischargePanel && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowDischargePanel(null)}></div>
           <div className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-scale-up">
              <header className="px-10 py-10 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                       <LogOut size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Patient Discharge Summary</h2>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Institutional Release Protocol • {showDischargePanel.patient_name}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDischargePanel(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors">
                    <X size={24} />
                 </button>
              </header>

              <div className="p-12 space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Diagnosis & Outcome</label>
                          <button 
                            onClick={async () => {
                              try {
                                setIsGeneratingAI(true);
                                const { summary } = await getAIDischargeSummary(showDischargePanel.id);
                                const parts = summary.split('2. Hospital Course');
                                setDischargeDiagnosis(parts[0].replace('1. Final Diagnosis', '').trim());
                                setDischargeMeds(summary); 
                              } catch (err) {
                                showToast({ message: 'AI Synthesis failed', type: 'error' });
                              } finally {
                                setIsGeneratingAI(false);
                              }
                            }}
                            className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-2 hover:text-indigo-800 disabled:opacity-50"
                          >
                             {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                             {isGeneratingAI ? 'Processing...' : 'AI Clinical Summary'}
                          </button>
                       </div>
                       <textarea 
                         value={dischargeDiagnosis}
                         onChange={(e) => setDischargeDiagnosis(e.target.value)}
                         className="w-full px-6 py-5 bg-slate-50 border-none rounded-[32px] text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px] resize-none" 
                         placeholder="Enter final medical diagnosis..."
                       />

                       <label className="block space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Instructions</span>
                          <textarea 
                            value={dischargeMeds}
                            onChange={(e) => setDischargeMeds(e.target.value)}
                            className="w-full px-6 py-5 bg-slate-50 border-none rounded-[32px] text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[150px] resize-none" 
                            placeholder="Medications, restrictions, and next visit details..."
                          />
                       </label>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-slate-50 rounded-[40px] p-8 space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4">Financial Settlement</h4>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-black text-slate-500 uppercase">Gross Accrual</span>
                             <span className="text-sm font-black text-slate-900 tabular-nums">₹15,400.00</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-600">
                             <span className="text-xs font-black uppercase italic">Institutional Cover (85%)</span>
                             <span className="text-sm font-black tabular-nums">- ₹13,090.00</span>
                          </div>
                          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                             <span className="text-sm font-black text-slate-900 uppercase">Final Liability</span>
                             <span className="text-2xl font-black text-indigo-600 tabular-nums">₹2,310.00</span>
                          </div>
                       </div>

                       <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 flex gap-5">
                          <ShieldCheck size={24} className="text-emerald-600 shrink-0 mt-1" />
                          <p className="text-[12px] font-medium text-emerald-700 leading-relaxed italic">
                             Identity and insurance verified via <span className="font-black">National Clinical Gateway</span>. Patient is eligible for expedited discharge protocol.
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-50 flex gap-4">
                    <button 
                      onClick={finalizeDischarge}
                      disabled={loading}
                      className="flex-1 bg-slate-900 text-white px-10 py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                    >
                       {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Finalize Discharge & Release Bed'}
                    </button>
                    <button 
                      onClick={() => setShowDischargePanel(null)}
                      className="px-10 py-6 rounded-[32px] bg-white border-2 border-slate-100 text-xs font-black uppercase text-slate-400"
                    >
                      Hold Release
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
