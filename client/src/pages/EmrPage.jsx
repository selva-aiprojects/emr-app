import { useState, useMemo } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';
import { patientName } from '../utils/format.js';
import { api } from '../api.js';
import Prescriber from '../components/pharmacy/Prescriber.jsx';

function printPrescription(enc, patient, medications, provider, tenant) {
  const w = window.open('', '_blank', 'width=800,height=900');
  const dateStr = new Date(enc.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - ${patient.firstName}</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #10b981; padding-bottom: 25px; margin-bottom: 40px; }
        .clinic-info h1 { color: #059669; margin: 0; font-size: 28px; font-weight: 900; }
        .clinic-info p { margin: 4px 0; color: #64748b; font-size: 13px; }
        .rx-label { font-size: 48px; color: #059669; font-weight: 900; margin: 20px 0; font-family: 'Times New Roman', serif; }
        .patient-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
        .patient-grid div span { color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block; margin-bottom: 4px; letter-spacing: 0.05em; }
        .patient-grid div strong { font-size: 14px; color: #1e293b; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { text-align: left; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; }
        td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #334155; }
        .med-name { font-weight: 800; color: #0f172a; font-size: 15px; }
        .instructions { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .footer { margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature { text-align: center; border-top: 1px solid #cbd5e1; width: 220px; padding-top: 10px; }
        @media print { body { padding: 0px; } .header { border-bottom-width: 4px; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="clinic-info">
          <h1>${tenant?.name || 'EMR Medical Center'}</h1>
          <p>Certified Healthcare Facility • Licensed Practitioner</p>
          <p>Contact: +91-XXXXX-XXXXX</p>
        </div>
        <div style="text-align: right">
          <p style="font-size: 14px; margin:0; font-weight: 800;">Date: ${dateStr}</p>
          <p style="font-size: 11px; color:#94a3b8; margin:4px 0; font-weight: 600;">ID: ${enc.id ? enc.id.toUpperCase().slice(0, 12) : 'TEMP'}</p>
        </div>
      </div>

      <div class="patient-grid">
        <div><span>Patient Identity</span><strong>${patient.firstName} ${patient.lastName}</strong></div>
        <div><span>MRN / File No.</span><strong>${patient.mrn || 'N/A'}</strong></div>
        <div><span>Age / Gender</span><strong>${new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / ${patient.gender}</strong></div>
        <div><span>Clinical Vitals</span><strong>BP: ${enc.bp || '--'} • HR: ${enc.hr || '--'}</strong></div>
      </div>

      <div class="rx-label">℞</div>

      <table>
        <thead>
          <tr>
            <th>Line Item / Medication</th>
            <th>Dosage Regime</th>
            <th>Cycle</th>
          </tr>
        </thead>
        <tbody>
          ${medications.length > 0 ? medications.map(m => `
            <tr>
              <td>
                <div class="med-name">${m.name}</div>
                <div class="instructions">${m.instructions || 'Follow clinical instructions'}</div>
              </td>
              <td style="font-weight: 700;">${m.dosage}</td>
              <td style="color:#64748b; font-weight:600;">${m.duration || 'As directed'}</td>
            </tr>
          `).join('') : '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding: 40px;">No medications recorded in this session.</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 40px; background: #fdfcfb; padding: 25px; border-radius: 12px; border: 1px solid #fef3c7;">
        <h4 style="margin:0 0 10px; font-size:10px; color:#d97706; text-transform:uppercase; letter-spacing:0.1em; font-weight:900;">Physician Advice & Observations</h4>
        <p style="margin:0; font-size:14px; color:#1e293b; white-space: pre-wrap; font-weight: 500;">${enc.notes || 'No specific clinical observations recorded for this encounter.'}</p>
      </div>

      <div class="footer">
        <div><p style="font-size: 11px; color: #94a3b8; font-weight: 500;">This is a digitally signed clinical document. Verify with clinic system.</p></div>
        <div class="signature">
          <strong style="font-size: 15px; color: #0f172a;">${provider?.name || 'Authorized Practitioner'}</strong>
          <p style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 700;">Digital Signature: MC-${(provider?.id || 'V1').slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
}

export default function EmrPage({ tenant, patients, providers, encounters, onCreateEncounter, onDischarge }) {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [safetyData, setSafetyData] = useState({ safetyCheck: null, overrideSafety: false });

  const activeEncounters = useMemo(() => encounters.filter(e => e.status === 'open'), [encounters]);
  const pastEncounters = useMemo(() => encounters.filter(e => e.status === 'closed'), [encounters]);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
  const patientHistory = useMemo(() => {
    if (!selectedPatientId) return [];
    return encounters.filter(e => e.patientId === selectedPatientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [encounters, selectedPatientId]);

  const handleDrugsChange = (items, checkData) => {
    setPrescriptionItems(items);
    setSafetyData(checkData);
  };

  const [lastSaved, setLastSaved] = useState(null);

  const handleEncounterSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    if (safetyData.safetyCheck && !safetyData.safetyCheck.isSafe && !safetyData.overrideSafety) {
      alert('You must override safety warnings before finalizing.');
      return;
    }

    const legacyMeds = prescriptionItems.map(m => ({
      name: m.drugName,
      dosage: `${m.dose} ${m.doseUnit} ${m.frequency}`,
      duration: `${m.durationDays} days`,
      instructions: m.instructions
    }));

    const data = {
      patientId: selectedPatientId,
      providerId: fd.get('providerId'),
      type: fd.get('type'),
      complaint: fd.get('complaint'),
      diagnosis: fd.get('diagnosis'),
      notes: fd.get('notes'),
      bp: fd.get('bp'),
      hr: fd.get('hr'),
      medications: legacyMeds,
      pharmacyItems: prescriptionItems
    };

    try {
      await onCreateEncounter(data);
      setLastSaved({ ...data, createdAt: new Date().toISOString() });
      setPrescriptionItems([]);
      setSafetyData({ safetyCheck: null, overrideSafety: false });
    } catch (err) {
      alert('Clinical Save Error: ' + err.message);
    }
  };

  if (lastSaved) {
    return (
      <div className="panel finish-card premium-glass" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div className="finish-icon">✅</div>
        <h2>Clinical Record Finalized</h2>
        <p className="finish-subtext">The consultation for <strong>{patientName(lastSaved.patientId, patients)}</strong> has been securely logged.</p>
        <div className="finish-actions">
          <button className="finish-btn print" onClick={() => {
            printPrescription({ ...lastSaved, id: 'NEW' }, patients.find(p => p.id === lastSaved.patientId), lastSaved.medications, providers.find(p => p.id === lastSaved.providerId), tenant);
          }}>
            <span className="icon">🖨️</span> Generate Prescription
          </button>
          <button className="finish-btn dashboard" onClick={() => {
            setLastSaved(null);
            setSelectedPatientId('');
            setActiveTab('active');
          }}>
            Clinical Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="view clinical-workspace">
      <div className="workspace-header">
        <div className="tab-group premium-glass">
          <button className={`tab-link ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            <span className="icon">🏥</span> Active Encounters
          </button>
          <button className={`tab-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <span className="icon">📚</span> Global History
          </button>
          <button className={`tab-link ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')} id="new-consult-btn">
            <span className="icon">➕</span> New Consultation
          </button>
        </div>
      </div>

      {activeTab === 'new' && (
        <div className="consultation-layout-grid">

          <aside className="clinical-sidebar premium-glass">
            <div className="sidebar-header">
              <h4>1. Selection</h4>
              <p>Identify the subject patient</p>
            </div>
            <div className="sidebar-content">
              <PatientSearch tenantId={tenant?.id} onSelect={(p) => setSelectedPatientId(p.id)} />

              {selectedPatient && (
                <div className="subject-profile-card">
                  <div className="subject-header">
                    <div className="subject-avatar">{(selectedPatient.firstName || 'P')[0]}</div>
                    <div className="subject-names">
                      <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                      <span>MRN: {selectedPatient.mrn || 'PENDING'}</span>
                    </div>
                  </div>
                  <div className="subject-criticals">
                    <div className="critical-item allergies">
                      <label>Allergies</label>
                      <strong>{selectedPatient.medicalHistory?.allergies || 'NONE RECORDED'}</strong>
                    </div>
                    <div className="critical-item chronic">
                      <label>Chronic History</label>
                      <strong>{selectedPatient.medicalHistory?.chronicConditions || 'CLEAR'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="consultation-container">
            {!selectedPatient ? (
              <div className="panel select-placeholder premium-glass">
                <div className="placeholder-content">
                  <img src="/logo.svg" style={{ width: '80px', opacity: 0.1, marginBottom: '1rem' }} />
                  <p>Identify a patient from the sidebar to begin clinical documentation</p>
                </div>
              </div>
            ) : (
              <form className="consultation-form panel premium-glass" onSubmit={handleEncounterSubmit}>
                <div className="consult-header">
                  <div className="header-meta">
                    <h3>Clinical Record Input</h3>
                    <p>Draft Electronic Medical Record & Prescription</p>
                  </div>
                  <div className="vitals-strip">
                    <div className="vital-input">
                      <label>BP</label>
                      <input name="bp" placeholder="---/--" />
                    </div>
                    <div className="vital-input">
                      <label>HR</label>
                      <input name="hr" placeholder="--" />
                    </div>
                  </div>
                </div>

                <div className="consult-form-grid">
                  <div className="form-group-rich">
                    <label>Attending Provider</label>
                    <select name="providerId" required>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group-rich">
                    <label>Interaction Type</label>
                    <select name="type">
                      <option>Out-patient</option>
                      <option>In-patient</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="consult-form-grid-2">
                  <div className="form-group-rich">
                    <label>Chief Complaint</label>
                    <input name="complaint" required placeholder="Subjective reasoning for visit..." />
                  </div>
                  <div className="form-group-rich">
                    <label>Provisional Diagnosis</label>
                    <input name="diagnosis" required placeholder="Objective assessment..." />
                  </div>
                </div>

                <Prescriber
                  tenantId={tenant?.id}
                  patientId={selectedPatientId}
                  initialMeds={prescriptionItems}
                  onDrugsChange={handleDrugsChange}
                />

                <div className="form-group-rich">
                  <label>Physician Advice & Narrative</label>
                  <textarea name="notes" placeholder="Advice given, future investigations, follow-up..." style={{ height: '120px' }}></textarea>
                </div>

                <div className="form-actions-sticky">
                  <button type="submit" className="finalize-btn-premium">Finalize Session & Print Rx</button>
                </div>
              </form>
            )}
          </main>
        </div>
      )}

      {(activeTab === 'active' || activeTab === 'history') && (
        <article className="ledger-card premium-glass">
          <div className="ledger-header">
            <div className="title-stack">
              <h3>Clinical Encounter Ledger</h3>
              <p>Monitoring {(activeTab === 'active' ? activeEncounters : lastSaved ? [lastSaved, ...pastEncounters] : pastEncounters).length} clinical events</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Temporal Stamp</th>
                  <th>Clinical Subject</th>
                  <th>Dept/Type</th>
                  <th>Diagnosis / Outcome</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'active' ? activeEncounters : pastEncounters).length === 0 ? (
                  <tr><td colSpan="5" className="empty-table-msg">No clinical encounters recorded in this view.</td></tr>
                ) : (activeTab === 'active' ? activeEncounters : pastEncounters).map(e => {
                  const pat = patients.find(p => p.id === (e.patient_id || e.patientId));
                  return (
                    <tr key={e.id} className="ledger-row">
                      <td className="date-cell">
                        <strong>{new Date(e.created_at || e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong><br />
                        {new Date(e.created_at || e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="patient-cell">
                        <div className="p-link" onClick={() => { setSelectedPatientId(e.patient_id || e.patientId); setActiveTab('new'); }}>
                          {pat ? `${pat.firstName} ${pat.lastName}` : (e.patientName || 'Unknown')}
                        </div>
                        <span className="tiny-id">MRN: {pat?.mrn || 'NEW'}</span>
                      </td>
                      <td>
                        <span className={`status-chip ${(e.encounter_type || e.type || '').toLowerCase().replace('-', '')}`}>
                          {e.encounter_type || e.type}
                        </span>
                      </td>
                      <td className="diagnosis-cell">{e.diagnosis || 'Clinical Assessment...'}</td>
                      <td className="actions-cell">
                        <div className="action-button-group">
                          <button className="ledger-btn print" onClick={() => printPrescription(e, pat || { firstName: 'Patient' }, [], providers.find(p => p.id === (e.provider_id || e.providerId)), tenant)}>Rx</button>
                          {e.status === 'open' && (
                            <button className="ledger-btn consult" onClick={() => { setSelectedPatientId(e.patient_id || e.patientId); setActiveTab('new'); }}>📝 Documentation</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}


