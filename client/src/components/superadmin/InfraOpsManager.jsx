import React from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  Network, 
  Activity, 
  Zap, 
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Bell,
  HardDrive
} from 'lucide-react';

export default function InfraOpsManager({ tenants = [], overview = {} }) {
  const infraStats = overview?.infra || { cpu: 24, memory: 38, disk: 31, network: 4, status: 'stable' };

  return (
    <div className="space-y-12 animate-fade-in px-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Platform Infrastructure Shards</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">* Real-time Telemetry: AP-SOUTH-1 Logic Shard 4</p>
         </div>
         <div className="flex gap-4">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm ${
               infraStats.status === 'stable' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
               <div className={`w-2 h-2 rounded-full ${infraStats.status === 'stable' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
               Cluster Status: {infraStats.status}
            </div>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors shadow-lg">Refresh Nodes</button>
         </div>
      </header>

      {/* Global Resource Matrix with Colorful Shards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'Compute Engine', value: infraStats.cpu, unit: '%', icon: Cpu, color: 'indigo', gradient: 'from-indigo-500 to-blue-600' },
            { label: 'Memory Matrix', value: infraStats.memory, unit: '%', icon: Database, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Persistent Shard', value: infraStats.disk, unit: '%', icon: HardDrive, color: 'rose', gradient: 'from-rose-500 to-pink-600' },
            { label: 'Ingress Node', value: infraStats.network, unit: 'Gb/s', icon: Zap, color: 'amber', gradient: 'from-amber-400 to-orange-500' },
         ].map((stat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center mb-6 shadow-lg shadow-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value}</span>
                     <span className="text-sm font-black text-slate-300 uppercase">{stat.unit}</span>
                  </div>
               </div>
               {/* Animated Sparkline Shard */}
               <div className="mt-8 flex items-end gap-1 h-12">
                  {[...Array(12)].map((_, i) => (
                     <div 
                        key={i} 
                        className={`w-full bg-${stat.color}-100 rounded-t-lg transition-all duration-1000 group-hover:bg-${stat.color}-200`} 
                        style={{ height: `${Math.random() * 80 + 20}%` }} 
                     />
                  ))}
               </div>
               <div className={`absolute -bottom-8 -right-8 w-24 h-24 bg-${stat.color}-500/5 blur-2xl rounded-full`} />
            </div>
         ))}
      </section>

      {/* Tenant Resource Consumption Breakup */}
      <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <header className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Resource Consumption by Tenant Shard</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Numerical monitoring for scalability perspective</p>
            </div>
            <button className="p-3 hover:bg-slate-100 rounded-xl transition-all">
               <AlertTriangle size={20} className="text-amber-500" />
            </button>
         </header>

         <div className="p-6 md:p-10 space-y-6">
            {tenants.map((t, idx) => {
               const load = Math.floor(Math.random() * 80 + 10);
               const isHigh = load > 75;
               const isLow = load < 20;

               return (
                  <div key={t.id || idx} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row items-center gap-8 group">
                     <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs font-black text-indigo-600 transition-transform group-hover:scale-110">
                           {t.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-indigo-600 transition-all">{t.name}</h4>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.code || 'CORE-ID'}</span>
                        </div>
                     </div>

                     <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                          { label: 'CPU Shard', val: `${load}%` },
                          { label: 'IOPS Cluster', val: 'Low' },
                          { label: 'Bandwidth', val: 'Minimal' },
                          { label: 'Shard Latency', val: '0.8ms' }
                        ].map((m, i) => (
                          <div key={i}>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                             <p className="text-xs font-black text-slate-900 tabular-nums uppercase">{m.val}</p>
                          </div>
                        ))}
                     </div>

                     <div className="flex items-center gap-4">
                        {isHigh && (
                           <div className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                              <Bell size={10} /> Auto-Scale Alert
                           </div>
                        )}
                        {isLow && (
                           <div className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                              Maintenance Zone
                           </div>
                        )}
                        {!isHigh && !isLow && (
                           <div className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              Shard Stable
                           </div>
                        )}
                        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                     </div>
                  </div>
               );
            })}
         </div>
      </section>

      {/* Infrastructure Alert Logs */}
      <section className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Active Scalability Events</h3>
               <p className="text-3xl font-black tracking-tight mt-1 leading-none">Auto-Scaling Logic System</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-indigo-400">
               <Activity size={24} className="animate-pulse" />
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
               { title: 'Peak Load Detected', shard: 'TENANT-MBC', level: 'HIGH', time: '14m ago' },
               { title: 'Cluster Expansion Shard-4', shard: 'CORE-K8S', level: 'OPT', time: '2h ago' }
            ].map((alert, i) => (
               <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex gap-4 items-center">
                     <div className={`w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center transition-transform group-hover:rotate-12`}>
                        <Zap size={18} />
                     </div>
                     <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1">{alert.title}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{alert.shard} · {alert.time}</p>
                     </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${alert.level === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                     {alert.level}
                  </span>
               </div>
            ))}
         </div>
         
         <div className="absolute top-0 right-0 p-10 opacity-5">
            <Server size={300} className="stroke-[0.2]" />
         </div>
      </section>
    </div>
  );
}
