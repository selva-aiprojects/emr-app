// Enhanced Bed Card Component with Better Visual Clarity
// This file contains the enhanced bed card section with improved coloring

import React from 'react';
import { Bed, UserCircle, Activity, ShieldCheck, AlertCircle } from 'lucide-react';

export default function EnhancedBedCards({ currentBeds, selectedWard }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {currentBeds.map(bed => {
        const isOccupied = bed.status === 'occupied';
        const isMaintenance = bed.status === 'maintenance';
        
        return (
          <article key={bed.id} className={`group relative p-5 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
            isOccupied 
              ? 'bg-rose-50/30 border-rose-100 shadow-rose-100/20' 
              : isMaintenance
                ? 'bg-amber-50/30 border-amber-100'
                : 'bg-emerald-50/30 border-emerald-100 shadow-emerald-100/20'
          }`}>
            {/* Top Status Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all ${
              isOccupied ? 'bg-rose-500' : isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />

            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isOccupied ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-slate-400 shadow-sm border border-slate-100'
              }`}>
                <Bed size={22} className={isOccupied ? 'animate-pulse' : ''} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Node</span>
                <span className="text-lg font-black text-slate-900 leading-none">{bed.bed_number}</span>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shard Status</span>
                  <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    isOccupied ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    {bed.status}
                  </span>
               </div>

               <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/80 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                     {isOccupied ? <Activity size={12} className="text-rose-500" /> : <ShieldCheck size={12} className="text-emerald-500" />}
                     <span className="text-[10px] font-bold text-slate-600">{isOccupied ? 'Active Case' : 'Ready'}</span>
                  </div>
                  <UserCircle size={14} className={isOccupied ? 'text-rose-400' : 'text-slate-200'} />
               </div>
            </div>

            {/* Micro-Interaction Overlay */}
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all pointer-events-none" />
          </article>
        );
      })}
    </div>
  );
}

export function EnhancedStatisticsCards({ selectedWard, currentBeds }) {
  const occupiedBeds = currentBeds.filter(b => b.status === 'occupied').length;
  const availableBeds = currentBeds.filter(b => b.status !== 'occupied').length;
  const totalBeds = currentBeds.length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="glass-panel p-8 flex items-center gap-6 border-l-4 border-l-rose-500">
         <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Activity className="w-7 h-7" />
         </div>
         <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupancy Density</p>
            <div className="flex items-end gap-2">
               <h4 className="text-3xl font-black text-slate-900">{occupancyRate}%</h4>
               <span className="text-xs font-bold text-slate-400 mb-1">/ System Load</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-rose-500 rounded-full" style={{ width: `${occupancyRate}%` }} />
            </div>
         </div>
      </div>

      <div className="glass-panel p-8 flex items-center gap-6 border-l-4 border-l-emerald-500">
         <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
         </div>
         <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Ready Shards</p>
            <div className="flex items-end gap-2">
               <h4 className="text-3xl font-black text-slate-900">{availableBeds}</h4>
               <span className="text-xs font-bold text-slate-400 mb-1">Beds Free</span>
            </div>
         </div>
      </div>

      <div className="glass-panel p-8 bg-slate-900 text-white flex items-center gap-6">
         <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7" />
         </div>
         <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Capacity</p>
            <h4 className="text-3xl font-black text-white">{totalBeds}</h4>
            <p className="text-[10px] font-black text-emerald-400 uppercase mt-1 tracking-widest">All Shards Active</p>
         </div>
      </div>
    </div>
  );
}
