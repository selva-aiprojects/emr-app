// Enhanced Bed Card Component with Better Visual Clarity
// This file contains the enhanced bed card section with improved coloring

import React from 'react';
import { Bed, UserCircle } from 'lucide-react';

export default function EnhancedBedCards({ currentBeds, selectedWard }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {currentBeds.map(bed => {
        const isOccupied = bed.status === 'occupied';
        
        return (
          <article key={bed.id} className={`p-6 rounded-3xl border-2 transition-all duration-300 group relative overflow-hidden ${
            isOccupied 
              ? 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-red-300 shadow-red-200/50 hover:shadow-red-300/70 hover:scale-[1.02]' 
              : 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-300 shadow-emerald-200/50 hover:shadow-emerald-300/70 hover:scale-[1.02]'
          }`}>
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
              isOccupied 
                ? 'bg-rose-500' 
                : 'bg-emerald-500'
            }`} />

            {/* Bed Icon and Number */}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl transition-all duration-300 ${
                isOccupied 
                  ? 'bg-red-100 text-red-600 shadow-red-200/50' 
                  : 'bg-emerald-100 text-emerald-600 shadow-emerald-200/50'
              }`}>
                <Bed size={24} className="transition-colors duration-300" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{bed.bed_number}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{selectedWard?.name || 'Unknown Ward'}</div>
              </div>
            </div>

            {/* Bed Status Details */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between p-2 bg-black/5 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-500">Status</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                  isOccupied 
                    ? 'text-rose-700 bg-rose-100' 
                    : 'text-emerald-700 bg-emerald-100'
                }`}>
                  {isOccupied ? 'Occupied' : 'Ready'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-black/5 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-500">Assignment</span>
                <div className="flex items-center gap-2">
                  <UserCircle size={14} className={isOccupied ? 'text-rose-500' : 'text-emerald-500'} />
                  <span className="text-[11px] font-bold text-slate-600">
                    {isOccupied ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hover Effect Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
            
            {/* Corner Indicator */}
            <div className={`absolute top-2 left-2 w-3 h-3 rounded-full transition-all duration-300 ${
              isOccupied 
                ? 'bg-red-500 shadow-red-500/50 animate-pulse' 
                : 'bg-emerald-500 shadow-emerald-500/50'
            }`} />
          </article>
        );
      })}
    </div>
  );
}

// Enhanced Statistics Cards Component
export function EnhancedStatisticsCards({ selectedWard, currentBeds }) {
  const occupiedBeds = currentBeds.filter(b => b.status === 'occupied').length;
  const availableBeds = currentBeds.filter(b => b.status !== 'occupied').length;
  const totalBeds = currentBeds.length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Ward Occupancy Card */}
      <article className="clinical-card bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white border-none p-8 flex items-center justify-between relative overflow-hidden group">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff10%22%20fill-opacity%3D%220.1%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%2230%22/%3E%3Crect%20x%3D%2230%22%20y%3D%2230%22%20width%3D%2230%22%20height%3D%2230%22/%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 animate-pulse">
              <Bed size={24} />
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Ward Occupancy</h5>
              <p className="text-xs text-slate-400 font-medium">Real-time bed utilization</p>
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-1">{occupiedBeds}</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Occupied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-300">/</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-1">{totalBeds}</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Beds</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-600/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Occupancy Rate</span>
              <span className="text-2xl font-bold text-white">{occupancyRate}%</span>
            </div>
          </div>
        </div>
      </article>

      {/* Available Capacity Card */}
      <article className="clinical-card bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-300 shadow-emerald-200/50 p-8 flex items-center justify-between relative overflow-hidden group">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%2310b9810%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%2225%22/%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%2220%22%20fill%3D%22%2310b9815%22%20fill-opacity%3D%220.2%22/%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%2215%22%20fill%3D%22%2310b9820%22%20fill-opacity%3D%220.3%22/%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
              <Bed size={24} />
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">Beds Ready</h5>
              <p className="text-xs text-emerald-600 font-medium">Ready for admission</p>
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="text-center">
              <div className="text-5xl font-black text-emerald-700 mb-1">{availableBeds}</div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">FREE BEDS</div>
            </div>
            <div className="flex-1 flex items-end justify-end">
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-700">{Math.round((availableBeds / (totalBeds || 1)) * 100)}%</div>
                <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Free Percentage</div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Operational Status Card */}
      <article className="clinical-card bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-300 shadow-amber-200/50 p-8 overflow-hidden relative group">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23f59e0b10%22%20fill-opacity%3D%220.1%22%3E%3Cpolygon%20points%3D%2230%2C10%2050%2C50%2010%2C50%22/%3E%3Cpolygon%20points%3D%2230%2C20%2045%2C45%2015%2C45%22/%3E%3Cpolygon%20points%3D%2230%2C30%2040%2C40%2020%2C40%22/%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
              <Bed size={24} />
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Operational Status</h5>
              <p className="text-xs text-amber-600 font-medium">System performance</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-xl">
              <span className="text-sm font-medium text-amber-800">System Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-amber-700">Operational</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-xl">
              <span className="text-sm font-medium text-amber-800">Last Update</span>
              <span className="text-sm font-bold text-amber-700">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
