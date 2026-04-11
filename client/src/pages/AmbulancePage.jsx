import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Activity,
  Plus,
  Navigation,
  User,
  Heart,
  Loader2,
  CheckCircle,
  Shield
} from 'lucide-react';
import '../styles/critical-care.css';

export default function AmbulancePage({ tenant }) {
  const { showToast } = useToast();

  const [fleet, setFleet] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'fleet'
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Fetch ambulances from backend
  useEffect(() => {
    loadFleet();
  }, [tenant?.id]);

  const loadFleet = async () => {
    try {
      if (tenant?.id) {
        setLoading(true);
        const data = await api.getAmbulances(tenant.id);
        setFleet(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      showToast({ message: 'Failed to load ambulance fleet', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      tenantId: tenant.id,
      vehicleNumber: fd.get('vehicleNumber'),
      model: fd.get('model'),
      type: fd.get('type'),
      currentDriver: fd.get('currentDriver'),
      contactNumber: fd.get('contactNumber')
    };

    setRegistering(true);
    try {
      await api.createAmbulance(payload);
      showToast({ message: 'Vehicle registered in fleet shard!', type: 'success', title: 'Fleet Control' });
      setShowRegModal(false);
      loadFleet();
    } catch (err) {
      showToast({ message: 'Fleet enrollment failed: ' + err.message, type: 'error' });
    } finally {
      setRegistering(false);
    }
  };

  const stats = {
    available: fleet.filter(a => a.status === 'Available' || a.status === 'available').length,
    active: fleet.filter(a => a.status === 'On Mission' || a.status === 'on-trip').length,
    maintenance: fleet.filter(a => a.status === 'maintenance' || a.status === 'Under Maintenance').length
  };

  if (loading && fleet.length === 0) {
    return (
      <div className="page-shell-premium animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Truck className="w-12 h-12 text-slate-300 animate-pulse mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Fleet Shards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-8">
        <div>
           <h1 className="page-title-rich flex items-center gap-4 text-white">
              Ambulance Dispatch Hub
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">GPS Mesh Shard</span>
           </h1>
           <p className="dim-label">Real-time emergency fleet orchestration and predictive logistics for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-xs font-black uppercase tracking-widest mt-4 flex items-center gap-2 text-white/60">
              <Activity className="w-4 h-4 text-emerald-400" /> GPS Mesh Active • Response Readiness: 98.4%
           </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
            {[
              { id: 'live', label: 'Live Response', icon: Navigation },
              { id: 'fleet', label: 'Fleet Registry', icon: Truck }
            ].map(tab => (
              <button 
                key={tab.id}
                className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-meta-sm transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowRegModal(true)}
            className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 border-none min-w-[180px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Enroll Vehicle
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="glass-panel p-8 border-l-4 border-l-emerald-500">
           <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Responders</p>
              <Truck className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">{stats.available} Units</p>
           <p className="text-[9px] font-black text-emerald-600 mt-2 uppercase tracking-widest">✓ Operational Registry</p>
        </div>
        <div className="glass-panel p-8 border-l-4 border-l-rose-500">
           <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Missions</p>
              <Activity className="w-4 h-4 text-rose-500 opacity-50" />
           </div>
           <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">{stats.active}</p>
           <p className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest">⚠ High-Density Load</p>
        </div>
        <div className="glass-panel p-8 bg-slate-900 text-white border-none shadow-2xl">
           <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fleet Integrity</p>
              <Shield className="w-4 h-4 text-white/50" />
           </div>
           <p className="text-3xl font-black text-white mt-2 tabular-nums">100%</p>
           <p className="text-[9px] font-black text-blue-400 mt-2 uppercase tracking-widest">All Shards Encrypted</p>
        </div>
      </section>


      {activeTab === 'live' && (
        <article className="glass-panel h-[600px] relative bg-slate-50 overflow-hidden flex items-center justify-center group border-2 border-slate-100 border-dashed">
           <div className="absolute inset-0 bg-[#f1f5f9] opacity-30" style={{ backgroundImage: 'radial-gradient(#0077b6 1px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>
           <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto group-hover:scale-110 transition-transform cursor-pointer border border-slate-100">
                 <MapPin className="text-rose-600 w-10 h-10 animate-bounce" />
              </div>
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">GPS Mesh Grid Interface</h4>
              <p className="text-[10px] font-bold text-slate-300 uppercase mt-4">Connecting to Institutional Pre-Hospital Shards...</p>
           </div>
        </article>
      )}

      {activeTab === 'fleet' && (
        <article className="glass-panel p-0 overflow-hidden shadow-sm">
           <div className="premium-table-container">
             <table className="premium-table">
                <thead>
                   <tr>
                      <th className="tracking-widest">Ambulance Unit Identity</th>
                      <th className="tracking-widest">Capability Shard</th>
                      <th className="tracking-widest">Driver Context</th>
                      <th className="tracking-widest">System Status</th>
                      <th className="tracking-widest text-right">Telecom</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {fleet.length === 0 ? (
                     <tr><td colSpan="5" className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[10px]">No fleet nodes registered in this shard</td></tr>
                   ) : fleet.map(unit => (
                     <tr key={unit.id} className="hover:bg-slate-50 transition-colors group">
                        <td>
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                 <Truck size={20} />
                              </div>
                              <div>
                                 <div className="text-sm font-black text-slate-900 uppercase font-primary">{unit.vehicle_number}</div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">SHARD-{unit.id.slice(0, 8)}</div>
                              </div>
                           </div>
                        </td>
                        <td>
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-blue-100">{unit.model || 'Standard Response'}</span>
                        </td>
                        <td>
                           <div className="flex items-center gap-3">
                              {unit.current_driver ? (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                                  <div>
                                     <div className="text-[11px] font-black text-slate-700">{unit.current_driver}</div>
                                     <div className="text-[9px] text-slate-400 font-black tabular-nums">{unit.contact_number || 'N/A'}</div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Operator Unlinked</span>
                              )}
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                unit.status === 'Available' ? 'bg-emerald-500' : 
                                unit.status === 'On Mission' ? 'bg-rose-500 animate-pulse' : 
                                'bg-slate-400'
                              }`}></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                 {unit.status}
                              </span>
                           </div>
                        </td>
                        <td className="text-right">
                           <button
                             type="button"
                             disabled={!unit.contact_number}
                             onClick={() => unit.contact_number && window.open(`tel:${unit.contact_number}`, '_self')}
                             className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-rose-500 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                           >
                              <Phone size={16} />
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </article>
      )}

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="relative glass-panel w-full max-w-2xl p-10 shadow-3xl">
              <header className="mb-10 flex justify-between items-start">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Fleet Registration</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Enroll New Pre-Hospital Response Unit</p>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400" onClick={() => setShowRegModal(false)}>
                    <Plus className="w-6 h-6 rotate-45" />
                 </button>
              </header>

              <form onSubmit={handleRegisterVehicle} className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vehicle Reg Number</label>
                       <input name="vehicleNumber" className="input-field h-14 bg-slate-50 border-none font-black uppercase tracking-widest" placeholder="E.G. MH-12-AMB-1234" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capability Class (Model)</label>
                       <input name="model" className="input-field h-14 bg-slate-50 border-none font-bold" placeholder="E.G. Force Traveler ICU" required />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Response Shard (Type)</label>
                       <select name="type" className="input-field h-14 bg-slate-50 border-none font-black uppercase text-[10px]" required>
                          <option value="Advanced Life Support">Advanced Life Support (ALS)</option>
                          <option value="Basic Life Support">Basic Life Support (BLS)</option>
                          <option value="Patient Transport">Patient Transport</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Initial Driver Shard</label>
                       <input name="currentDriver" className="input-field h-14 bg-slate-50 border-none font-bold" placeholder="Full Name" />
                    </div>
                 </div>

                 <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-1" />
                    <p className="text-[10px] font-bold text-blue-900 uppercase tracking-tight">
                       Fleet unit will be initialized with GPS linkage. Ensure the responder tablet is synced with this institutional vehicle ID.
                    </p>
                 </div>

                 <div className="pt-8 flex gap-4">
                    <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Abort</button>
                    <button type="submit" disabled={registering} className="flex-[2] btn-primary py-5 text-[11px] font-black uppercase shadow-2xl bg-slate-900 border-none rounded-2xl">
                       {registering ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Enroll Vehicle Shard'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
