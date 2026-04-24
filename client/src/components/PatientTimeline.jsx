import React from 'react';
import { 
  Activity, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  TrendingDown,
  Calendar
} from 'lucide-react';

/**
 * Aesthetic Longitudinal Patient Journey Timeline
 * Visualizes encounters, lab results, and therapeutic interventions.
 */
export default function PatientTimeline({ encounters = [], patient = {} }) {
  if (!encounters || encounters.length === 0) {
    return (
      <div className="p-20 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50">
         <Calendar size={60} className="mx-auto mb-6 text-slate-300" />
         <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-loose">No Longitudinal Shards Detected</p>
         <p className="text-[10px] font-bold text-slate-400 italic mt-2">Initialize clinical assessment to start the journey ledger.</p>
      </div>
    );
  }

  // Group by month/year for a clustered timeline
  const grouped = encounters.reduce((acc, enc) => {
    const d = new Date(enc.createdAt || enc.created_at);
    const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(enc);
    return acc;
  }, {});

  return (
    <div className="patient-timeline-wrapper relative">
      {/* Decorative center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-indigo-200 to-slate-200 -translate-x-1/2 rounded-full hidden lg:block opacity-30"></div>

      <div className="space-y-20 relative z-10">
        {Object.entries(grouped).map(([month, events], idx) => (
          <div key={month} className="month-group animate-slide-in" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="flex justify-center mb-12">
               <span className="px-8 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10">
                 {month}
               </span>
            </div>

            <div className="space-y-12">
              {events.map((event, eIdx) => (
                <TimelineEvent 
                  key={event.id} 
                  event={event} 
                  side={eIdx % 2 === 0 ? 'left' : 'right'} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineEvent({ event, side }) {
  const isEmergency = event.type === 'Emergency' || event.encounter_type === 'Emergency';
  const hasMeds = (event.medications && event.medications.length > 0);
  const date = new Date(event.createdAt || event.created_at);

  const cardAlign = side === 'left' ? 'lg:flex-row-reverse text-right lg:pr-16' : 'lg:flex-row text-left lg:pl-16';
  const dotAlign = side === 'left' ? 'lg:right-0 lg:translate-x-1/2' : 'lg:left-0 lg:-translate-x-1/2';

  return (
    <div className={`flex flex-col lg:flex-row items-center justify-center relative ${cardAlign} gap-8 group`}>
      {/* Timeline Dot */}
      <div className={`absolute top-0 w-10 h-10 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-125 z-20 ${dotAlign} hidden lg:flex`}>
         {isEmergency ? (
           <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
         ) : (
           <Stethoscope className="w-5 h-5 text-indigo-500" />
         )}
      </div>

      {/* Date Sticker */}
      <div className={`flex flex-col gap-1 min-w-[80px] ${side === 'left' ? 'lg:text-left' : 'lg:text-right'}`}>
         <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
         <div className="text-sm font-black text-slate-900 tabular-nums">{date.getDate()} {date.toLocaleString('default', { month: 'short' })}</div>
      </div>

      {/* Content Card */}
      <article className={`
        clinical-card max-w-xl flex-1 p-8 bg-white border-2 border-slate-50 shadow-premium transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100/50 relative overflow-hidden
        ${isEmergency ? 'border-rose-100 bg-rose-50/10' : ''}
      `}>
          {isEmergency && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-[40px] flex items-center justify-center text-rose-500">
               <Activity size={24} />
            </div>
          )}

          <div className="flex flex-col gap-4">
             <div>
                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-3 inline-block ${isEmergency ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                   {event.type || event.encounter_type || 'Consultation'}
                </span>
                <h4 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {event.diagnosis || 'Clinical Assessment'}
                </h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed italic line-clamp-2">
                  {event.notes || 'No institutional narrative was recorded for this session.'}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <TrendingDown size={14} />
                   </div>
                   <div>
                      <div className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">Vitals (BP/HR)</div>
                      <div className="text-xs font-black text-slate-900 tracking-tighter tabular-nums">{event.bp || '--'}/{event.hr || '--'}</div>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Pill size={14} />
                   </div>
                   <div>
                      <div className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">Therapeutics</div>
                      <div className="text-xs font-black text-slate-900 tracking-tighter">{hasMeds ? `${event.medications.length} Prescribed` : 'None'}</div>
                   </div>
                </div>
             </div>
             
             {hasMeds && (
               <div className="mt-2 space-y-1">
                 {event.medications.slice(0, 2).map((m, mIdx) => (
                   <div key={mIdx} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50 flex justify-between">
                     <span>{m.name}</span>
                     <span className="opacity-50 tracking-tighter">{m.dosage}</span>
                   </div>
                 ))}
                 {event.medications.length > 2 && (
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center mt-2">+ {event.medications.length - 2} more interventions</div>
                 )}
               </div>
             )}
          </div>
      </article>
    </div>
  );
}
