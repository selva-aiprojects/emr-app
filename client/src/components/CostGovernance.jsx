import React from 'react';
import { CreditCard, TrendingDown, LayoutDashboard, ChevronRight, Activity, Zap, DollarSign } from 'lucide-react';

export default function CostGovernance({ tenant }) {
  // Simulated tenant-level accounting metrics
  const financialData = {
    monthlyBurn: 1250,
    currentUsage: 840.42,
    vendorSpend: 420.50,
    opsCost: 180.20,
    lastMonth: 1100
  };

  return (
    <article className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in mb-8">
      <header className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <CreditCard size={18} />
           </div>
           <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Running Cost Governance</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tenant Infrastructure Account</p>
           </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">
           <TrendingDown size={12} className="mr-1" /> Cost Optimized - 8% efficiency GAIN
        </div>
      </header>

      <div className="p-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monthly Spend Pool</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">${financialData.currentUsage}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">/ ${financialData.monthlyBurn}</span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${(financialData.currentUsage / financialData.monthlyBurn) * 100}%` }}></div>
               </div>
            </div>

            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Vendor Leases</span>
               <div className="text-lg font-black text-slate-800 tabular-nums">${financialData.vendorSpend}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase">Cloud & Storage Shards</div>
            </div>

            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational Overhead</span>
               <div className="text-lg font-black text-slate-800 tabular-nums">${financialData.opsCost}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase">Admin & Support Slices</div>
            </div>

            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg Yield / Patient</span>
               <div className="text-lg font-black text-indigo-600 tabular-nums">$14.20</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fiscal Performance</div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <button className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left group hover:bg-slate-900 transition-all">
               <div className="flex justify-between items-center mb-4">
                  <Zap size={20} className="text-amber-500" />
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-white" />
               </div>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Infrastructure Load</p>
               <h4 className="text-sm font-black text-slate-900 group-hover:text-white uppercase transition-colors">Audit Node Compute Utilization</h4>
            </button>

            <button className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left group hover:bg-slate-900 transition-all">
               <div className="flex justify-between items-center mb-4">
                  <Activity size={20} className="text-indigo-500" />
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-white" />
               </div>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Fiscal Records</p>
               <h4 className="text-sm font-black text-slate-900 group-hover:text-white uppercase transition-colors">Download Detailed Expenditure Log</h4>
            </button>
         </div>
      </div>
    </article>
  );
}
