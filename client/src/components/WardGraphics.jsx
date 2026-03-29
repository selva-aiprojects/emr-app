import React from 'react';
import { Bed, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Premium SVG-based Ward Graphical View
 * Renders a logical floor plan of beds within a ward.
 */
export default function WardGraphics({ beds, onBedClick }) {
  if (!beds || beds.length === 0) return null;

  // Group beds by rows (e.g., 6 beds per row for a bay)
  const bedsPerRow = 4;
  const rows = [];
  for (let i = 0; i < beds.length; i += bedsPerRow) {
    rows.push(beds.slice(i, i + bedsPerRow));
  }

  return (
    <div className="ward-graphics-container p-10 bg-slate-50/50 rounded-[40px] border-2 border-slate-100/50 overflow-hidden relative">
      {/* Structural Elements (Walls/Doors) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-slate-200 rounded-b-xl flex items-center justify-center">
         <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Main Entry</span>
      </div>

      <div className="grid gap-12">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-12">
            {row.map((bed) => (
              <BedNode 
                key={bed.id} 
                bed={bed} 
                onClick={() => onBedClick?.(bed)} 
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-16 pt-8 border-t border-slate-200/50 flex justify-center gap-8">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Occupied</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(fb,bf,24,0.3)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cleaning</span>
         </div>
      </div>
    </div>
  );
}

function BedNode({ bed, onClick }) {
  const isOccupied = bed.status === 'Occupied';
  const isCleaning = bed.status === 'Cleaning';
  const isMaintenance = bed.status === 'Maintenance';

  let statusColor = 'text-emerald-500';
  let bgColor = 'bg-white';
  let borderColor = 'border-slate-100';
  let shadowColor = 'shadow-slate-200/50';

  if (isOccupied) {
    statusColor = 'text-rose-500';
    bgColor = 'bg-rose-50/30';
    borderColor = 'border-rose-100';
    shadowColor = 'shadow-rose-100/30';
  } else if (isCleaning) {
    statusColor = 'text-amber-500';
    bgColor = 'bg-amber-50/30';
    borderColor = 'border-amber-100';
    shadowColor = 'shadow-amber-100/30';
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative w-40 h-52 p-4 rounded-[32px] border-2 transition-all duration-500 group
        ${bgColor} ${borderColor} ${shadowColor} shadow-2xl hover:-translate-y-2 hover:scale-[1.02]
        flex flex-col items-center justify-between
      `}
    >
      {/* Bed Headboard */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-b-full bg-current opacity-10 ${statusColor}`}></div>

      <div className="w-full flex justify-between items-start">
         <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-50 transition-colors group-hover:border-current/20 ${statusColor}`}>
            <Bed size={16} />
         </div>
         <div className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border bg-white ${statusColor} ${borderColor}`}>
            {bed.bed_number}
         </div>
      </div>

      <div className="flex flex-col items-center gap-2">
         {isOccupied ? (
           <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 animate-pulse">
              <User size={24} />
           </div>
         ) : isCleaning ? (
           <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock size={24} className="animate-spin-slow" />
           </div>
         ) : (
           <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
           </div>
         )}
         <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transform transition-all group-hover:translate-y-1 ${statusColor}`}>
           {bed.status || 'Available'}
         </span>
      </div>

      <div className="w-full h-2 bg-slate-100/50 rounded-full overflow-hidden mt-4">
          <div 
            className={`h-full transition-all duration-1000 ${isOccupied ? 'w-full bg-rose-500' : isCleaning ? 'w-1/2 bg-amber-400' : 'w-0'}`}
          ></div>
      </div>
      
      {/* Patient Meta (if occupied) */}
      {isOccupied && (
        <div className="absolute -bottom-2 translate-y-full w-full left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
           <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-white/10 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Admitted Subject</div>
              <div className="text-xs font-bold truncate">Patient Record Linked</div>
           </div>
        </div>
      )}
    </button>
  );
}
