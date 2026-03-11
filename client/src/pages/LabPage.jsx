import { useState, useEffect } from 'react';
import { api } from '../api.js';

const COMMON_TESTS = [
    { code: 'CBC', name: 'Complete Blood Count' },
    { code: 'BMP', name: 'Basic Metabolic Panel' },
    { code: 'LFT', name: 'Liver Function Test' },
    { code: 'RFT', name: 'Renal Function Test' },
    { code: 'GLUCOSE', name: 'Fasting Blood Glucose' },
    { code: 'LIPID', name: 'Lipid Profile' },
    { code: 'TSH', name: 'Thyroid Stimulating Hormone' },
    { code: 'UA', name: 'Urinalysis' },
    { code: 'XRAY', name: 'Chest X-Ray' },
    { code: 'ECG', name: 'Electrocardiogram' },
];

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function LabPage({ tenant }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [showResultModal, setShowResultModal] = useState(null); // order being resulted
    const [resultText, setResultText] = useState('');
    const [criticalFlag, setCriticalFlag] = useState(false);
    const [submittingResult, setSubmittingResult] = useState(false);

    useEffect(() => {
        loadOrders();
    }, [activeTab, tenant]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const status = activeTab === 'all' ? null : activeTab;
            const data = await api.getLabOrders(tenant?.id, status);
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load lab orders:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.updateLabOrderStatus(orderId, newStatus);
            loadOrders();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const handleSubmitResult = async () => {
        if (!resultText.trim()) return;
        setSubmittingResult(true);
        try {
            await api.recordLabResults(showResultModal.id, {
                results: resultText,
                criticalFlag,
            });
            setShowResultModal(null);
            setResultText('');
            setCriticalFlag(false);
            loadOrders();
        } catch (err) {
            alert('Failed to record result: ' + err.message);
        } finally {
            setSubmittingResult(false);
        }
    };

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const inProgressCount = orders.filter(o => o.status === 'in-progress').length;

    return (
        <section>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Diagnostic Intelligence</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Laboratory results and pathology reports</p>
                </div>
                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-bold animate-pulse">
                            {pendingCount} Pending
                        </span>
                    )}
                    <div className="badge success">CENTRAL LAB ONLINE</div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Pending Tests', value: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'In Progress', value: orders.filter(o => o.status === 'in-progress').length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Completed Today', value: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: 'Turnaround (avg)', value: '1.2 hrs', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-100' },
                ].map(s => (
                    <article key={s.label} className={`premium-panel ${s.bg} border ${s.border}`}>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase mt-1">{s.label}</div>
                    </article>
                ))}
            </div>

            {/* Tab Filter */}
            <div className="flex gap-2 mb-4">
                {['pending', 'in-progress', 'completed', 'all'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {tab === 'all' ? 'All Orders' : tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders Panel */}
                <div className="lg:col-span-2">
                    <article className="premium-panel p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg text-slate-700">Test Requests</div>
                                <div className="text-xs text-muted uppercase font-bold mt-1">
                                    {orders.length} order{orders.length !== 1 ? 's' : ''} in view
                                </div>
                            </div>
                            <button onClick={loadOrders} className="text-xs font-bold text-indigo-600 hover:underline uppercase">Refresh</button>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">
                                <div className="animate-spin text-2xl mb-2">⏳</div>
                                <p>Loading lab orders...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <div className="text-4xl mb-4 opacity-20">🔬</div>
                                <h3 className="font-bold text-slate-600">No {activeTab !== 'all' ? activeTab : ''} requests</h3>
                                <p className="text-sm">All diagnostic directives have been processed.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {orders.map(order => {
                                    let parsed = null;
                                    try { parsed = order.notes ? JSON.parse(order.notes) : null; } catch { }
                                    return (
                                        <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-800">{order.display || order.code || 'Lab Test'}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'}`}>
                                                            {order.status}
                                                        </span>
                                                        {parsed?.criticalFlag && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">CRITICAL</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        Patient: <span className="font-bold text-slate-700">{order.patient_first_name} {order.patient_last_name}</span>
                                                        {' • '}Ordered by: {order.ordered_by_name || 'Staff'}
                                                        {' • '}{new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    {parsed?.results && (
                                                        <div className="mt-2 p-2 bg-emerald-50 rounded text-xs font-mono text-emerald-800 border border-emerald-100">
                                                            📋 {parsed.results}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'in-progress')}
                                                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                                        >
                                                            Start
                                                        </button>
                                                    )}
                                                    {order.status === 'in-progress' && (
                                                        <button
                                                            onClick={() => setShowResultModal(order)}
                                                            className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
                                                        >
                                                            Enter Result
                                                        </button>
                                                    )}
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                                            className="text-xs px-3 py-1.5 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-50 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </article>
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    <article className="premium-panel">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Quick Reference
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Turnaround Time', value: '1.2 hrs avg' },
                                { label: 'Critical Values', value: orders.filter(o => { try { return JSON.parse(o.notes || '{}').criticalFlag; } catch { return false; } }).length, critical: true },
                                { label: 'TAT SLA', value: '< 4 hours' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-bold text-slate-500 uppercase">{item.label}</span>
                                    <span className={`text-sm font-bold ${item.critical && item.value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="premium-panel bg-indigo-600 text-white">
                        <h3 className="font-bold mb-2">Common Test Codes</h3>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {COMMON_TESTS.map(t => (
                                <div key={t.code} className="flex justify-between text-xs">
                                    <span className="font-mono font-bold text-indigo-200">{t.code}</span>
                                    <span className="text-indigo-100">{t.name}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                </aside>
            </div>

            {/* Result Entry Modal */}
            {showResultModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800">Record Result</h3>
                                <p className="text-xs text-slate-500">{showResultModal.display || showResultModal.code}</p>
                            </div>
                            <button onClick={() => setShowResultModal(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Result / Findings</label>
                            <textarea
                                value={resultText}
                                onChange={e => setResultText(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                                rows="4"
                                placeholder="Enter test result here (e.g. Hb: 13.2 g/dL, WBC: 7,500/μL...)"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mb-5">
                            <input
                                type="checkbox"
                                checked={criticalFlag}
                                onChange={e => setCriticalFlag(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-xs font-bold text-red-600 uppercase">Critical / Panic Value — Notify Clinician Immediately</span>
                        </label>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowResultModal(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button
                                onClick={handleSubmitResult}
                                disabled={submittingResult || !resultText.trim()}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {submittingResult ? 'Saving...' : 'Submit Result'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
