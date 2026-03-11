import { useState } from 'react';
import { api } from '../../api.js';

export default function PharmacyProcurement({ tenant }) {
    const [loading, setLoading] = useState(false);
    const [importResults, setImportResults] = useState(null);

    const handleCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        // Simple CSV parser for demo purposes
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
            } catch (err) {
                alert('Import Error: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                disabled={loading}
                            />
                            <button className="w-full py-3 bg-white text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-50 transition shadow-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
                                {loading ? 'Processing Protocol...' : 'Upload Stock Manifest'}
                            </button>
                        </div>
                        <p className="text-[10px] text-emerald-100 font-medium text-center uppercase tracking-wider">Accepted format: CSV (genericName, batchNumber, expiryDate, quantity)</p>
                    </div>
                </article>

                <article className="premium-panel border-indigo-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        Procurement Pipeline
                    </h3>
                    <div className="text-center p-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <div className="text-3xl mb-2 opacity-20">📜</div>
                        <p className="text-sm font-medium">No active purchase directives detected in the current cycle.</p>
                    </div>
                </article>
            </div>

            {importResults && (
                <article className="premium-panel animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">Manifest Summary</h3>
                        <button onClick={() => setImportResults(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase">Dismiss</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Success</div>
                            <div className="text-2xl font-bold text-emerald-700">{importResults.imported}</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <div className="text-xs font-bold text-red-600 uppercase mb-1">Failed</div>
                            <div className="text-2xl font-bold text-red-700">{importResults.skipped}</div>
                        </div>
                    </div>
                    {importResults.errors.length > 0 && (
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
        </div>
    );
}
