import { useState, useMemo } from 'react';
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
  Heart
} from 'lucide-react';
import '../styles/critical-care.css';

const MOCK_AMBULANCES = [
  { id: 'AMB-001', plate: 'MH-12-AS-1024', status: 'available', driver: 'Rahul S.', contact: '+91 98822 10293', type: 'Advanced Life Support' },
  { id: 'AMB-002', plate: 'MH-12-AS-2045', status: 'on-trip', driver: 'Vikram K.', contact: '+91 98822 44556', type: 'Basic Life Support', destination: 'Main Trauma Center' },
  { id: 'AMB-003', plate: 'MH-12-AS-9921', status: 'maintenance', driver: 'None', contact: 'N/A', type: 'Patient Transport' },
];

const MOCK_TRIPS = [
  { id: 'TRP-101', patient: 'Deepak Varma', status: 'En Route', ETA: '8 mins', location: 'Swargate Square', ambulance: 'AMB-002' },
];

export default function AmbulancePage({ tenant }) {
  const [fleet, setFleet] = useState(MOCK_AMBULANCES);
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'fleet'

  const stats = {
    available: fleet.filter(a => a.status === 'available').length,
    active: trips.length,
    maintenance: fleet.filter(a => a.status === 'maintenance').length
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="page-title-rich flex items-center gap-3">
              Emergency Fleet Control (Ambulance)
              <span className="text-meta-sm bg-rose-600 text-white px-3 py-1 rounded-full border border-white/10 shadow-lg shadow-rose-500/20">Pre-Hospital Response</span>
           </h1>
           <p className="dim-label italic">Real-time emergency dispatch, fleet monitoring, and pre-hospital clinical coordination for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-meta-sm text-slate-400 mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> GPS Shards Linked • Fleet Readiness: 98%
           </p>
        </div>
        <div className="flex bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit">
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-meta-sm transition-all ${activeTab === 'live' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('live')}
          >
            Live Response Map
          </button>
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-meta-sm transition-all ${activeTab === 'fleet' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('fleet')}
          >
            Fleet Registry
          </button>
        </div>
      </header>

      <section className="vitals-monitor mb-10">
        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label text-emerald-600">Available Responders</span>
              <Truck className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{stats.available} Units</span>
           <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase">Ready for Dispatch</p>
        </div>

        <div className="vital-node vital-node--critical shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label text-rose-600">Active Life-Trips</span>
              <Navigation className="w-4 h-4 text-rose-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{stats.active}</span>
           <p className="text-[10px] font-black text-rose-600 mt-2 uppercase">Mean Response: 12.4m</p>
        </div>

        <div className="vital-node vital-node--warning shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label text-amber-600">Decommissioned</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{stats.maintenance}</span>
           <p className="text-[10px] font-black text-amber-600 mt-2 uppercase">Undergoing Calibration</p>
        </div>
      </section>

      {activeTab === 'live' && (
        <div className="grid grid-cols-12 gap-8">
          {/* Mock Map View */}
          <main className="col-span-12 lg:col-span-8">
            <article className="clinical-card h-[600px] relative bg-slate-100 overflow-hidden flex items-center justify-center group border-dashed border-2 border-slate-300">
               <div className="absolute inset-0 bg-[#f1f5f9]">
                 {/* CSS Grid based Map Pattern */}
                 <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#0077b6 1px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>
               </div>
               <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform cursor-pointer">
                     <MapPin className="text-rose-600 w-10 h-10 animate-bounce" />
                  </div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">GPS Mesh Grid Interface</h4>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">Connecting to NAH Response Shards...</p>
               </div>

               {/* Mock Vehicle Pins */}
               <div className="absolute top-1/4 left-1/3 animate-pulse">
                  <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-2xl flex items-center gap-2 border border-white/20">
                     <Truck size={12} className="text-emerald-400" />
                     <span className="text-[9px] font-black uppercase tracking-tighter">AMB-001 (Ready)</span>
                  </div>
               </div>
               
               <div className="absolute bottom-1/3 right-1/4 cursor-pointer">
                  <div className="px-3 py-1.5 bg-rose-600 text-white rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-pulse">
                     <Activity size={12} className="text-white" />
                     <span className="text-[9px] font-black uppercase tracking-tighter">AMB-002 (ETA: 8m)</span>
                  </div>
               </div>
            </article>
          </main>

          <aside className="col-span-12 lg:col-span-4 space-y-8">
             <div className="clinical-card !bg-slate-900 text-white border-none shadow-2xl">
                <header className="mb-8 p-6 bg-white/5 rounded-2xl flex items-center gap-4">
                   <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/50">
                      <Plus className="w-5 h-5 text-white" />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Emergency Dispatch</h3>
                      <p className="text-[9px] text-white/40 font-bold uppercase mt-1">Initiate Response Protocol</p>
                   </div>
                </header>

                <form className="space-y-6 px-2">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Pickup Location Shard</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs font-black text-white outline-none focus:border-rose-500/50 transition-all" placeholder="Enter landmark or GPS..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Patient Narrative (Pre-Dispatch)</label>
                      <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs font-black text-white outline-none focus:border-rose-500/50 h-24 resize-none" placeholder="Cardiac distress, trauma, stabilizer needed..."></textarea>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all border-none">
                         AMB-001 (FAST)
                      </button>
                      <button type="button" className="py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                         OTHER UNIT
                      </button>
                   </div>
                </form>
             </div>

             <div className="clinical-card border-none bg-emerald-50/30">
                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-6">Active Response Feed</h4>
                {trips.map(trip => (
                  <div key={trip.id} className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm animate-fade-in group hover:translate-x-1 transition-all">
                     <div className="flex justify-between items-start">
                        <div>
                           <div className="text-xs font-black text-slate-900 mb-1">{trip.patient}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trip.location}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-tight border border-rose-100">Live Trip</span>
                     </div>
                     <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-2">
                           <Truck size={12} className="text-indigo-500" />
                           <span className="text-[10px] font-black text-indigo-700 uppercase">{trip.ambulance}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-slate-300" />
                           <span className="text-[10px] font-black text-slate-900 tabular-nums">ETA: {trip.ETA}</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </aside>
        </div>
      )}

      {activeTab === 'fleet' && (
        <article className="clinical-card !p-0 overflow-hidden">
           <div className="premium-table-container">
             <table className="premium-table">
                <thead>
                   <tr>
                      <th className="tracking-widest">Ambulance Unit</th>
                      <th className="tracking-widest">Capability Class</th>
                      <th className="tracking-widest">Active Shard (Driver)</th>
                      <th className="tracking-widest">System Status</th>
                      <th className="tracking-widest text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {fleet.map(unit => (
                     <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                        <td>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                 <Truck size={18} />
                              </div>
                              <div>
                                 <div className="text-sm font-black text-slate-900 uppercase">{unit.plate}</div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{unit.id}</div>
                              </div>
                           </div>
                        </td>
                        <td>
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-indigo-100">{unit.type}</span>
                        </td>
                        <td>
                           <div className="flex items-center gap-2">
                              {unit.driver !== 'None' ? (
                                <>
                                  <User size={12} className="text-slate-400" />
                                  <div>
                                     <div className="text-[11px] font-black text-slate-700">{unit.driver}</div>
                                     <div className="text-[9px] text-slate-400 font-black tabular-nums">{unit.contact}</div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Unallocated</span>
                              )}
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                unit.status === 'available' ? 'bg-emerald-500' : 
                                unit.status === 'on-trip' ? 'bg-rose-500 animate-pulse' : 
                                'bg-amber-400'
                              }`}></span>
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                 {unit.status.replace('-', ' ')}
                              </span>
                           </div>
                        </td>
                        <td className="text-right">
                           <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-all">
                              <Phone size={14} />
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </article>
      )}

      <footer className="mt-12 p-8 bg-blue-50/30 rounded-3xl border border-blue-100 flex items-start gap-6">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <ShieldCheck size={24} />
         </div>
         <div>
            <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">Institutional Response Directive</h4>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic max-w-4xl">
               Pre-hospital care trajectories must be synced with the ER Clinical Shard upon dispatch. Stabilization meds administered during transport should be recorded in the patient persistence ledger once the subject is ingested into the facility grid.
            </p>
         </div>
      </footer>
    </div>
  );
}
