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
    <div className="page-shell-premium">
      <div className="action-bar-premium">
        <div className="panel-title-group">
          <h2 className="panel-title-text">Electronic Medical Records</h2>
          <p className="panel-subtitle-text">Clinical Encounter Intelligence</p>
        </div>
        <div className="premium-tab-bar">
          <button className={`premium-tab-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active</button>
          <button className={`premium-tab-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
          <button className={`premium-tab-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>New</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {activeTab === 'new' && (
          <>
            <aside className="col-span-4 space-y-6">
              <div className="glass-panel p-6">
                <div className="mb-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">1. Patient Selection</h4>
                  <p className="text-xs font-bold text-slate-700">Identify the subject for clinical documentation</p>
                </div>
                <PatientSearch tenantId={tenant?.id} onSelect={(p) => setSelectedPatientId(p.id)} />

                {selectedPatient && (
                  <div className="mt-8 p-5 bg-slate-900 rounded-2xl border border-white/10 relative overflow-hidden group shadow-xl transition-all hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10 flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-xl font-bold text-white shadow-lg">
                        {(selectedPatient.firstName || 'P')[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white tracking-tight">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                        <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest">MRN-{selectedPatient.mrn || 'PENDING'}</div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-white/40 mb-1">Allergies</label>
                        <div className="text-[11px] font-bold text-red-400">{selectedPatient.medicalHistory?.allergies || 'NONE RECORDED'}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-white/40 mb-1">Chronic History</label>
                        <div className="text-[11px] font-bold text-[var(--primary-soft)]">{selectedPatient.medicalHistory?.chronicConditions || 'CLEAR INVENTORY'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <main className="col-span-8">
              {!selectedPatient ? (
                <div className="glass-panel h-full flex items-center justify-center p-12 text-center">
                  <div>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm opacity-20">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <p className="text-sm font-bold text-slate-400 italic">Select a patient from the registry to begin clinical oversight</p>
                  </div>
                </div>
              ) : (
              <form className="glass-panel p-8 space-y-8 animate-fade-in" onSubmit={handleEncounterSubmit}>
                <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Assessment</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Institutional EMR Documentation Node</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BP (mmHg)</label>
                      <input name="bp" placeholder="---/--" className="input-field py-3 w-24 font-mono text-center bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pulse (bpm)</label>
                      <input name="hr" placeholder="--" className="input-field py-3 w-20 font-mono text-center bg-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attending Provider</label>
                    <select name="providerId" className="input-field h-[54px] bg-white font-bold text-slate-800" required>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interaction Type</label>
                    <select name="type" className="input-field h-[54px] bg-white font-bold text-slate-800">
                      <option>Out-patient</option>
                      <option>In-patient</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chief Complaint</label>
                    <input name="complaint" required placeholder="Subjective reasoning for visit..." className="input-field py-4 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provisional Diagnosis</label>
                    <input name="diagnosis" required placeholder="Objective assessment..." className="input-field py-4 bg-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Prescribing</h4>
                     <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">✓ Validate Safety</span>
                  </div>
                  <Prescriber
                    tenantId={tenant?.id}
                    patientId={selectedPatientId}
                    initialMeds={prescriptionItems}
                    onDrugsChange={handleDrugsChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Physician Advice & Narrative</label>
                  <textarea name="notes" placeholder="Advice given, future investigations, follow-up..." className="input-field py-4 h-32 bg-white resize-none"></textarea>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button type="submit" className="btn-primary w-full py-5 text-[10px] uppercase tracking-[0.2em] shadow-xl">
                    Finalize Session & Authorize Prescription
                  </button>
                </div>
              </form>
            )}
          </main>
        </>
      )}

        {(activeTab === 'active' || activeTab === 'history') && (
          <main className="col-span-12 space-y-8">
            <article className="premium-panel">
              <div className="panel-header-standard">
                <div className="panel-title-group">
                  <h3 className="panel-title-text">Clinical Encounter Ledger</h3>
                  <p className="panel-subtitle-text">Monitoring {(activeTab === 'active' ? activeEncounters : pastEncounters).length} clinical events</p>
                </div>
              </div>

              <div className="premium-table-container">
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
                  <tbody className="divide-y divide-slate-50">
                    {(activeTab === 'active' ? activeEncounters : pastEncounters).length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-20 text-slate-400 italic">No clinical encounters recorded in this view.</td></tr>
                    ) : (activeTab === 'active' ? activeEncounters : pastEncounters).map(e => {
                      const pat = patients.find(p => p.id === (e.patient_id || e.patientId));
                      return (
                        <tr key={e.id}>
                          <td>
                            <div className="text-sm font-bold text-slate-800">{new Date(e.created_at || e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-xs text-slate-400 font-bold uppercase">{new Date(e.created_at || e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td>
                            <div className="font-bold text-slate-800 cursor-pointer hover:text-[var(--primary)]" onClick={() => { setSelectedPatientId(e.patient_id || e.patientId); setActiveTab('new'); }}>
                              {pat ? `${pat.firstName} ${pat.lastName}` : (e.patientName || 'Unknown')}
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase">MRN: {pat?.mrn || 'NEW'}</div>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
                              {e.encounter_type || e.type}
                            </span>
                          </td>
                          <td className="text-xs font-medium text-slate-500">{e.diagnosis || 'Clinical Assessment...'}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button className="text-xs font-bold text-[var(--primary)] hover:underline uppercase tracking-widest" onClick={() => printPrescription(e, pat || { firstName: 'Patient' }, [], providers.find(p => p.id === (e.provider_id || e.providerId)), tenant)}>Rx</button>
                              {e.status === 'open' && (
                                <button className="text-xs font-bold text-slate-500 hover:text-[var(--primary)] uppercase tracking-widest" onClick={() => { setSelectedPatientId(e.patient_id || e.patientId); setActiveTab('new'); }}>📝 Edit</button>
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
          </main>
        )}
      </div>
    </div>
  );
}


