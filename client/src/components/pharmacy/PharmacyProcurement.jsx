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
                <article className="premium-panel bg-emerald-600 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Stock Replenishment</h3>
                            <p className="text-sm text-emerald-100 mb-6">Import bulk inventory data via electronic manifest (CSV).</p>
                        </div>
                        <div className="text-3xl opacity-30">📦</div>
                    </div>
                    <div className="space-y-4">
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVImport}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                disabled={importing}
                            />
                            <button className="w-full py-3 bg-white text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-50 transition shadow-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
                                {importing ? 'Processing Protocol...' : 'Upload Stock Manifest'}
                            </button>
                        </div>
                        <p className="text-[10px] text-emerald-100 font-medium text-center uppercase tracking-wider">Accepted format: CSV (genericName, batchNumber, expiryDate, quantity)</p>
                    </div>
                </article>

                {/* Stats Card */}
                <article className="premium-panel border-indigo-100 flex flex-col justify-center gap-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        Pipeline Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {['pending', 'approved', 'received', 'cancelled'].map(s => (
                            <div key={s} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">{s}</div>
                                <div className="text-2xl font-bold text-slate-700">
                                    {purchaseOrders.filter(p => p.status === s).length}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            {/* Import Results Banner */}
            {importResults && (
                <article className="premium-panel animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">Manifest Summary</h3>
                        <button onClick={() => setImportResults(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase">Dismiss</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Imported</div>
                            <div className="text-2xl font-bold text-emerald-700">{importResults.imported}</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <div className="text-xs font-bold text-red-600 uppercase mb-1">Skipped</div>
                            <div className="text-2xl font-bold text-red-700">{importResults.skipped}</div>
                        </div>
                    </div>
                    {importResults.errors?.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            <h4 className="text-xs font-bold text-slate-500 uppercase">Anomaly Logs</h4>
                            {importResults.errors.map((e, i) => (
                                <div key={i} className="text-xs p-2 bg-red-50 text-red-600 rounded border border-red-100">
                                    {e.item}: {e.error}
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            )}

            {/* Purchase Orders List */}
            <article className="premium-panel p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-lg text-slate-700">Procurement Pipeline</div>
                        <div className="text-xs text-muted uppercase font-bold mt-1">Active Purchase Directives</div>
                    </div>
                    <button onClick={loadPurchaseOrders} className="text-xs font-bold text-indigo-600 hover:underline uppercase">Refresh</button>
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
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(po.status)}`}>
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
