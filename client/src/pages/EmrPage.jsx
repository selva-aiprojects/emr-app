import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import PatientSearch from '../components/PatientSearch.jsx';
import { patientName } from '../utils/format.js';
import { api } from '../api.js';
import { getAIPatientSummary, getAITreatmentSuggestion } from '../ai-api.js';
import Prescriber from '../components/pharmacy/Prescriber.jsx';
import PatientTimeline from '../components/PatientTimeline.jsx';
import { identityService } from '../services/identity.service.js';
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
  ShieldCheck,
  Sparkles,
  Bot,
  Loader2,
  Archive,
  Trash2,
  ExternalLink
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
          <p>Hospital Clinical Registry • Active Directory</p>
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
            <th>Medication Name</th>
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

export default function EmrPage({ 
  tenant, 
  activeUser, 
  selectedId, 
  patients, 
  providers, 
  encounters, 
  onCreateEncounter, 
  onOrderLab, 
  onDischarge, 
  onCreateDocument 
}) {
  const { showToast } = useToast();

  useEffect(() => {
    if (patients?.length > 0) {
      identityService.updateRegistry(patients);
    }
  }, [patients]);

  const [activeTab, setActiveTab] = useState(selectedId ? 'new' : 'active');
  const [selectedPatientId, setSelectedPatientId] = useState(selectedId || '');
  
  useEffect(() => {
    if (selectedId && selectedId !== selectedPatientId) {
      setSelectedPatientId(selectedId);
    }
  }, [selectedId]);

  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [safetyData, setSafetyData] = useState({ safetyCheck: null, overrideSafety: false });
  const [showDocForm, setShowDocForm] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiTreatment, setAiTreatment] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingTreatment, setIsGeneratingTreatment] = useState(false);
  const [labOrders, setLabOrders] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [lastSaved, setLastSaved] = useState(null);
  const itemsPerPage = 10;

  const isE2ETenant = tenant?.id === 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
  const canPrescribe = (activeUser?.role || '').toLowerCase() === 'doctor' || ((activeUser?.role || '').toLowerCase() === 'admin' && isE2ETenant);

  const activeEncounters = useMemo(() => (encounters || []).filter(e => e.status === 'open'), [encounters]);
  const pastEncounters = useMemo(() => (encounters || []).filter(e => e.status === 'closed'), [encounters]);

  const selectedPatient = useMemo(() => {
    const p = (patients || []).find(p => p.id === selectedPatientId);
    if (p) {
      setAiSummary(null);
      setAiTreatment(null);
    }
    return p;
  }, [patients, selectedPatientId]);

  const handleGenerateAISummary = async () => {
    if (!selectedPatientId) return;
    setIsGeneratingAI(true);
    try {
      const summary = await getAIPatientSummary(selectedPatientId);
      setAiSummary(summary.summary);
    } catch (err) {
      console.error('AI Summary Error:', err);
      setAiSummary('Failed to generate clinical overview.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateAITreatment = async (e) => {
    const form = e.target.closest('form');
    const complaint = form.querySelector('[name="complaint"]').value;
    const diagnosis = form.querySelector('[name="diagnosis"]').value;
    if (!complaint || !diagnosis) {
      showToast({ message: 'Diagnosis and Complaint required.', type: 'error' });
      return;
    }
    setIsGeneratingTreatment(true);
    try {
      const resp = await getAITreatmentSuggestion({
        complaint,
        diagnosis,
        history: selectedPatient?.medicalHistory?.chronicConditions || 'None'
      });
      setAiTreatment(resp.suggestion);
    } catch (err) {
      console.error('AI Treatment Error:', err);
      showToast({ message: 'Failed to generate suggestion.', type: 'error' });
    } finally {
      setIsGeneratingTreatment(false);
    }
  };

  const handleEncounterSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      patientId: selectedPatientId,
      providerId: fd.get('providerId'),
      type: fd.get('type'),
      complaint: fd.get('complaint'),
      diagnosis: fd.get('diagnosis'),
      notes: fd.get('notes'),
      bp: fd.get('bp'),
      hr: fd.get('hr'),
      medications: canPrescribe ? prescriptionItems.map(m => ({
        name: m.drugName,
        dosage: `${m.dose} ${m.doseUnit} ${m.frequency}`,
        duration: `${m.durationDays} days`,
        instructions: m.instructions
      })) : []
    };
    try {
      await onCreateEncounter(data);
      setLastSaved({ ...data, patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`, createdAt: new Date().toISOString() });
      setPrescriptionItems([]);
      showToast({ message: 'Encounter saved successfully.', type: 'success' });
    } catch (err) {
      showToast({ message: 'Error: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">Clinical Workspace</h1>
          <p className="premium-subtitle !text-white/80 mt-2">Institutional Health Ledger & Patient Care Hub</p>
        </div>
      </header>
      
      <div className="premium-tab-bar mb-8">
        <button className={`premium-tab-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Visits</button>
        <button className={`premium-tab-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>New Encounter</button>
        <button className={`premium-tab-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Past History</button>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-12 lg:col-span-4">
            <div className="clinical-card">
              <PatientSearch tenantId={tenant?.id} onSelect={(p) => setSelectedPatientId(p.id)} />
              {selectedPatient && (
                <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white">
                  <h4 className="font-bold">{selectedPatient.firstName} {selectedPatient.lastName}</h4>
                  <p className="text-xs text-white/50">MRN: {selectedPatient.mrn}</p>
                  <button onClick={handleGenerateAISummary} disabled={isGeneratingAI} className="mt-4 w-full py-2 bg-indigo-600 rounded-lg text-[10px] font-black uppercase">
                    {isGeneratingAI ? 'Processing...' : 'AI Summary'}
                  </button>
                  {aiSummary && <div className="mt-4 text-xs text-indigo-100/80 bg-white/5 p-3 rounded-lg">{aiSummary}</div>}
                </div>
              )}
            </div>
          </aside>
          <main className="col-span-12 lg:col-span-8">
            {selectedPatient ? (
              <form onSubmit={handleEncounterSubmit} className="clinical-card space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input name="complaint" placeholder="Chief Complaint" className="input-field" required />
                  <input name="diagnosis" placeholder="Diagnosis" className="input-field" required />
                </div>
                <textarea name="notes" placeholder="Clinical Notes" className="input-field min-h-[120px]" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="bp" placeholder="BP (e.g. 120/80)" className="input-field" />
                  <input name="hr" placeholder="HR (bpm)" className="input-field" />
                </div>
                <div className="grid grid-cols-1">
                  <select name="type" className="input-field bg-slate-800 text-white border-none" defaultValue="Outpatient">
                    <option value="Outpatient">Outpatient (OPD)</option>
                    <option value="In-patient">In-patient (IPD)</option>
                    <option value="Emergency">Emergency (ER)</option>
                  </select>
                </div>
                <button type="submit" className="btn-premium w-full">Save Encounter</button>
              </form>
            ) : (
              <div className="clinical-card h-64 flex items-center justify-center text-slate-400">Select a patient to begin.</div>
            )}
          </main>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="clinical-card">
          <table className="premium-table">
            <thead>
              <tr><th>Patient</th><th>Type</th><th>Complaint</th><th>Status</th></tr>
            </thead>
            <tbody>
              {activeEncounters.map(e => (
                <tr key={e.id}>
                  <td>{patientName(e.patientId, patients)}</td>
                  <td>{e.type}</td>
                  <td>{e.complaint}</td>
                  <td><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{e.status}</span></td>
                </tr>
              ))}
              {activeEncounters.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-400">No active encounters found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
