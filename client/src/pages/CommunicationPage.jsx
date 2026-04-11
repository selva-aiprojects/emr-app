import { useMemo, useState } from 'react';
import { Megaphone, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';

const PRIORITY_STYLE = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-rose-100 text-rose-700'
};

const PRIORITY_ICON = {
  low: Info,
  normal: Info,
  high: AlertTriangle,
  critical: ShieldAlert
};

const canManageNotices = (role) => ['Admin', 'Management', 'HR'].includes(role);

export default function CommunicationPage({ activeUser, notices = [], onCreateNotice, onSetNoticeStatus }) {
  const [showComposer, setShowComposer] = useState(false);
  const [statusFilter, setStatusFilter] = useState('published');

  const filteredNotices = useMemo(() => {
    if (statusFilter === 'all') return notices;
    return notices.filter((item) => item.status === statusFilter);
  }, [statusFilter, notices]);

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Communication Center
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Operational Node</span>
           </h1>
           <p className="dim-label">Notices, operational alerts and audience-targeted internal communication.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" /> Administrative Integrity Validated • Real-time Broadcast Active
           </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {canManageNotices(activeUser?.role) && (
            <button
              type="button"
              onClick={() => setShowComposer((v) => !v)}
              className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              {showComposer ? 'Close Composer' : 'New Notice Shard'}
            </button>
          )}
          
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
            {['published', 'draft', 'archived', 'all'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xl'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {showComposer && canManageNotices(activeUser?.role) && (
        <article className="premium-panel">
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Title</label>
              <input name="title" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Priority</label>
              <select name="priority" defaultValue="normal" className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Message</label>
              <textarea name="body" rows="4" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start DateTime</label>
              <input name="startsAt" type="datetime-local" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">End DateTime</label>
              <input name="endsAt" type="datetime-local" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Audience Roles (comma separated)</label>
              <input name="audienceRoles" placeholder="Doctor,Nurse,Lab,Pharmacy" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Publish State</label>
              <select name="status" defaultValue="published" className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="rounded-lg bg-indigo-600 text-white px-5 py-2 text-sm font-bold hover:bg-indigo-700 transition">
                Save Notice
              </button>
            </div>
          </form>
        </article>
      )}

      <article className="premium-panel p-0 overflow-hidden">
        {filteredNotices.length === 0 ? (
          <EmptyState
            title="No notices found"
            subtitle="No communication item is available for the current filter and role context."
            icon={Megaphone}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotices.map((notice) => {
              const PriorityIcon = PRIORITY_ICON[notice.priority] || Info;
              return (
                <div key={notice.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <PriorityIcon className="w-4 h-4 text-slate-500" />
                      <h3 className="font-bold text-slate-900">{notice.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${PRIORITY_STYLE[notice.priority] || PRIORITY_STYLE.normal}`}>
                        {notice.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-600">
                        {notice.status}
                      </span>
                    </div>
                    {canManageNotices(activeUser?.role) && notice.status !== 'archived' && (
                      <button
                        type="button"
                        className="text-xs font-bold text-rose-600 hover:text-rose-700"
                        onClick={async () => {
                          await onSetNoticeStatus(notice.id, 'archived');
                        }}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{notice.body}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(notice.starts_at || notice.startsAt || notice.created_at).toLocaleString('en-IN')} by {notice.created_by_name || 'System'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}
