import React from 'react';

export default function InfraUsage({ cpu = 0, memory = 0, disk = 0, network = 0, bedsAvailable = 0, ambulancesAvailable = 0, insuranceCapacity = 0, status = 'unknown' }) {
  return (
    <article className="clinical-card">
      <div className="p-6 border-b border-slate-50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Node Status</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Cloud Infrastructure Health</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">Compute Load</span>
            <span className={cpu > 80 ? 'text-rose-600' : 'text-emerald-600'}>{cpu}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${cpu > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${cpu}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">Memory Allocation</span>
            <span className="text-indigo-600">{memory}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000" 
              style={{ width: `${memory}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">Storage IOPS</span>
            <span className="text-slate-700">{disk}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-400 transition-all duration-1000" 
              style={{ width: `${disk}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Network</div>
            <div className="text-sm font-bold text-slate-900">{network} Gbps</div>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="text-[9px] font-black text-emerald-600 uppercase mb-1">Platform State</div>
            <div className="text-sm font-bold text-emerald-700 capitalize">{status}</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Beds Free</div>
            <div className="text-sm font-bold text-slate-900">{bedsAvailable}</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Ambulances Ready</div>
            <div className="text-sm font-bold text-slate-900">{ambulancesAvailable}</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100 col-span-2">
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Insurance Capacity</div>
            <div className="text-sm font-bold text-slate-900">{insuranceCapacity}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
