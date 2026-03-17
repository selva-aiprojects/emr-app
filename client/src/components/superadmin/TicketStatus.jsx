import React from 'react';
import { EmptyState } from '../ui/index.jsx';
import { ShieldCheck } from 'lucide-react';

export default function TicketStatus({ tickets, onResolveTicket }) {
  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
  
  return (
    <article className="clinical-card mb-8">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
         <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Support Tickets</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Tenant Operations & Escalations</p>
         </div>
      </div>
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-4">
        <div className="flex-1">
          <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Open Tickets</div>
          <div className="text-2xl font-black text-indigo-700">{openTickets.length}</div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Total</div>
          <div className="text-2xl font-black text-slate-700">{tickets.length}</div>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {openTickets.length === 0 ? (
          <EmptyState 
            title="All queues are clear" 
            subtitle="No priority tenant support requests are currently awaiting platform-level intervention."
            icon={ShieldCheck}
          />
        ) : openTickets.map(t => (
          <div key={t.id} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                 <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg font-black uppercase tracking-tighter mr-2">{t.tenant_name || 'System'}</span>
                 <span className="text-xs font-bold text-slate-800">{t.type}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-tighter ${t.priority === 'urgent' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{t.priority}</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2 font-medium">{t.description}</p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100/50">
               <div className="text-[10px] text-slate-400 font-medium">#{t.id.split('-')[0]} • {new Date(t.created_at).toLocaleDateString()}</div>
               <button 
                 onClick={() => onResolveTicket && onResolveTicket(t.id)}
                 className="text-[10px] bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1 rounded shadow-sm font-black uppercase tracking-tighter transition-all"
               >
                 Resolve
               </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
