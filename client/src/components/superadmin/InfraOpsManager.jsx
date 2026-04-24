import React from 'react';
import { 
  Server, Cpu, Database, Network, Activity, Zap, 
  AlertTriangle, ArrowUpRight, ChevronRight, 
  Bell, HardDrive, Shield, RefreshCcw,
  BarChart3, Settings, Terminal
} from 'lucide-react';

export default function InfraOpsManager({ tenants = [], overview = {}, apiClient }) {
  const infraStats = overview?.infra || { cpu: 24, memory: 38, disk: 31, network: 4, status: 'stable' };

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* PROFESSIONAL TITLE BLOCK */}
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase mb-1">Infrastructure Ops</h2>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Operational HUD</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cross-Shard Fleet Telemetry</span>
            </div>
         </div>
         <div className="flex gap-4">
            <div className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white ${
               infraStats.status === 'stable' ? 'text-emerald-600 shadow-sm' : 'text-rose-600 shadow-sm'
            }`}>
               <div className={`w-2 h-2 rounded-full ${infraStats.status === 'stable' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
               Cluster State: {infraStats.status}
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
               <RefreshCcw size={14} /> Synchronize Nodes
            </button>
         </div>
      </div>

      {/* CORE RESOURCE SHARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'Compute Engine', value: infraStats.cpu, unit: '%', icon: Cpu, color: 'indigo' },
            { label: 'Memory Matrix', value: infraStats.memory, unit: '%', icon: Database, color: 'emerald' },
            { label: 'Persistent Shard', value: infraStats.disk, unit: '%', icon: HardDrive, color: 'rose' },
            { label: 'Ingress Node', value: infraStats.network, unit: 'Gb/s', icon: Zap, color: 'amber' },
         ].map((stat, idx) => (
            <div key={idx} className="group relative bg-white border border-slate-200 p-8 rounded-[2.5rem] transition-all hover:border-indigo-200 hover:shadow-md overflow-hidden flex flex-col justify-between min-h-[220px]">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon size={64} strokeWidth={1} />
               </div>

               <div>
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all mb-8`}>
                     <stat.icon size={22} />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value}</span>
                     <span className="text-[12px] font-black text-slate-400 uppercase">{stat.unit}</span>
                  </div>
               </div>

               {/* MINI GRAPH SHARD */}
               <div className="flex items-end gap-1 h-3 mt-8">
                  {[...Array(12)].map((_, i) => {
                     const height = Math.random() * 80 + 20;
                     return (
                        <div 
                           key={i} 
                           className={`flex-1 rounded-full transition-all duration-1000 ${
                              idx === 0 ? 'bg-indigo-500/20 group-hover:bg-indigo-500' :
                              idx === 1 ? 'bg-emerald-500/20 group-hover:bg-emerald-500' :
                              idx === 2 ? 'bg-rose-500/20 group-hover:bg-rose-500' :
                              'bg-amber-500/20 group-hover:bg-amber-500'
                           }`} 
                           style={{ height: `${height}%` }} 
                        />
                     );
                  })}
               </div>
            </div>
         ))}
      </section>

      {/* SHART CONSUMPTION EXPLORER */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden p-4">
         <header className="p-10 pb-6 flex items-center justify-between border-b border-slate-100">
            <div>
               <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Shard Consumption Matrix</h3>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Live institutional overhead monitoring</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Maintenance
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                  <div className="w-2 h-2 rounded-full bg-rose-500" /> Peak Load
               </div>
            </div>
         </header>

         <div className="divide-y divide-slate-100">
            {tenants.map((t, idx) => {
               const load = Math.floor(Math.random() * 80 + 10);
               const isHigh = load > 75;

               return (
                  <div key={t.id || idx} className="p-8 group hover:bg-slate-50 flex items-center gap-12 transition-all">
                     <div className="w-48 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[12px] font-black text-slate-500 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all uppercase">
                           {t.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 mb-0.5">{t.name}</h4>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest tabular-nums">{t.code || 'CORE-ID'}</span>
                        </div>
                     </div>

                     <div className="flex-1 grid grid-cols-4 gap-8">
                        {[
                          { label: 'Compute', val: `${load}%`, color: isHigh ? 'text-rose-600' : 'text-emerald-600' },
                          { label: 'IOPS Capacity', val: isHigh ? 'HEAVY' : 'STABLE', color: 'text-slate-600' },
                          { label: 'Cross-Shard Ingress', val: 'Minimal', color: 'text-slate-400' },
                          { label: 'Ingress Latency', val: '0.8ms', color: 'text-indigo-600' }
                        ].map((m, i) => (
                          <div key={i}>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                             <p className={`text-[12px] font-black uppercase tabular-nums tracking-tighter ${m.color}`}>{m.val}</p>
                          </div>
                        ))}
                     </div>

                     <div className="w-48 flex items-center justify-end gap-6">
                        <div className="flex-1">
                           <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${isHigh ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${load}%` }} />
                           </div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-white transition-all">
                           <ChevronRight size={16} />
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </section>

      {/* EVENT LOGS - TERMINAL STYLE (Keeping a bit of contrast but clinical) */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-xl">
         <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Server size={300} strokeWidth={1} className="text-white" />
         </div>

         <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
               <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Platform Pulse</h3>
               <p className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase">Core Expansion Logic</p>
            </div>
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-2xl">
               <Activity size={32} className="animate-pulse" />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 font-mono">
            {[
               { title: 'Ingress Peak Pattern', shard: 'TENANT-MBC', level: 'HIGH', time: '14:23:01 UTC', desc: 'Auto-scaling protocol active in AP-SOUTH-1' },
               { title: 'Encrypted Shard Migration', shard: 'CORE-DBMS', level: 'LOG', time: '12:05:44 UTC', desc: 'Success: 1.4TB moved to S3-Sydney' }
            ].map((alert, i) => (
               <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex items-start gap-6 group/item hover:bg-white/10 transition-all">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                     alert.level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                  }`}>
                     <Zap size={22} className="group-hover/item:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[14px] font-black text-white uppercase tracking-tight">{alert.title}</h4>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{alert.time}</span>
                     </div>
                     <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic mb-4">{alert.desc}</p>
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 uppercase tracking-widest">{alert.shard}</span>
                        <div className="flex-1 h-[1px] bg-white/5" />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${alert.level === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>[ PRIORITY: {alert.level} ]</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* SECURITY & PLATFORM INTEGRITY (Governance Shard) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
         <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-[3rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
               <Shield size={240} strokeWidth={1} />
            </div>
            
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                     <Shield size={24} />
                  </div>
                  <div>
                     <h3 className="text-[16px] font-black text-slate-900 tracking-tight uppercase">Governance Protocols</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Global platform-level security overrides</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={async () => {
                      if (!window.confirm("⚠️ UNIVERSAL LOGOUT: Invalidate ALL active sessions across ALL hospital shards? This will force global re-authentication.")) return;
                      try {
                        await apiClient.revokePlatformSessions();
                        alert("Global session revocation dispatched successfully.");
                      } catch (e) {
                        alert("Disruption observed: " + e.message);
                      }
                    }}
                    className="p-8 rounded-[2rem] bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 transition-all text-left group/btn"
                  >
                     <Zap size={24} className="text-rose-600 mb-6 group-hover/btn:scale-125 transition-transform" />
                     <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight mb-2">Universal Session Kill</h4>
                     <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic pr-6 group-hover/btn:text-rose-700 transition-colors">Emergency isolation: Revokes all platform identities and tokens immediately across the global cluster.</p>
                  </button>

                  <button 
                    onClick={async () => {
                      try {
                        await apiClient.platformAudit();
                        alert("Strategic platform audit initiated. Monitoring node consistency.");
                      } catch (e) {
                         alert("Audit failed to initialize: " + e.message);
                      }
                    }}
                    className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all text-left group/btn"
                  >
                     <Settings size={24} className="text-indigo-600 mb-6 group-hover/btn:rotate-90 transition-transform" />
                     <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight mb-2">Full Platform Sync Audit</h4>
                     <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic pr-6 group-hover/btn:text-indigo-700 transition-colors">Synchronize node metadata, verify shard residency, and reconcile distributed database identities.</p>
                  </button>
               </div>
            </div>
         </div>

         <div className="bg-[#f8fafc] border border-slate-200 shadow-inner rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Threat Discovery</h4>
               <div className="space-y-6">
                  {[
                     { label: 'Ingress Rate', val: 'Minimal', status: 'optimal' },
                     { label: 'Anomalous IDs', val: '0 SHARDS', status: 'optimal' },
                     { label: 'Auth Latency', val: '142ms', status: 'nominal' }
                  ].map((t, i) => (
                     <div key={i} className="flex justify-between items-end border-b border-slate-200 pb-4">
                        <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.label}</p>
                           <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{t.val}</p>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 italic uppercase">[{t.status}]</span>
                     </div>
                  ))}
               </div>
            </div>
            
            <div className="relative z-10 pt-10">
               <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Platform Kernel Integrity: 100%</span>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
