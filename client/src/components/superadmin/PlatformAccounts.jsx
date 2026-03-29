import React from 'react';
import { Database, Shield, HardDrive, Cpu, DollarSign, TrendingUp, Users, Activity } from 'lucide-react';

export default function PlatformAccounts({ tenants = [] }) {
  // Computed infrastructure metrics (Simulated)
  const stats = {
    totalCompute: "128 Cores",
    utilization: "64%",
    storage: "2.4 TB",
    vendorSpending: 42500,
    operationalCost: 12800,
    projectedGrowth: "+14.5%"
  };

  const vendorData = [
    { name: 'Cloud Infrastructure (AWS)', cost: 18450, status: 'stable', icon: Cpu },
    { name: 'Storage Cluster (S3)', cost: 6200, status: 'growing', icon: HardDrive },
    { name: 'Database Management', cost: 12400, status: 'stable', icon: Database },
    { name: 'Security & Auth Services', cost: 5450, status: 'optimized', icon: Shield },
  ];

  return (
    <div className="space-y-8 animate-fade-in shadow-premium p-6 bg-slate-50/30 rounded-3xl border border-slate-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
           <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform Financial Control</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Infrastructure spending & Vendor management</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-700 transition-all">Export Fiscal Report</button>
        </div>
      </header>

      {/* Infrastructure Vitals */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-l-4 border-indigo-500 bg-white">
           <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compute Shards</span>
              <Cpu className="w-4 h-4 text-indigo-500 opacity-50" />
           </div>
           <p className="text-2xl font-black text-slate-900">{stats.totalCompute}</p>
           <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: stats.utilization }}></div>
           </div>
           <p className="text-[9px] font-bold text-indigo-600 mt-2 uppercase">{stats.utilization} Utilization</p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-emerald-500 bg-white">
           <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Outflow</span>
              <DollarSign className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <p className="text-2xl font-black text-slate-900">${stats.vendorSpending.toLocaleString()}</p>
           <p className="text-[9px] font-bold text-emerald-600 mt-2 uppercase">Billable this period</p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-amber-500 bg-white">
           <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Cost</span>
              <Activity className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <p className="text-2xl font-black text-slate-900">${stats.operationalCost.toLocaleString()}</p>
           <p className="text-[9px] font-bold text-amber-600 mt-2 uppercase">-4% optimization applied</p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-rose-500 bg-white">
           <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projection</span>
              <TrendingUp className="w-4 h-4 text-rose-500 opacity-50" />
           </div>
           <p className="text-2xl font-black text-slate-900">{stats.projectedGrowth}</p>
           <p className="text-[9px] font-bold text-rose-600 mt-2 uppercase">Est. Monthly Growth</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendor Spending Breakdown */}
        <article className="glass-panel p-8 bg-white border border-slate-100">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 pb-4 border-b border-slate-50">Authorized Vendor Leases</h3>
           <div className="space-y-6">
              {vendorData.map((vendor, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                         <vendor.icon size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{vendor.name}</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{vendor.status}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-slate-900">${vendor.cost.toLocaleString()}</p>
                      <button className="text-[8px] font-black uppercase text-indigo-500 hover:underline">View Invoice</button>
                   </div>
                </div>
              ))}
           </div>
        </article>

        {/* Tenant Contribution Matrix */}
        <article className="glass-panel p-0 overflow-hidden bg-white border border-slate-100">
           <header className="p-8 border-b border-slate-50 bg-slate-50/20">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tenant Fiscal Contribution</h3>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Top 5 active accounts</p>
           </header>
           <div className="premium-table-container">
              <table className="premium-table">
                 <thead>
                    <tr>
                       <th>Account</th>
                       <th>Cloud Load</th>
                       <th className="text-right">Revenue</th>
                    </tr>
                 </thead>
                 <tbody>
                    {tenants.slice(0, 5).map((t, idx) => {
                      const loadValue = Math.random() * 80 + 20;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                           <td>
                              <div className="text-xs font-black text-slate-900 uppercase">{t.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: {t.id}</div>
                           </td>
                           <td>
                              <div className="flex items-center gap-2 min-w-[80px]">
                                 <div className="flex-1 h-1 bg-slate-100 rounded-full">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${loadValue}%` }}></div>
                                 </div>
                                 <span className="text-[9px] font-bold text-slate-500 uppercase">{loadValue.toFixed(0)}%</span>
                              </div>
                           </td>
                           <td className="text-right font-black text-slate-900 tabular-nums">
                              ${(Math.random() * 5000 + 1500).toFixed(0)}
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </article>
      </div>
    </div>
  );
}
