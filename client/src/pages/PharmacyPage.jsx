import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function PharmacyPage({ tenant, onDispense }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Pending');

    useEffect(() => {
        loadPrescriptions();
    }, [statusFilter]);

    const loadPrescriptions = async () => {
        setLoading(true);
        try {
            const allPrescriptions = await api.getPrescriptions(tenant.id, { status: statusFilter });
            setPrescriptions(allPrescriptions || []);
        } catch (err) {
            console.error(err);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDispense = async (prescription) => {
        // eslint-disable-next-line
        if (!confirm('Finalize dispensation? This will adjust inventory stock levels across the facility.')) return;
        try {
            const response = await api.dispensePrescription(prescription.id, {
                tenantId: tenant.id,
                status: 'Dispensed'
            });
            loadPrescriptions();
            if (onDispense) onDispense(response);
        } catch (err) {
            alert('Dispensation Registry Error: ' + err.message);
        }
    };

    return (
        <section>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pharmaceutical Oversight</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Real-time medication dispensation registry</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                    {['Pending', 'Dispensed', 'Cancelled'].map(s => (
                        <button
                            key={s}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${statusFilter === s ? 'bg-amber-50 text-amber-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s} Queue
                        </button>
                    ))}
                </div>
            </div>

            <article className="premium-panel p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-lg text-slate-700">Active Dispensation Queue</div>
                        <div className="text-xs text-muted uppercase font-bold mt-1">Monitoring {prescriptions.length} directives</div>
                    </div>
                    <div className="badge success">OPS ACTIVE</div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="animate-spin text-2xl mb-2">⏳</div>
                        <p>Synchronizing...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Registry Event</th>
                                    <th>Clinical Subject</th>
                                    <th>Therapeutic Item</th>
                                    <th>Dosage Protocol</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Logistics</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-12 text-muted">
                                            <div className="text-4xl opacity-20 mb-4">💊</div>
                                            <h3>Registry Idle</h3>
                                            <p>No active directives identified in the {statusFilter.toLowerCase()} queue.</p>
                                        </td>
                                    </tr>
                                ) : prescriptions.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="font-bold text-slate-700">{new Date(p.createdAt || p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                            <div className="text-xs text-muted font-bold">{new Date(p.createdAt || p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-slate-900">{p.patient_name || p.patientId}</div>
                                            <span className="text-xs text-muted font-bold">ID: {(p.patientId || 'NEW').slice(0, 8).toUpperCase()}</span>
                                        </td>
                                        <td>
                                            <div className="font-bold text-blue-600">{p.drug_name}</div>
                                            <div className="text-xs text-muted font-bold">Standard Unit Authorization</div>
                                        </td>
                                        <td>
                                            <span className="badge secondary">{p.dosage}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${p.status === 'Pending' ? 'warning' : p.status === 'Dispensed' ? 'success' : 'secondary'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {p.status === 'Pending' && (
                                                <button
                                                    className="premium-btn btn-primary py-1 px-3 text-xs"
                                                    onClick={() => handleDispense(p)}
                                                >
                                                    Finalize Release
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>
        </section>
    );
}
