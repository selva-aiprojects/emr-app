import { useState, useEffect } from 'react';
import { api } from '../api.js';

const TICKET_TYPES = ['Maintenance', 'Cleaning', 'Equipment Repair', 'IT Support', 'Security', 'Housekeeping', 'Other'];
const STATUS_STYLES = {
    open: 'bg-amber-100 text-amber-700 border-amber-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function SupportPage({ tenant, activeUser }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('open');

    // Since there's no backend for support tickets yet, we'll store in localStorage
    // and note that a dedicated `support_tickets` table should be added.
    const storageKey = `support_tickets_${tenant?.id || 'default'}`;

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
        } catch (err) {
            alert('Failed to create ticket: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.updateSupportStatus(id, newStatus);
            loadTickets();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const all = JSON.parse(localStorage.getItem(storageKey) || '[]');

    return (
        <section>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Facility Operations</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Maintenance, housekeeping and support ticket management</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition"
                >
                    + Raise Ticket
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                ].map(s => (
                    <article key={s.label} className={`premium-panel ${s.bg} border ${s.border}`}>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase mt-1">{s.label} Tickets</div>
                    </article>
                ))}
            </div>

            {/* Create Ticket Modal */}
            {showForm && (
                <article className="premium-panel mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">New Support Ticket</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
                    </div>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Type</label>
                            <select name="type" required className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                                {TICKET_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Priority</label>
                            <select name="priority" required className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Location / Ward</label>
                            <input name="location" required placeholder="e.g. ICU Ward 3, Pharmacy Store..." className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label>
                            <textarea name="description" required rows="3" placeholder="Detail the issue..." className="w-full p-2 border border-slate-200 rounded-lg text-sm"></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow">
                                {submitting ? 'Creating...' : 'Create Ticket'}
                            </button>
                        </div>
                    </form>
                </article>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {['open', 'in-progress', 'resolved', 'all'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${filter === tab ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {tab === 'all' ? 'All' : tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Ticket List */}
            <article className="premium-panel p-0 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400"><p>Loading tickets...</p></div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="text-4xl mb-4 opacity-20">🔧</div>
                        <p className="font-medium">No {filter !== 'all' ? filter : ''} tickets</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-bold text-slate-500">{ticket.id}</span>
                                        <span className="font-bold text-slate-800">{ticket.type}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${STATUS_STYLES[ticket.status] || ''}`}>
                                            {ticket.status.replace('-', ' ')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-700' : ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-1">{ticket.description}</p>
                                    <div className="text-xs text-slate-400">
                                        📍 {ticket.location} • By {ticket.creator_name || ticket.createdBy || 'Staff'} • {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                    {ticket.status === 'open' && (
                                        <button onClick={() => updateStatus(ticket.id, 'in-progress')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Start</button>
                                    )}
                                    {ticket.status === 'in-progress' && (
                                        <button onClick={() => updateStatus(ticket.id, 'resolved')} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition">Resolve</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </article>

            <p className="text-xs text-slate-400 text-center mt-4 font-medium">
                💡 Support tickets are now persisted in the Enterprise Database.
            </p>
        </section>
    );
}
