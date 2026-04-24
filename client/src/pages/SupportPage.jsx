import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import { EmptyState } from '../components/ui/index.jsx';
import { Wrench, ShieldCheck, Activity, Plus } from 'lucide-react';

const TICKET_TYPES = ['Maintenance', 'Cleaning', 'Equipment Repair', 'IT Support', 'Security', 'Housekeeping', 'Other'];
const STATUS_STYLES = {
    open: 'bg-amber-50 text-amber-700 border-amber-100',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-100',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export default function SupportPage({ tenant, activeUser }) {
  const { showToast } = useToast();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('open');

    useEffect(() => {
        loadTickets();
    }, [filter, tenant]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const stored = await api.getSupportTickets(tenant.id);
            const filtered = filter === 'all' ? stored : stored.filter(t => t.status === filter);
            setTickets(filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)));
        } catch (err) {
            console.error('Failed to load tickets:', err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData(e.target);
        
        try {
            await api.addSupportTicket({
                tenantId: tenant.id,
                type: fd.get('type'),
                location: fd.get('location'),
                description: fd.get('description'),
                priority: fd.get('priority')
            });
            setShowForm(false);
            e.target.reset();
            loadTickets();
            showToast({ message: 'Support ticket raised!', type: 'success', title: 'Support' });
        } catch (err) {
            showToast({ title: 'Support Error', message: err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.updateSupportStatus(id, newStatus);
            loadTickets();
            showToast({ message: 'Ticket status updated.', type: 'success', title: 'Support' });
        } catch (err) {
            showToast({ title: 'Status Update Failed', message: err.message, type: 'error' });
        }
    };


    return (
        <div className="page-shell-premium animate-fade-in">
            <header className="page-header-premium mb-10">
                <div>
                    <h1 className="page-title-rich flex items-center gap-3 text-white">
                        Facility Operations & Support
                        <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Ops Hub</span>
                    </h1>
                    <p className="dim-label">Maintenance, housekeeping and support ticket management.</p>
                    <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Operational Integrity Validated • Field Personnel Synced
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Wrench className="w-4 h-4" />
                        Raise Ticket Shard
                    </button>
                    
                    <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
                        {['open', 'in-progress', 'resolved', 'all'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === tab
                                        ? 'bg-white text-slate-900 shadow-xl'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {tab === 'all' ? 'All' : tab.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                ].map(s => (
                    <article key={s.label} className={`glass-panel p-8 flex items-center justify-between border-l-4 ${s.border.replace('border-', 'border-l-')}`}>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label} Tickets</p>
                           <p className={`text-2xl font-black ${s.color} tabular-nums leading-none`}>{s.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center`}>
                           <Activity className="w-6 h-6" />
                        </div>
                    </article>
                ))}
            </div>

            {/* Create Ticket Modal */}
            {showForm && (
                <article className="premium-panel mb-10 border-2 border-indigo-100/50 overflow-hidden animate-slide-in">
                    <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                        <div>
                           <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Provision Support Shard</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Operational Maintenance Entry</p>
                        </div>
                        <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                           <Activity className="w-5 h-5" />
                        </button>
                    </header>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Operational Type</label>
                               <select name="type" required className="input-field">
                                   {TICKET_TYPES.map(t => <option key={t}>{t}</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority Level</label>
                               <select name="priority" required className="input-field">
                                   <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                               </select>
                           </div>
                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Institutional Location</label>
                               <input name="location" required placeholder="e.g. ICU Ward 3, Pharmacy Store..." className="input-field" />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issue Forensic Description</label>
                               <textarea name="description" required rows="6" placeholder="Detail the operational anomaly..." className="input-field p-6"></textarea>
                           </div>
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end gap-6 items-center pt-8 border-t border-slate-50">
                            <button type="button" onClick={() => setShowForm(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 transition-colors">Abort Provision</button>
                            <button disabled={submitting} className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all">
                                {submitting ? 'Persisting...' : 'Commit Ticket'}
                            </button>
                        </div>
                    </form>
                </article>
            )}

            {/* Ticket List */}
            <article className="premium-panel p-0 overflow-hidden shadow-premium bg-white border-none">
                {loading ? (
                    <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-4">
                       <Activity className="w-10 h-10 animate-spin" />
                       <p className="text-xs font-black uppercase tracking-widest">Hydrating operations queue...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <EmptyState 
                      title={`No ${filter !== 'all' ? filter : ''} record shards`}
                      subtitle="The operational support queue is currently clear for this sector."
                      icon={Wrench}
                    />
                ) : (
                    <div className="divide-y divide-slate-50">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="p-6 hover:bg-slate-50/50 transition-colors flex justify-between items-start group">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">{ticket.id}</span>
                                        <h3 className="text-sm font-black text-slate-900 group-hover:translate-x-1 transition-transform uppercase tracking-tight">{ticket.type}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${STATUS_STYLES[ticket.status] || ''}`}>
                                            {ticket.status.replace('-', ' ')}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${ticket.priority === 'Urgent' ? 'bg-rose-50 text-rose-600' : ticket.priority === 'High' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 mb-2 leading-relaxed">{ticket.description}</p>
                                    <div className="text-[10px] font-black text-slate-400 flex items-center gap-4 uppercase tracking-[0.1em]">
                                        <span className="flex items-center gap-1.5"><Activity size={12} className="text-blue-500" /> {ticket.location}</span>
                                        <span>BY {ticket.creator_name || ticket.createdBy || 'STAFF'}</span>
                                        <span>INITIATED {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 ml-10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {ticket.status === 'open' && (
                                        <button onClick={() => updateStatus(ticket.id, 'in-progress')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">Start Shard</button>
                                    )}
                                    {ticket.status === 'in-progress' && (
                                        <button onClick={() => updateStatus(ticket.id, 'resolved')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all">Resolve Shard</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </article>

            <footer className="mt-10 p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-center gap-10">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                   <ShieldCheck className="w-4 h-4" /> PERSISTENCE LOG OPERATIONAL
                </div>
                <div className="w-[1px] h-4 bg-slate-200"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Support tickets are synchronized with the enterprise maintenance shard.
                </p>
            </footer>
        </div>
    );
}
