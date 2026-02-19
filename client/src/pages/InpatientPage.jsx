import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function InpatientPage({ tenant, onDischarge }) {
    const [encounters, setEncounters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInpatientEncounters();
    }, []);

    const loadInpatientEncounters = async () => {
        setLoading(true);
        try {
            const [allEncounters, allInvoices] = await Promise.all([
                api.getEncounters(tenant.id),
                api.getFinancials(tenant.id) // Or use a direct invoice fetch if available
            ]);

            // Derive invoices from financials or fetch separately if needed
            // For now, we'll assume we can get them or use a mock logic for the demo
            // In a real app, you'd fetch outstanding invoices for these specific patients
            const ipd = allEncounters
                .filter(e => (e.encounter_type === 'In-patient' || e.type === 'IPD') && e.status === 'open')
                .map(e => ({
                    ...e,
                    isCleared: Math.random() > 0.3 // Mock: 70% chance of being cleared for demo
                }));
            setEncounters(ipd);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDischarge = async (encounter) => {
        // eslint-disable-next-line
        if (!confirm('Initiate discharge protocol for this patient?')) return;

        const diagnosis = prompt('Final Discharge Diagnosis:', encounter.diagnosis || '');
        if (diagnosis === null) return;

        const notes = prompt('Clinical Discharge Summary:', 'Patient stable, follow-up recommended.');
        if (notes === null) return;

        try {
            await api.dischargePatient(encounter.id, { diagnosis, notes });
            loadInpatientEncounters();
            if (onDischarge) onDischarge();
        } catch (err) {
            alert('Discharge Protocol Error: ' + err.message);
        }
    };

    return (
        <section className="view ipd-workspace">
            <header className="ipd-header">
                <div className="title-stack">
                    <h2>Active Patient Occupancy</h2>
                    <p>Monitoring {encounters.length} active clinical admissions across facility wards</p>
                </div>
                <button className="refresh-trigger premium-glass" onClick={loadInpatientEncounters}>
                    <span>🔄</span> Sync Records
                </button>
            </header>

            <article className="occupancy-ledger premium-glass">
                {loading ? (
                    <div className="loading-stage">
                        <div className="pulse-loader"></div>
                        <p>Refreshing bed occupancy registry...</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Patient Registry</th>
                                    <th>Admission Temporal</th>
                                    <th>Working Diagnosis</th>
                                    <th>Clinical Status</th>
                                    <th>Financial Clearance</th>
                                    <th style={{ textAlign: 'right' }}>Logistics</th>
                                </tr>
                            </thead>
                            <tbody>
                                {encounters.length === 0 ? (
                                    <tr><td colSpan="6" className="empty-state-msg">No active inpatient admissions identified in the current registry.</td></tr>
                                ) : encounters.map(e => (
                                    <tr key={e.id} className="ledger-row">
                                        <td className="patient-col">
                                            <div className="p-avatar">{(e.patient_name || e.patientId || 'P')[0]}</div>
                                            <div className="p-info">
                                                <strong>{e.patient_name || (e.patientId?.length > 8 ? e.patientId.slice(0, 8) : e.patientId)}</strong>
                                                <span>PID: {e.patient_id || 'REGISTERED'}</span>
                                            </div>
                                        </td>
                                        <td className="date-col">
                                            <strong>{new Date(e.created_at || e.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong><br />
                                            <span>Admission: {new Date(e.created_at || e.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="diag-col">{e.diagnosis || 'Awaiting Assessment'}</td>
                                        <td>
                                            <span className="live-status-chip">
                                                <span className="pulse-dot"></span>
                                                Admitted
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', padding: '4px 10px', borderRadius: '14px', fontSize: '10px', fontWeight: 900,
                                                background: e.isCleared ? '#dcfce7' : '#fee2e2', color: e.isCleared ? '#15803d' : '#dc2626',
                                                border: `1px solid ${e.isCleared ? '#bbf7d0' : '#fecaca'}`
                                            }}>
                                                {e.isCleared ? '✓ CLEARED' : '⚠ PENDING BILL'}
                                            </span>
                                        </td>
                                        <td className="actions-col">
                                            <button
                                                className="discharge-btn-premium"
                                                onClick={() => handleDischarge(e)}
                                                disabled={!e.isCleared}
                                                title={!e.isCleared ? 'Financial clearance required before clinical discharge' : ''}
                                                style={{ opacity: e.isCleared ? 1 : 0.5, cursor: e.isCleared ? 'pointer' : 'not-allowed' }}
                                            >
                                                Discharge protocol
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>

            <style>{`
               .ipd-workspace { animation: fade-in 0.5s ease-out; }
               .ipd-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
               .ipd-header h2 { margin: 0; font-size: 1.75rem; font-weight: 900; color: #0f172a; letter-spacing: -0.025em; }
               .ipd-header p { margin: 4px 0 0; color: #64748b; font-size: 0.95rem; font-weight: 600; }
               
               .premium-glass { background: white; border-radius: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 25px rgba(0,0,0,0.03); }
               
               .refresh-trigger { border: none; padding: 10px 20px; font-size: 0.8rem; font-weight: 800; color: #64748b; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; border-radius: 12px; }
               .refresh-trigger:hover { background: #f8fafc; color: var(--tenant-primary); }

               .occupancy-ledger { padding: 0; overflow: hidden; }
               .table-wrapper { overflow-x: auto; }
               .premium-table { width: 100%; border-collapse: collapse; }
               .premium-table th { text-align: left; padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; border-bottom: 1px solid #f1f5f9; }
               .premium-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
               
               .patient-col { display: flex; align-items: center; gap: 12px; }
               .p-avatar { width: 36px; height: 36px; background: #eff6ff; color: #3b82f6; border-radius: 10px; display: grid; place-items: center; font-weight: 900; font-size: 1rem; }
               .p-info { display: flex; flex-direction: column; }
               .p-info strong { color: #0f172a; font-size: 14px; }
               .p-info span { font-size: 10px; color: #94a3b8; font-weight: 800; }
               
               .date-col strong { font-size: 13px; color: #475569; }
               .date-col span { font-size: 11px; color: #94a3b8; font-weight: 600; }
               
               .diag-col { font-weight: 600; color: #334155; font-size: 13px; max-width: 250px; }
               
               .live-status-chip { display: flex; align-items: center; gap: 6px; padding: 4px 12px; background: #f0fdf4; color: #16a34a; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; border: 1px solid #10b98122; width: fit-content; }
               .pulse-dot { width: 6px; height: 6px; background: #16a34a; border-radius: 50%; animation: pulse 1.5s infinite; }
               @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
               
               .discharge-btn-premium { background: white; border: 1px solid #fed7aa; color: #ea580c; padding: 8px 16px; border-radius: 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; letter-spacing: 0.025em; }
               .discharge-btn-premium:hover { background: #fff7ed; border-color: #ea580c; transform: translateY(-1px); }
               
               .loading-stage { text-align: center; padding: 5rem; color: #94a3b8; }
               .pulse-loader { width: 40px; height: 40px; background: var(--tenant-primary); border-radius: 50%; display: inline-block; animation: pulse 2s infinite ease-in-out; margin-bottom: 1rem; }
               
               .empty-state-msg { text-align: center; padding: 5rem; color: #cbd5e1; font-weight: 700; font-style: italic; }
            `}</style>
        </section>
    );
}
