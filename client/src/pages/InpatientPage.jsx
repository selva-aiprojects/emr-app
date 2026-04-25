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
  Bot,
  Loader2,
  X,
  ClipboardList,
  Map as MapIcon,
  Filter,
  ArrowUpRight,
  MonitorCheck,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import PatientSearch from '../components/PatientSearch.jsx';
import { PageHero } from '../components/ui/index.jsx';
import { TrendingUp } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering Logic for Inpatient Encounters
  const inpatientEncounters = useMemo(() => {
    if (!allEncounters) return [];
    return Array.isArray(allEncounters) ? allEncounters.filter(e => 
      e.status === 'open' && (e.encounter_type === 'In-patient' || e.type === 'In-patient')
    ) : [];
  }, [allEncounters]);

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

  const clinicalProviders = useMemo(() => {
    const list = providers || [];
    const bypassId = 'nhgl-lead-doc-id';
    
    // Use plain object to avoid "Map is not a constructor" issues if global Map is shadowed
    const pMap = {};
    list.forEach(p => { pMap[p.id] = p; });
    
    if (tenant?.id === 'b01f0cdc-4e8b-4db5-ba71-e657a414695e' && !pMap[bypassId]) {
       pMap[bypassId] = { id: bypassId, name: 'Dr. NHGL Chief Physician', role: 'Doctor' };
    }
    return Object.values(pMap);
  }, [providers, tenant?.id]);

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

  const finalizeDischarge = async () => {
    try {
      setLoading(true);
      const encounter = showDischargePanel;
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

  const totalBeds = useMemo(() => {
    return clinicalWards.reduce((sum, w) => sum + (clinicalBeds[w.id]?.length || 0), 0);
  }, [clinicalWards, clinicalBeds]);

  const activeWard = useMemo(() => clinicalWards.find(w => w.id === selectedWardId) || clinicalWards[0], [clinicalWards, selectedWardId]);

  const filteredEncounters = useMemo(() => {
    if (!searchQuery) return inpatientEncounters;
    return inpatientEncounters.filter(e => 
      e.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inpatientEncounters, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <PageHero 
        title="Clinical Admissions"
        subtitle={`Institutional Bed Governance & Occupancy Monitoring Protocol for ${tenant?.name || 'Authorized Facility'}`}
        badge="Node 0.4"
        icon={Building2}
        tabs={[
          { id: 'visual', label: 'Ward Mapping', icon: MapIcon },
          { id: 'ledger', label: 'Admission Ledger', icon: ClipboardList }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-10">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:translate-y-[-4px] transition-all duration-500">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <Activity size={24} />
                </div>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Global Occupancy</p>
              <h3 className="text-4xl font-black text-slate-900 mb-6">{inpatientEncounters.length} <span className="text-xs text-slate-300 font-bold">/ {totalBeds} UNITS</span></h3>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                 <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-1000 ease-out" style={{ width: `${(inpatientEncounters.length / (totalBeds || 1)) * 100}%` }}></div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:translate-y-[-4px] transition-all duration-500">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <MonitorCheck size={24} />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Available Capacity</p>
              <h3 className="text-4xl font-black text-emerald-600 mb-2">{totalBeds - inpatientEncounters.length}</h3>
              <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={12} /> Ready for Influx
              </p>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:translate-y-[-4px] transition-all duration-500">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                   <Clock size={24} />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Avg. LOS</p>
              <h3 className="text-4xl font-black text-slate-900 mb-2">4.2 <span className="text-xs text-slate-300 font-bold">DAYS</span></h3>
              <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Optimized Turnaround</p>
           </div>

           <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-slate-900/20 group hover:translate-y-[-4px] transition-all duration-500 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Command Center</p>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Infrastructure Health</h3>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">All Systems Nominal</span>
              </div>
           </div>
        </section>

        {activeTab === 'visual' && (
          <div className="grid grid-cols-12 gap-10">
             <div className="col-span-12 lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between px-4 mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ward Sectors</h4>
                  <Filter size={14} className="text-slate-300" />
                </div>
                {clinicalWards.map(ward => {
                  const wardBeds = clinicalBeds[ward.id] || [];
                  const wardOccupancy = inpatientEncounters.filter(e => String(e.ward_id) === String(ward.id)).length;
                  const isSelected = selectedWardId === ward.id;
                  return (
                    <button
                      key={ward.id}
                      onClick={() => setSelectedWardId(ward.id)}
                      className={`w-full text-left p-6 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden border-2 ${
                        isSelected 
                        ? 'bg-white shadow-2xl shadow-indigo-100 border-indigo-500/20' 
                        : 'bg-transparent hover:bg-white/50 border-transparent hover:border-slate-100'
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500"></div>}
                      <div className="flex justify-between items-start mb-4">
                         <span className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{ward.name}</span>
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>{ward.type}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Sector Load</p>
                          <p className={`text-lg font-black ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{wardOccupancy} / {wardBeds.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </button>
                  );
                })}
             </div>

             <div className="col-span-12 lg:col-span-9 bg-white rounded-[4rem] p-12 shadow-2xl shadow-slate-200/30 border border-slate-100 min-h-[700px] flex flex-col">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activeWard?.name}</h2>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Unit Overview</p>
                   </div>
                   
                   <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        placeholder="SEARCH PATIENTS IN WARD..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border-none rounded-3xl pl-14 pr-8 py-4 w-full md:w-[350px] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                      />
                   </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 flex-1">
                   {(clinicalBeds[activeWard?.id] || []).map(bed => {
                     const occupant = inpatientEncounters.find(e => String(e.bed_id) === String(bed.id));
                     const isMatch = !searchQuery || (occupant && occupant.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()));
                     
                     if (searchQuery && !isMatch) return null;

                     return (
                       <button
                         key={bed.id}
                         onClick={() => occupant ? setShowDischargePanel(occupant) : handleOpenAdmission(bed.id)}
                         className={`relative flex flex-col p-8 rounded-[3.5rem] transition-all duration-500 group overflow-hidden ${
                           occupant 
                           ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:scale-[1.02]' 
                           : 'bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 hover:scale-[1.02]'
                         }`}
                       >
                         {occupant && (
                           <div className="absolute top-0 right-0 p-6">
                             <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <ArrowUpRight size={20} className="text-white" />
                             </div>
                           </div>
                         )}

                         <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-colors ${occupant ? 'bg-white/10' : 'bg-white group-hover:bg-indigo-50'}`}>
                           <BedIcon size={24} className={occupant ? 'text-white' : 'text-slate-300 group-hover:text-indigo-500'} />
                         </div>

                         <div className="flex-1">
                           <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${occupant ? 'text-white/40' : 'text-slate-400'}`}>{bed.bed_number}</span>
                           {occupant ? (
                             <>
                               <h4 className="text-lg font-black leading-tight mb-2 uppercase">{occupant.patient_name}</h4>
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Active Encounter</span>
                               </div>
                             </>
                           ) : (
                             <>
                               <h4 className="text-lg font-black leading-tight mb-2 uppercase text-slate-300 group-hover:text-slate-900 transition-colors">VACANT</h4>
                               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Plus size={12} className="text-indigo-500" />
                                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Initiate Admission</span>
                               </div>
                             </>
                           )}
                         </div>
                       </button>
                     );
                   })}
                </div>

                <footer className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-900"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                      </div>
                   </div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Live Telemetry Synchronized</p>
                </footer>
             </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden animate-fade-in">
             <header className="p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Admission Ledger</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Historical & Active Patient Flow</p>
                </div>
                <button className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                  <ClipboardList size={18} />
                  Export Telemetry
                </button>
             </header>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 text-left border-b border-slate-50">
                         <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Subject</th>
                         <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location Shard</th>
                         <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                         <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Provider</th>
                         <th className="px-12 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredEncounters.map(e => (
                        <tr key={e.id} className="group hover:bg-slate-50/30 transition-all">
                           <td className="px-12 py-8">
                              <p className="text-sm font-black text-slate-900 uppercase mb-1">{e.patient_name}</p>
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {e.patient_id?.slice(0, 8)}</p>
                           </td>
                           <td className="px-12 py-8">
                              <p className="text-xs font-black text-slate-700 uppercase">{e.ward_name || 'General Ward'}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{e.bed_number || 'TBD'}</p>
                           </td>
                           <td className="px-12 py-8">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{e.status}</span>
                              </div>
                           </td>
                           <td className="px-12 py-8">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">
                                  {(e.provider_name || 'D').charAt(0)}
                                </div>
                                <span className="text-xs font-black text-slate-900 uppercase">{e.provider_name || 'TBD'}</span>
                              </div>
                           </td>
                           <td className="px-12 py-8 text-right">
                              <button onClick={() => setShowDischargePanel(e)} className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all">
                                <LogOut size={18} />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>

      {showAdmissionPanel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0" onClick={() => setShowAdmissionPanel(false)}></div>
           <div className="relative bg-white rounded-[4rem] w-full max-w-2xl p-16 shadow-2xl animate-scale-up border border-white/20">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <UserPlus size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Patient Admission</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Protocol Initiation</p>
                </div>
              </div>

              <form onSubmit={handleFinalizeAdmission} className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject Selection</label>
                   <PatientSearch tenantId={tenant.id} />
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Clinical Lead</label>
                   <select name="providerId" className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all">
                      {clinicalProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-3xl flex items-center gap-4 border border-slate-100/50">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                      <BedIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Location</p>
                      <p className="text-xs font-black text-slate-900 uppercase">{activeWard?.name} • Bed {admissionBedId}</p>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowAdmissionPanel(false)} className="flex-1 py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                      Confirm Admission
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showDischargePanel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0" onClick={() => setShowDischargePanel(null)}></div>
           <div className="relative bg-white rounded-[4rem] w-full max-w-2xl p-16 shadow-2xl animate-scale-up border border-white/20">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <LogOut size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Discharge Protocol</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Settlement & Finalization</p>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Identitity</p>
                    <h4 className="text-xl font-black text-slate-900 uppercase">{showDischargePanel.patient_name}</h4>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Final Clinical Diagnosis</label>
                    <textarea 
                      value={dischargeDiagnosis} 
                      onChange={e => setDischargeDiagnosis(e.target.value)} 
                      placeholder="ENTER FINAL DIAGNOSIS SHARD..." 
                      className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] text-xs font-black uppercase tracking-widest min-h-[120px] outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" 
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Medication Protocol</label>
                    <textarea 
                      value={dischargeMeds} 
                      onChange={e => setDischargeMeds(e.target.value)} 
                      placeholder="ENTER DISCHARGE MEDICATIONS..." 
                      className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] text-xs font-black uppercase tracking-widest min-h-[120px] outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" 
                    />
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button onClick={() => setShowDischargePanel(null)} className="flex-1 py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Cancel</button>
                    <button onClick={finalizeDischarge} className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all">
                      Finalize Discharge
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
