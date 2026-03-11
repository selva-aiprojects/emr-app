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
                api.getInvoices(tenant.id)
            ]);

            const ipd = allEncounters
                .filter(e => (e.encounter_type === 'In-patient' || e.type === 'IPD') && e.status === 'open')
                .map(e => {
                    // Check if there are any unpaid invoices for this patient
                    const patientInvoices = allInvoices.filter(inv => inv.patientId === (e.patient_id || e.patientId));
                    const hasUnpaid = patientInvoices.some(inv => inv.status !== 'paid');
                    return {
                        ...e,
                        isCleared: !hasUnpaid
                    };
                });
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

        const amountStr = prompt('Estimated inpatient bill amount (leave 0 for draft):', '0');
        const amount = parseFloat(amountStr) || 0;

        try {
            // 1. Close the clinical encounter
            await api.dischargePatient(encounter.id, { diagnosis, notes });

            // 2. Auto-create a draft billing invoice
            try {
                await api.createDischargeInvoice(encounter.id, {
                    patientId: encounter.patient_id || encounter.patientId,
                    amount,
                    description: `Inpatient Admission — ${diagnosis}`
                });
                alert(`✅ Patient discharged and a draft invoice of ₹${amount.toLocaleString()} has been created in Billing.`);
            } catch (billingErr) {
                console.warn('Billing bridge failed (non-critical):', billingErr.message);
                alert('✅ Patient discharged. Note: Draft invoice creation failed — please raise invoice manually in Billing.');
            }

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

        </section>
    );
}


