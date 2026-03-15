import { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function PharmacyProcurement({ tenant }) {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);

    useEffect(() => {
        loadPurchaseOrders();
    }, [tenant]);

    const loadPurchaseOrders = async () => {
        setLoading(true);
        try {
            const res = await api.getPharmacyPOs(tenant.id);
            setPurchaseOrders(res.data || []);
        } catch (err) {
            console.error('Failed to load purchase orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim());

            const items = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const item = {};
                headers.forEach((h, i) => {
                    item[h] = values[i];
                });
                return item;
            });

            try {
                const res = await api.importPharmacyStock(tenant.id, items);
                setImportResults(res.data);
                loadPurchaseOrders(); // refresh PO list
            } catch (err) {
                alert('Import Error: ' + err.message);
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: 'bg-amber-100 text-amber-700',
            approved: 'bg-blue-100 text-blue-700',
            shipped: 'bg-indigo-100 text-indigo-700',
            received: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700',
            draft: 'bg-slate-100 text-slate-600',
        };
        return map[status] || 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CSV Import Card */}
                <article className="clinical-card p-8 bg-slate-900 text-white relative overflow-hidden group">
                    {/* Subtle Aura Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                    Stock Replenishment
                                </h3>
                                <p className="text-sm text-slate-400 font-medium max-w-[280px]">Import bulk inventory data via electronic manifest (CSV).</p>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-blue-400 shadow-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCSVImport}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    disabled={importing}
                                />
                                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                                    {importing ? 'Processing Protocol...' : 'Upload Stock Manifest'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 font-bold text-center uppercase tracking-widest">Accepted format: CSV (genericName, batchNumber, expiryDate, quantity)</p>
                        </div>
                    </div>
                </article>

                {/* Stats Card */}
                <article className="clinical-card p-10 flex flex-col justify-center gap-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></span>
                        Pipeline Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {['pending', 'approved', 'received', 'cancelled'].map(s => (
                            <div key={s} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">{s}</div>
                                <div className="text-3xl font-bold text-slate-900 tracking-tighter">
                                    {purchaseOrders.filter(p => p.status === s).length}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            {/* Import Results Banner */}
            {importResults && (
                <article className="clinical-card p-6 border-blue-100 bg-white animate-in zoom-in-95 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Manifest Summary</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Post-Import Validation</p>
                            </div>
                        </div>
                        <button onClick={() => setImportResults(null)} className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-tight transition-all">Dismiss</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Success</div>
                            <div className="text-2xl font-bold text-emerald-700">{importResults.imported}</div>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Skipped</div>
                            <div className="text-2xl font-bold text-amber-700">{importResults.skipped}</div>
                        </div>
                    </div>
                    {importResults.errors?.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                Clinical Anomaly Logs
                            </h4>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {importResults.errors.map((e, i) => (
                                    <div key={i} className="text-xs p-3 bg-red-50/50 text-red-600 rounded-xl border border-red-100 flex justify-between items-center">
                                        <span className="font-semibold">{e.item}</span>
                                        <span className="font-bold uppercase tracking-tighter text-xs px-1.5 py-0.5 bg-white rounded border border-red-100">{e.error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </article>
            )}

            {/* Purchase Orders List */}
            <article className="clinical-card p-0 overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Procurement Pipeline</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Active Purchase Directives</p>
                    </div>
                    <button onClick={loadPurchaseOrders} className="p-2 hover:bg-slate-50 rounded-lg text-blue-600 transition-all active:rotate-180 duration-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="animate-spin text-2xl mb-2">⏳</div>
                        <p>Loading purchase orders...</p>
                    </div>
                ) : purchaseOrders.length === 0 ? (
                    <div className="text-center p-12 text-muted border-t border-dashed border-slate-100">
                        <div className="text-3xl mb-2 opacity-20">📜</div>
                        <p className="text-sm font-medium">No active purchase directives detected in the current cycle.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-2 text-left font-bold">Order #</th>
                                    <th className="px-4 py-2 text-left font-bold">Vendor</th>
                                    <th className="px-4 py-2 text-left font-bold">Created By</th>
                                    <th className="px-4 py-2 text-right font-bold">Amount</th>
                                    <th className="px-4 py-2 text-center font-bold">Status</th>
                                    <th className="px-4 py-2 text-left font-bold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {purchaseOrders.map(po => (
                                    <tr key={po.order_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{po.order_number || po.po_number || '—'}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800">{po.vendor_name}</td>
                                        <td className="px-4 py-3 text-slate-500">{po.creator_name || '—'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">
                                            {po.total_amount ? `$${parseFloat(po.total_amount).toFixed(2)}` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusBadge(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {new Date(po.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>
        </div>
    );
}
