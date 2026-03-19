import { useState, useMemo } from 'react';
import PatientSearch from '../components/PatientSearch.jsx';
import { patientName } from '../utils/format.js';
import { api } from '../api.js';
import Prescriber from '../components/pharmacy/Prescriber.jsx';
import '../styles/critical-care.css';
import { 
  History, 
  Plus, 
  Activity, 
  User, 
  Stethoscope, 
  FileText, 
  Printer, 
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

function printPrescription(enc, patient, medications, provider, tenant) {
  const w = window.open('', '_blank', 'width=800,height=900');
  const dateStr = new Date(enc.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - ${patient.firstName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1F2937; line-height: 1.6; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 4px solid #10B981; padding-bottom: 25px; margin-bottom: 40px; }
        .clinic-info h1 { color: #10B981; margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; }
        .clinic-info p { margin: 4px 0; color: #64748B; font-size: 13px; font-weight: 600; }
        .rx-label { font-size: 64px; color: #10B981; font-weight: 900; margin: 20px 0; font-family: 'Inter', serif; }
        .patient-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; background: #F3F4F6; padding: 24px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #E5E7EB; }
        .patient-grid div span { color: #64748B; font-size: 10px; text-transform: uppercase; font-weight: 900; display: block; margin-bottom: 6px; letter-spacing: 0.1em; }
        .patient-grid div strong { font-size: 14px; color: #1F2937; font-weight: 700; font-variant-numeric: tabular-nums; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { text-align: left; padding: 15px; border-bottom: 2px solid #E5E7EB; color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 900; }
        td { padding: 20px 15px; border-bottom: 1px solid #F3F4F6; font-size: 14px; color: #374151; }
        .med-name { font-weight: 800; color: #1F2937; font-size: 15px; }
        .instructions { font-size: 12px; color: #64748B; margin-top: 4px; font-weight: 500; font-style: italic; }
        .footer { margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature { text-align: center; border-top: 2px solid #1F2937; width: 220px; padding-top: 12px; }
        @media print { body { padding: 0px; } .header { border-bottom-width: 5px; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="clinic-info">
          <h1>${tenant?.name || 'EMR Medical Center'}</h1>
          <p>Institutional Clinical Registry • Licensed Node</p>
          <p>Global ID: ${(tenant?.id || 'SYS').slice(0, 8).toUpperCase()}</p>
        </div>
        <div style="text-align: right">
          <p style="font-size: 14px; margin:0; font-weight: 900; text-transform: uppercase; color: #1F2937;">Session Date: ${dateStr}</p>
          <p style="font-size: 11px; color:#64748B; margin:4px 0; font-weight: 800; text-transform: uppercase;">Doc Ref: ${enc.id ? enc.id.toUpperCase().slice(0, 12) : 'TEMP'}</p>
        </div>
      </div>

      <div class="patient-grid">
        <div><span>Identity</span><strong>${patient.firstName} ${patient.lastName}</strong></div>
        <div><span>MRN</span><strong>${patient.mrn || 'N/A'}</strong></div>
        <div><span>Demographics</span><strong>${new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / ${patient.gender}</strong></div>
        <div><span>Clinical Vitals</span><strong style="font-family: 'Inter', monospace;">BP: ${enc.bp || '--'} • HR: ${enc.hr || '--'}</strong></div>
      </div>

      <div class="rx-label">℞</div>

      <table>
        <thead>
          <tr>
            <th>Medication Node</th>
            <th>Dosage Regime</th>
            <th>Cycle</th>
          </tr>
        </thead>
        <tbody>
          ${medications.length > 0 ? medications.map(m => `
            <tr>
              <td>
                <div class="med-name">${m.name}</div>
                <div class="instructions">${m.instructions || 'As per clinical protocol'}</div>
              </td>
              <td style="font-weight: 700; font-variant-numeric: tabular-nums;">${m.dosage}</td>
              <td style="color:#64748B; font-weight:700; text-transform: uppercase; font-size: 13px;">${m.duration || 'Routine'}</td>
            </tr>
          `).join('') : '<tr><td colspan="3" style="text-align:center; color:#94A3B8; padding: 60px; font-weight: 800; text-transform: uppercase;">No therapeutic interventions recorded.</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 40px; background: #F9FAFB; padding: 30px; border-radius: 16px; border: 1px solid #E5E7EB;">
        <h4 style="margin:0 0 12px; font-size:11px; color:#1F2937; text-transform:uppercase; letter-spacing:0.15em; font-weight:900;">Physician Narrative & Advice</h4>
        <p style="margin:0; font-size:14px; color:#374151; white-space: pre-wrap; font-weight: 500; line-height: 1.8;">${enc.notes || 'No contraindications or specific advice recorded.'}</p>
      </div>

      <div class="footer">
        <div><p style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Digital Health Ledger • Secure Clinical Output</p></div>
        <div class="signature">
          <strong style="font-size: 15px; color: #1F2937; text-transform: uppercase; letter-spacing: 0.02em;">${provider?.name || 'Authorized Practitioner'}</strong>
          <p style="font-size: 11px; color: #64748B; margin-top: 6px; font-weight: 800; text-transform: uppercase;">MC Ref: ${(provider?.id || 'V1').slice(0, 8).toUpperCase()}</p>
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
      alert('URGENT: Safety override required to commit therapeutic trajectory.');
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
      alert('PROTOCOL ERROR: ' + err.message);
    }
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              EMR Clinical Workspace
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Clinical Node</span>
           </h1>
           <p className="dim-label">Longitudinal health recording, clinical assessments, and electronic prescription authorizing for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Clinical Integrity Validated • Diagnostic sync operational
           </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white shadow-sm px-5 py-3 rounded-2xl border border-slate-200 overflow-hidden">
              <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> {activeEncounters.length} Active Encounters
              </span>
           </div>
        </div>
      </header>
      {/* Patient context bar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Electronic Medical Record
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Structured clinical workspace for documenting visits and prescriptions.
            </p>
          </div>
          {selectedPatient && (
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-4 min-w-[260px]">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                {(selectedPatient.firstName || 'P')[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  MRN {selectedPatient.mrn || 'PENDING'} ·{' '}
                  {selectedPatient.gender || '—'} ·{' '}
                  {selectedPatient.dob
                    ? `${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} yrs`
                    : 'Age N/A'}
                </div>
              </div>
            </div>
          )}
        </div>
        {lastSaved && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                   Clinical record committed for {patientName(lastSaved.patientId, patients)}
                </p>
                <p className="text-xs text-emerald-700">
                  You can authorize the prescription output or return to the clinical hub.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="clinical-btn clinical-btn--accent"
                onClick={() => {
                  printPrescription(
                    { ...lastSaved, id: 'NEW' },
                    patients.find(p => p.id === lastSaved.patientId),
                    lastSaved.medications,
                    providers.find(p => p.id === lastSaved.providerId),
                    tenant
                  );
                }}
              >
                <Printer className="w-4 h-4" /> Authorize output
              </button>
              <button
                type="button"
                className="clinical-btn bg-white text-slate-700 border border-slate-200"
                onClick={() => {
                  setLastSaved(null);
                  setSelectedPatientId('');
                  setActiveTab('active');
                }}
              >
                Back to clinical hub
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="page-header-premium mb-8">
        <div className="premium-tab-bar">
          <button className={`premium-tab-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
             <Activity className="w-4 h-4" /> Active Registry
          </button>
          <button className={`premium-tab-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
             <History className="w-4 h-4" /> Persistence Ledger
          </button>
          <button className={`premium-tab-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>
             <Plus className="w-4 h-4" /> New Assessment
          </button>
          <button className="premium-tab-item !text-rose-600 bg-rose-50/50 hover:bg-rose-100/50 border-rose-100" onClick={() => { setActiveTab('new'); setTimeout(() => { const sel = document.querySelector('select[name="type"]'); if(sel) { sel.value = "Emergency"; sel.scrollIntoView(); } }, 100); }}>
             <AlertCircle className="w-4 h-4" /> Emergency Shard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {activeTab === 'new' && (
          <>
            <aside className="col-span-12 lg:col-span-4 space-y-8">
              <article className="clinical-card">
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Step 01 / Identity</h4>
                  <p className="text-sm font-bold text-slate-800">Assign Subject for Clinical Documentation</p>
                </div>
                <PatientSearch tenantId={tenant?.id} onSelect={(p) => setSelectedPatientId(p.id)} />

                {selectedPatient && (
                  <div className="mt-8 p-6 bg-slate-900 rounded-2xl border border-white/10 relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10 flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-[var(--primary)] flex items-center justify-center text-xl font-bold text-white shadow-lg">
                        {(selectedPatient.firstName || 'P')[0]}
                      </div>
                      <div>
                        <div className="text-base font-bold text-white tracking-tight">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                        <div className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-0.5">MRN-{selectedPatient.mrn || 'PENDING'}</div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:border-rose-500/30 transition-colors">
                        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Sensitivity Matrix</label>
                        <div className="text-xs font-bold text-rose-400 group-hover:text-rose-300 transition-colors">{selectedPatient.medicalHistory?.allergies || 'NONE RECORDED'}</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:border-[var(--primary)]/30 transition-colors">
                        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Pathological History</label>
                        <div className="text-xs font-bold text-[var(--primary-soft)]">{selectedPatient.medicalHistory?.chronicConditions || 'CLEAR PROFILE'}</div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                       <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Profile verified</div>
                       <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </div>
                )}
              </article>
            </aside>

            <main className="col-span-12 lg:col-span-8">
              {!selectedPatient ? (
                <article className="clinical-card h-full flex flex-col items-center justify-center py-32 text-center border-dashed border-2 bg-slate-50/10">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-sm opacity-40">
                    <User className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Identity Required</h3>
                  <p className="text-sm text-slate-500 mt-3 max-w-xs font-medium">Identify a subject from the registry to initiate professional documentation.</p>
                </article>
              ) : (
              <form className="clinical-card space-y-8 animate-fade-in" onSubmit={handleEncounterSubmit}>
                <header className="flex justify-between items-start border-b border-slate-50 pb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Clinical Assessment Node</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized intervention • Institutional Persistence</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BP (mmHg)</label>
                      <input name="bp" placeholder="---/--" className="input-field py-4 w-28 font-tabular text-center bg-slate-50 border-none rounded-xl text-lg font-black" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pulse (bpm)</label>
                      <input name="hr" placeholder="--" className="input-field py-4 w-24 font-tabular text-center bg-slate-50 border-none rounded-xl text-lg font-black" />
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Attending Identity</label>
                    <select name="providerId" className="input-field h-[60px] bg-slate-50 border-none font-bold text-slate-800 rounded-xl" required>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Encounter Shard</label>
                    <select name="type" className="input-field h-[60px] bg-slate-50 border-none font-bold text-slate-800 rounded-xl">
                      <option>Out-patient</option>
                      <option>In-patient</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chief Complaint Narrative</label>
                    <input name="complaint" required placeholder="Subjective reasoning..." className="input-field py-5 bg-slate-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Diagnosis</label>
                    <input name="diagnosis" required placeholder="Professional assessment..." className="input-field py-5 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Therapeutic Prescribing Node</h4>
                     <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter">✓ Safety Engine Active</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <Prescriber
                      tenantId={tenant?.id}
                      patientId={selectedPatientId}
                      initialMeds={prescriptionItems}
                      onDrugsChange={handleDrugsChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Advice & Institutional Narrative</label>
                  <textarea name="notes" placeholder="Advice given, future investigations, follow-up parameters..." className="input-field py-5 h-40 bg-slate-50 border-none rounded-2xl resize-none"></textarea>
                </div>

                <div className="pt-8 border-t border-slate-50">
                  <button type="submit" className="clinical-btn bg-slate-900 text-white w-full py-6 text-xs shadow-2xl hover:bg-slate-800 transition-all rounded-2xl">
                    Commit Assessment & Authorize Prescription
                  </button>
                </div>
              </form>
            )}
          </main>
        </>
      )}

        {(activeTab === 'active' || activeTab === 'history') && (
          <main className="col-span-12 space-y-8">
            <article className="clinical-card">
              <header className="flex justify-between items-end mb-8 border-b border-slate-50 pb-6">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Clinical Encounter Registry</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monitoring {(activeTab === 'active' ? activeEncounters : pastEncounters).length} sequential clinical events</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                   {/* Search/Filter would go here */}
                </div>
              </header>
              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th className="tracking-[0.2em]">Temporal Node</th>
                      <th className="tracking-[0.2em]">Subject Identity</th>
                      <th className="tracking-[0.2em]">Clinical Department</th>
                      <th className="tracking-[0.2em]">Diagnosis & Narrative Shard</th>
                      <th style={{ textAlign: 'right' }} className="tracking-[0.2em]">Case Extract</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(activeTab === 'active' ? activeEncounters : pastEncounters).length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-32">
                         <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                         <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No clinical event logs detected in the persistence node.</p>
                      </td></tr>
                    ) : (activeTab === 'active' ? activeEncounters : pastEncounters).map((e, idx) => {
                      const pat = patients.find(p => p.id === (e.patient_id || e.patientId));
                      return (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                          <td>
                            <div className="text-sm font-black text-slate-900 tabular-nums">{new Date(e.created_at || e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(e.created_at || e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic">{(pat?.firstName || 'P')[0]}</div>
                               <div>
                                  <div className="font-black text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => { setSelectedPatientId(e.patient_id || e.patientId); setActiveTab('new'); }}>
                                    {pat ? `${pat.firstName} ${pat.lastName}` : (e.patientName || 'Unknown Identity')}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">MRN-${pat?.mrn || 'NEW_NODE'}</div>
                               </div>
                            </div>
                          </td>
                          <td>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${e.encounter_type === 'Emergency' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {e.encounter_type || e.type}
                            </span>
                          </td>
                          <td>
                             <div className="max-w-md">
                                <div className="text-[13px] font-black text-slate-800 truncate">{e.diagnosis || 'Active Clinical Assessment...'}</div>
                                <div className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-1 italic">{e.notes || 'No institutional narrative recorded.'}</div>
                             </div>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all group" title="Institutional Case Summary" onClick={() => {
                                const win = window.open('', '_blank', 'width=900,height=1000');
                                win.document.write(`
                                  <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                                    body { font-family: 'Inter', sans-serif; padding: 60px; background: #f8fafc; color: #1e293b; }
                                    .card { background: white; padding: 50px; border-radius: 32px; border: 1px solid #e2e8f0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05); }
                                    .label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #94a3b8; margin-bottom: 8px; }
                                    .value { font-size: 15px; font-weight: 700; color: #1e293b; }
                                    .header { border-bottom: 2px solid #10b981; padding-bottom: 30px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                                  </style>
                                  <div class="card">
                                    <div class="header">
                                      <div>
                                        <div class="label">Institutional Clinical Record</div>
                                        <h1 style="margin:0; font-size: 32px; font-weight: 900; letter-spacing: -0.04em;">${pat?.firstName} ${pat?.lastName}</h1>
                                        <div class="value" style="color:#64748b;">MRN-${pat?.mrn} • ${e.type} Node</div>
                                      </div>
                                      <div style="text-align:right">
                                        <div class="label">Authorization Date</div>
                                        <div class="value">${new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</div>
                                      </div>
                                    </div>
                                    
                                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px;">
                                      <div>
                                        <div class="label">Diagnostic Assessment</div>
                                        <div class="value" style="font-size: 20px; line-height: 1.4;">${e.diagnosis}</div>
                                      </div>
                                      <div>
                                        <div class="label">Clinical Vitals Node</div>
                                        <div style="display:flex; gap: 20px;">
                                          <div style="padding:15px; background:#f1f5f9; border-radius:16px; flex:1;">
                                            <div class="label" style="font-size:8px;">BP mmHg</div>
                                            <div class="value">${e.bp || '--'}</div>
                                          </div>
                                          <div style="padding:15px; background:#f1f5f9; border-radius:16px; flex:1;">
                                            <div class="label" style="font-size:8px;">Pulse BPM</div>
                                            <div class="value">${e.hr || '--'}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div style="margin-bottom: 50px;">
                                      <div class="label">Physician Narrative Shard</div>
                                      <div class="value" style="font-weight: 500; line-height: 1.8; color: #475569; background: #fdfdfd; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9;">${e.notes || 'No institutional narrative available for this shard.'}</div>
                                    </div>

                                    <div style="text-align:center; padding-top: 40px; border-top: 1px dashed #e2e8f0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
                                      End of Institutional Clinical Extract • Document Reference ${e.id ? e.id.toUpperCase().slice(0,8) : 'TEMP'}
                                    </div>
                                  </div>
                                `);
                                win.document.close();
                              }}>
                                 <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Summary Extract</span>
                              </button>
                              <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all border border-slate-100 hover:border-emerald-100" title="Generate Rx" onClick={() => printPrescription(e, pat || { firstName: 'Patient' }, [], providers.find(p => p.id === (e.provider_id || e.providerId)), tenant)}>
                                 <Printer className="w-4 h-4" />
                              </button>
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
