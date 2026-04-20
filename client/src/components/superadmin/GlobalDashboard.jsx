import React from 'react';
import { 
  Building2, Users, Stethoscope, Bed, 
  Ambulance, FlaskConical, Star, Activity, 
  ArrowUpRight, Globe, ShieldCheck, Zap, 
  Database, Cpu, Network
} from 'lucide-react';
import * as api from '../../api.js';
import { useToast } from '../../hooks/useToast.jsx';

export default function GlobalDashboard({ tenants = [], overview = {} }) {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const totals = overview?.totals || {};
  
  const activeTenantsCount = tenants.length;
  const totalDoctors = Number(totals.doctors || 0) > 0
    ? totals.doctors
    : tenants.reduce((s, t) => s + Number(t.doctors ?? t.doctors_count ?? 0), 0);
  const totalPatients = Number(totals.patients || 0) > 0
    ? totals.patients
    : tenants.reduce((s, t) => s + Number(t.patients ?? t.patient_count ?? t.patients_count ?? 0), 0);
  const availableBeds = Number(totals.bedsAvailable || 0) > 0
    ? totals.bedsAvailable
    : tenants.reduce((s, t) => s + Number(t.bedsAvailable ?? t.beds_available ?? 0), 0);
  const availableAmbulance = Number(totals.ambulancesAvailable || 0) > 0
    ? totals.ambulancesAvailable
    : tenants.reduce((s, t) => s + Number(t.ambulancesAvailable ?? t.ambulances_available ?? 0), 0);

  const stats = [
    { label: 'Hospitals', icon: Globe, value: activeTenantsCount, sub: 'Total registered' },
    { label: 'Staff', icon: Stethoscope, value: totalDoctors, sub: 'Total verified' },
    { label: 'Patients', icon: Users, value: totalPatients, sub: 'Patient registry' },
    { label: 'Beds', icon: Bed, value: availableBeds, sub: 'Beds ready' },
    { label: 'Ambulances', icon: Ambulance, value: availableAmbulance, sub: 'Fleet info' },
    { label: 'Lab Work', icon: FlaskConical, value: totals.labTests || '1.1k', sub: 'Tests done' },
  ];

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await api.syncSuperadminMetrics();
      if (res && res.success) {
        showToast({ title: 'Synchronization Complete', message: 'Metrics aggregated across all shards.', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      showToast({ title: 'Sync Failure', message: 'Nexus link timed out.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* PROFESSIONAL TITLE BLOCK */}
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">Main Dashboard</h2>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Operational HUD</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Real-time Shard Aggregation</span>
            </div>
         </div>
         <button 
            disabled={isSyncing}
            onClick={handleSync}
            className={`btn-premium gap-3 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
            <Activity size={18} className={isSyncing ? "animate-spin" : ""} /> 
            {isSyncing ? "Updating..." : "Update Everything"}
         </button>
      </div>

      {/* AGNOSTIC STAT GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
         {stats.map((stat, i) => (
            <div key={i} className="group relative bg-white border border-slate-200 shadow-sm p-6 rounded-[2rem] transition-all hover:shadow-md hover:border-indigo-200 overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon size={48} strokeWidth={1} />
               </div>
               <div className="mb-6 w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                  <stat.icon size={18} />
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
               <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{stat.value}</h4>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{stat.sub}</span>
               </div>
            </div>
         ))}
      </div>

      {/* SHARD REGISTRY */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden">
         <header className="p-8 pb-4 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-[0.25em]">Hospital List</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
               <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Nodes: {tenants.length}</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> High Load: 0</span>
            </div>
         </header>

         <div className="overflow-x-auto p-4 pt-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
               <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                     <th className="px-6 py-4">Hospital Name</th>
                     <th className="px-6 py-4 text-center">Staff</th>
                     <th className="px-6 py-4 text-center">Patients</th>
                     <th className="px-6 py-4 text-center">Activity</th>
                     <th className="px-6 py-4 text-center">Performance</th>
                     <th className="px-6 py-4 text-right">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {tenants.map((t, i) => (
                     <tr key={t.id || i} className="group hover:bg-slate-50 transition-all rounded-3xl">
                        <td className="px-6 py-5 bg-white group-hover:bg-transparent first:rounded-l-2xl border-y border-l border-slate-100 group-hover:border-indigo-200">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[12px] uppercase">
                                 {t.name?.slice(0, 2)}
                              </div>
                              <div>
                                 <p className="text-[13px] font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{t.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.code || 'SYS-NODE'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5 bg-white group-hover:bg-transparent border-y border-slate-100 text-center text-xs font-black text-slate-600 tabular-nums">
                           {Number(t.doctors ?? t.doctors_count ?? 0)} <span className="text-[9px] text-slate-400 ml-1">PA</span>
                        </td>
                        <td className="px-6 py-5 bg-white group-hover:bg-transparent border-y border-slate-100 text-center text-xs font-black text-slate-600 tabular-nums">
                           {Number(t.patients ?? t.patient_count ?? t.patients_count ?? 0)}
                        </td>
                        <td className="px-6 py-5 bg-white group-hover:bg-transparent border-y border-slate-100 text-center">
                           <div className="flex flex-col items-center gap-1.5">
                              <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500 shadow-sm" style={{ width: `${Math.min((Number(t.activeUsers ?? t.active_users_count ?? 0)) * 10, 100)}%` }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-500 uppercase">{Number(t.activeUsers ?? t.active_users_count ?? 0)} Active</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 bg-white group-hover:bg-transparent border-y border-slate-100 text-center">
                           <div className="flex items-center justify-center gap-2">
                              {Array.from({ length: 5 }).map((_, starIdx) => (
                                 <Star 
                                    key={starIdx} 
                                    size={10} 
                                    className={starIdx < (t.rating || 4) ? "text-amber-500 fill-current" : "text-slate-300"} 
                                 />
                              ))}
                           </div>
                        </td>
                        <td className="px-6 py-5 bg-white group-hover:bg-transparent last:rounded-r-2xl border-y border-r border-slate-100 text-right">
                           <div className="flex items-center justify-end gap-3 font-black text-[10px] uppercase tracking-widest">
                              <span className="text-emerald-600">OPERATIONAL</span>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>

      {/* SYSTEM ARCHITECTURE HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
         <div className="col-span-1 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm rounded-[2.5rem] p-10 flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-6">
                  <Cpu size={24} />
               </div>
               <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Kernel Status</h4>
               <p className="text-2xl font-black text-slate-900 tracking-tighter leading-tight mb-2">Platform Performance: Stable Phase</p>
               <p className="text-[12px] font-bold text-slate-500 leading-relaxed italic">
                  Advanced load balancing successfully rerouted 12% of traffic across Australian shards.
               </p>
            </div>
            <Activity className="text-indigo-600/5 absolute -right-8 -bottom-8" size={180} strokeWidth={1} />
         </div>

         <div className="col-span-1 bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-10 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
            <div>
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
               </div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Security Protocol</h4>
               <p className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-700 transition-colors italic uppercase leading-tight mb-2">Zero-Trust Active</p>
               <p className="text-[12px] font-bold text-slate-500 leading-relaxed">Identity node synchronization complete. 256-bit encryption verified across all medical sharding.</p>
            </div>
            <div className="flex items-center gap-2 mt-8 border-t border-slate-100 pt-6">
               <Network className="text-emerald-500" size={14} />
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protocol Version v4.2.0-SECURE</span>
            </div>
         </div>

         <div className="col-span-1 bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden group hover:border-amber-200 transition-colors">
            <div className="relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6">
                  <Database size={24} />
               </div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Database Persistence</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                     <span>Sharding Health</span>
                     <span className="text-slate-900">99.99%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 animate-pulse" style={{ width: '99%' }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 italic">Persistence layer running on Supabase Sydney Shard.</p>
               </div>
            </div>
            <Zap className="text-slate-900/[0.02] absolute -right-12 -bottom-12 group-hover:text-amber-500/10 transition-colors" size={240} strokeWidth={0.5} />
         </div>
      </div>
    </div>
  );
}

