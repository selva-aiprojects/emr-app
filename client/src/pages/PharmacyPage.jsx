import { useState, useEffect } from 'react';
import { api } from '../api.js';
import PharmacyAlerts from '../components/pharmacy/PharmacyAlerts.jsx';
import PharmacyVendors from '../components/pharmacy/PharmacyVendors.jsx';
import PharmacyProcurement from '../components/pharmacy/PharmacyProcurement.jsx';

export default function PharmacyPage({ tenant, onDispense }) {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'alerts', 'procurement', 'vendors'

    useEffect(() => {
        if (activeTab === 'queue') {
            loadQueue();
        }
    }, [activeTab, tenant]);

    const loadQueue = async () => {
        setLoading(true);
        try {
            const res = await api.getPharmacyQueue(tenant.id);
            setQueue(res.data || []);
        } catch (err) {
            console.error(err);
            setQueue([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDispenseItem = async (prescriptionId, item) => {
        if (!confirm(`Finalize dispensation of ${item.generic_name}?`)) return;
        try {
            await api.dispenseMedication(tenant.id, {
                prescriptionItemId: item.item_id,
                drugId: item.drug_id,
                quantity: item.quantity_prescribed
            });
            loadQueue();
            if (onDispense) onDispense();
        } catch (err) {
            alert('Dispensation Error: ' + err.message);
        }
    };

    return (
        <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pharmaceutical Oversight</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Medication dispensation and pharmacy supply chain</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
                    <button
                        className={`px-3 py-2 whitespace-nowrap rounded-lg text-xs font-bold transition flex-shrink-0 ${activeTab === 'queue' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        onClick={() => setActiveTab('queue')}
                    >
                        Dispensing Queue
                    </button>
                    <button
                        className={`px-3 py-2 whitespace-nowrap rounded-lg text-xs font-bold transition flex-shrink-0 ${activeTab === 'procurement' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        onClick={() => setActiveTab('procurement')}
                    >
                        Procurement
                    </button>
                    <button
                        className={`px-3 py-2 whitespace-nowrap rounded-lg text-xs font-bold transition flex-shrink-0 ${activeTab === 'vendors' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        onClick={() => setActiveTab('vendors')}
                    >
                        Vendors
                    </button>
                    <button
                        className={`px-3 py-2 whitespace-nowrap rounded-lg text-xs font-bold transition flex-shrink-0 ${activeTab === 'alerts' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        onClick={() => setActiveTab('alerts')}
                    >
                        Inventory Alerts
                    </button>
                </div>
            </div>

            {activeTab === 'queue' && (
                <article className="premium-panel p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-lg text-slate-700">Active Dispensation Queue</div>
                            <div className="text-xs text-muted uppercase font-bold mt-1">Pending Prescriptions</div>
                        </div>
                        <div className="badge success">OPS ACTIVE</div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="animate-spin text-2xl mb-2">⏳</div>
                            <p>Synchronizing...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-4">
                            {queue.length === 0 ? (
                                <div className="text-center p-12 text-muted border border-dashed border-slate-200 rounded-xl">
                                    <div className="text-4xl opacity-20 mb-4">💊</div>
                                    <h3>Registry Idle</h3>
                                    <p>No active directives identified in the queue.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {queue.map(p => (
                                        <div key={p.prescription_id} className="border border-slate-200 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                                                <div>
                                                    <div className="font-bold text-slate-800">
                                                        {p.patient_first_name} {p.patient_last_name}
                                                        <span className="text-xs font-normal text-slate-500 ml-2">ID: {p.patient_id.slice(0, 8)}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        Prescribed by {p.provider_name || 'Provider'} • {new Date(p.created_at).toLocaleString()}
                                                        {p.priority === 'stat' && <span className="ml-2 bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold text-[10px]">STAT</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-0">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-bold">Medication</th>
                                                            <th className="px-4 py-2 text-left font-bold">Sig / Instructions</th>
                                                            <th className="px-4 py-2 text-center font-bold">Qty</th>
                                                            <th className="px-4 py-2 text-right font-bold">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(p.items || []).map(item => (
                                                            <tr key={item.item_id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-bold text-slate-800">{item.generic_name}</div>
                                                                    <div className="text-xs text-slate-500">{item.strength} • {item.dosage_form}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-semibold text-slate-700">{item.dose} {item.frequency} {item.route}</div>
                                                                    <div className="text-[10px] text-slate-500">{item.instructions}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-bold">
                                                                    {item.quantity_prescribed}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {item.status === 'pending' || item.status === 'active' ? (
                                                                        <button
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded text-xs font-bold transition shadow-sm"
                                                                            onClick={() => handleDispenseItem(p.prescription_id, item)}
                                                                        >
                                                                            Dispense ({item.quantity_prescribed})
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">
                                                                            {item.status.toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </article>
            )}

            {activeTab === 'alerts' && (
                <PharmacyAlerts tenant={tenant} />
            )}

            {activeTab === 'procurement' && <PharmacyProcurement tenant={tenant} />}

            {activeTab === 'vendors' && <PharmacyVendors tenant={tenant} />}
        </section>
    );
}
