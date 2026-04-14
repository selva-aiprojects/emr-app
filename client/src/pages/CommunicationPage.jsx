import { useMemo, useState } from 'react';
import { Megaphone, AlertTriangle, Info, ShieldAlert, Plus, History, Clock, Hash, Filter, ChevronRight, Send } from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';

const PRIORITY_STYLE = {
  low: 'bg-slate-50 text-slate-500 border-slate-100',
  normal: 'bg-sky-50 text-sky-600 border-sky-100',
  high: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-rose-50 text-rose-600 border-rose-100'
};

const PRIORITY_ICON = {
  low: Info,
  normal: Info,
  high: AlertTriangle,
  critical: ShieldAlert
};

const canManageNotices = (role) => ['Admin', 'Management', 'HR', 'Superadmin'].includes(role);

export default function CommunicationPage({ activeUser, notices = [], onCreateNotice, onSetNoticeStatus }) {
  const [showComposer, setShowComposer] = useState(false);
  const [statusFilter, setStatusFilter] = useState('published');

  const filteredNotices = useMemo(() => {
    if (statusFilter === 'all') return notices;
    return notices.filter((item) => item.status === statusFilter);
  }, [statusFilter, notices]);

  return (
    <div className="page-shell-premium animate-in fade-in duration-500 pb-20">
      {/* 🚀 ELITE HEADER SYSTEM */}
      <header className="page-header-premium mb-8">
        <div className="flex flex-col gap-2">
           <h1 className="page-title-rich flex items-center gap-4 text-white">
              <Megaphone className="w-8 h-8 text-cyan-400" />
              Communication Center
              <span className="text-[10px] bg-white/10 text-white/80 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-[0.2em] font-black backdrop-blur-xl">Institutional HUD</span>
           </h1>
           <p className="dim-label max-w-2xl">Orchestrate cross-institutional directives, operational alerts, and high-fidelity internal broadcasts.</p>
           <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                 <ShieldAlert className="w-3 h-3 text-cyan-300" />
                 <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Administrative Grid Validated</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Broadcast Core Live</span>
              </div>
           </div>
        </div>
        
        <div className="flex flex-col items-end gap-6 self-end">
           <div className="bg-white/5 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-2xl flex gap-1">
              {['published', 'draft', 'archived', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xl scale-105'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
           </div>

           {canManageNotices(activeUser?.role) && (
             <button
               onClick={() => setShowComposer(!showComposer)}
               className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl border ${
                 showComposer 
                  ? 'bg-rose-500 border-rose-400 text-white hover:bg-rose-600' 
                  : 'bg-white border-white text-slate-900 hover:bg-slate-50'
               }`}
             >
               {showComposer ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />}
               {showComposer ? 'Deactivate Composer' : 'Initialize Directive'}
             </button>
           )}
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto">
        {/* ✍️ DIRECTIVE COMPOSER */}
        {showComposer && canManageNotices(activeUser?.role) && (
          <article className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden mb-12 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center justify-between">
               <div>
                  <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                     <History className="w-4 h-4 text-indigo-600" />
                     Directive Composition Protocol
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Shard Communication Deployment</p>
               </div>
            </div>
            
            <form
              className="p-10 grid grid-cols-1 md:grid-cols-12 gap-8"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                await onCreateNotice({
                  title: fd.get('title'),
                  body: fd.get('body'),
                  priority: fd.get('priority'),
                  startsAt: fd.get('startsAt'),
                  endsAt: fd.get('endsAt') || null,
                  status: fd.get('status'),
                  audienceRoles: (fd.get('audienceRoles') || '')
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean)
                });
                e.target.reset();
                setShowComposer(false);
              }}
            >
              <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Subject Header</label>
                  <input name="title" required placeholder="URGENT: Operational Directive..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[13px] font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all uppercase tracking-tight" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Directive Content Body</label>
                  <textarea name="body" rows="6" required placeholder="Enter formal discourse/instruction here..." className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-[14px] font-medium text-slate-700 leading-relaxed placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                </div>
              </div>

              <div className="md:col-span-4 space-y-6">
                <div className="bg-slate-50/50 border border-slate-200 rounded-[2rem] p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority Tier</label>
                      <select name="priority" defaultValue="normal" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-black text-slate-700 focus:outline-none appearance-none cursor-pointer uppercase tracking-widest">
                        <option value="low">Standard / Low</option>
                        <option value="normal">Operational Node</option>
                        <option value="high">Critical Escalation</option>
                        <option value="critical">Systemic Shutdown</option>
                      </select>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Window: Start</label>
                        <input name="startsAt" type="datetime-local" required className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-black text-slate-700 focus:outline-none tabular-nums" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Window: Expiry</label>
                        <input name="endsAt" type="datetime-local" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-black text-slate-700 focus:outline-none tabular-nums" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Identity Scope</label>
                      <input name="audienceRoles" placeholder="Doctor, Nurse, Admin..." className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-black text-slate-700 focus:outline-none placeholder:text-slate-300 uppercase tracking-widest" />
                   </div>

                   <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group">
                     <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                     Broadcast Directive
                   </button>
                </div>
              </div>
            </form>
          </article>
        )}

        {/* 📬 DIRECTIVE FEED */}
        <div className="grid grid-cols-1 gap-6">
          {filteredNotices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-24 text-center shadow-sm">
                <EmptyState
                  title="No Directive Shards Detected"
                  subtitle="The communication grid is currently operating without any active directives in this filter scope."
                  icon={Hash}
                />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredNotices.map((notice) => {
                const PriorityIcon = PRIORITY_ICON[notice.priority] || Info;
                const statusColor = notice.status === 'published' ? 'text-emerald-600' : 'text-slate-400';
                
                return (
                  <div key={notice.id} className="group bg-white border border-slate-200 p-10 rounded-[2.5rem] transition-all hover:border-indigo-200 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Megaphone size={80} strokeWidth={1} />
                    </div>

                    <div>
                      <div className="flex justify-between items-start mb-6">
                         <div className={`p-3 rounded-2xl border ${PRIORITY_STYLE[notice.priority] || PRIORITY_STYLE.normal}`}>
                            <PriorityIcon size={18} />
                         </div>
                         <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${statusColor}`}>
                               • {notice.status}
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                               Shard #{notice.id?.slice(0, 6)}
                            </span>
                         </div>
                      </div>

                      <h3 className="text-[17px] font-black text-slate-900 tracking-tighter uppercase mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
                        {notice.title}
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {notice.body}
                      </p>
                    </div>

                    <div className="mt-10 flex items-center justify-between pt-8 border-t border-slate-100">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-black uppercase border border-white group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                             {(notice.created_by_name || 'Sys')?.slice(0, 2)}
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized By</p>
                             <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{notice.created_by_name || 'System Registry'}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                <Clock size={10} /> Live Since
                             </p>
                             <p className="text-[11px] font-black text-slate-700 tabular-nums">
                                {new Date(notice.starts_at || notice.startsAt || notice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                             </p>
                          </div>
                          
                          {canManageNotices(activeUser?.role) && notice.status !== 'archived' && (
                            <button
                              onClick={async () => {
                                await onSetNoticeStatus(notice.id, 'archived');
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-transparent transition-all group/archive shadow-sm"
                              title="Archive Directive"
                            >
                               <History size={16} className="group-hover/archive:rotate-12 transition-transform" />
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function X({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
