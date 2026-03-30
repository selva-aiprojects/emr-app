import { useState, useMemo } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import PatientSearch from '../components/PatientSearch.jsx';
import { patientName } from '../utils/format.js';
import { api } from '../api.js';
import { getAITreatmentSuggestion } from '../ai-api.js';
import Prescriber from '../components/pharmacy/Prescriber.jsx';
import PatientTimeline from '../components/PatientTimeline.jsx';
import { 
  Activity, 
  Plus, 
  User, 
  Stethoscope, 
  FileText, 
  Printer, 
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Bot,
  Loader2,
  Archive,
  Trash2,
  Calendar,
  HeartPulse,
  TrendingUp,
  Download,
  ExternalLink,
  Users,
  Settings,
  Eye,
  Filter,
  BarChart3,
  Package,
  DollarSign,
  Database,
  UserCircle,
  Building2,
  Truck,
  BookOpen,
  Zap,
  Droplet,
  MessageSquare,
  Bell,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  UserCheck,
  UserX,
  CalendarDays,
  Target,
  Award,
  FilePlus,
  Edit,
  Save,
  X,
  Pill
} from 'lucide-react';
import '../styles/critical-care.css';

function printPatientReport(patient, tenant) {
  const w = window.open('', '_blank', 'width=900,height=700');
  const dateStr = new Date().toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  
  const patientName = `${patient.firstName} ${patient.lastName}`;
  const mrn = patient.mrn || 'N/A';
  const age = patient.dob ? `${new Date().getFullYear() - new Date(patient.dob).getFullYear()} years` : 'N/A';
  const gender = patient.gender || 'N/A';
  const contact = `${patient.phone || 'N/A'} • ${patient.email || 'N/A'}`;
  const address = patient.address || 'N/A';
  const bloodGroup = patient.bloodGroup || 'Not specified';
  
  // Treatment plans HTML
  let treatmentPlansHTML = '';
  if (patient.treatmentPlans && patient.treatmentPlans.length > 0) {
    treatmentPlansHTML = patient.treatmentPlans.map((plan, idx) => {
      const planTitle = plan.title || `Treatment Plan ${idx + 1}`;
      const statusIcon = plan.status === 'active' ? '🟢' : 
                         plan.status === 'completed' ? '✅' : 
                         plan.status === 'paused' ? '⏸️' : '⏸️';
      const statusText = plan.status === 'active' ? 'Active' : 
                        plan.status === 'completed' ? 'Completed' : 
                        plan.status === 'paused' ? 'Paused' : 'Inactive';
      const goals = plan.goals && plan.goals.length > 0 ? 
        plan.goals.map(goal => `<li>${goal}</li>`).join('') : 
        '<li>No specific goals defined</li>';
      
      return `
        <div class="treatment-plan">
          <div class="plan-title">
            ${planTitle}
            <div class="plan-status">${statusIcon} ${statusText}</div>
          </div>
          <div class="plan-content">
            <div><strong>Condition:</strong> ${plan.condition || 'N/A'}</div>
            <div><strong>Start Date:</strong> ${plan.startDate || 'N/A'}</div>
            <div><strong>End Date:</strong> ${plan.endDate || 'Ongoing'}</div>
            <div><strong>Provider:</strong> ${plan.providerName || 'N/A'}</div>
            <div><strong>Protocol:</strong> ${plan.protocol || 'Standard'}</div>
            <div><strong>Goals:</strong></div>
            <ul>${goals}</ul>
            <div><strong>Progress:</strong> ${plan.progress || 'Not started'}</div>
            <div><strong>Notes:</strong> ${plan.notes || 'No notes available'}</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    treatmentPlansHTML = '<div class="text-center py-8 text-gray-500 italic">No treatment plans recorded</div>';
  }
  
  // Health metrics HTML
  const bp = patient.latestVitals?.bp || 'Not recorded';
  const hr = patient.latestVitals?.hr || 'Not recorded';
  const temperature = patient.latestVitals?.temperature || 'Not recorded';
  const weight = patient.latestVitals?.weight || 'Not recorded';
  const height = patient.latestVitals?.height || 'Not recorded';
  const bmi = patient.latestVitals?.bmi || 'Not calculated';
  const oxygenSaturation = patient.latestVitals?.oxygenSaturation || 'Not recorded';
  
  // Lab results HTML
  let labResultsHTML = '';
  if (patient.labResults && patient.labResults.length > 0) {
    labResultsHTML = patient.labResults.map(report => {
      const statusIcon = report.status === 'normal' ? '✅ Normal' : 
                         report.status === 'abnormal' ? '⚠️ Abnormal' : 
                         report.status === 'pending' ? '⏳ Pending' : '❓ Not Available';
      return `
        <div class="document-item">
          <div class="document-name">${report.testName}</div>
          <div class="document-date">${new Date(report.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div class="document-status">${statusIcon}</div>
          <div class="text-sm text-gray-600 mt-2">${report.result || 'Results pending'}</div>
        </div>
      `;
    }).join('');
  } else {
    labResultsHTML = '<div class="text-center py-8 text-gray-500 italic">No lab results available</div>';
  }
  
  // Medications HTML
  let medicationsHTML = '';
  if (patient.medications && patient.medications.length > 0) {
    medicationsHTML = patient.medications.map(med => `
      <tr>
        <td>${med.name}</td>
        <td>${med.dosage}</td>
        <td>${med.frequency}</td>
        <td>${med.duration}</td>
        <td>${new Date(med.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td><span class="${med.status === 'active' ? 'text-green-600' : 'text-gray-500'}">${med.status || 'Unknown'}</span></td>
      </tr>
    `).join('');
  } else {
    medicationsHTML = '<tr><td colspan="6" class="text-center text-gray-500 italic">No medications recorded</td></tr>';
  }
  
  // Allergies HTML
  const allergies = patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None recorded';
  const chronicConditions = patient.chronicConditions && patient.chronicConditions.length > 0 ? patient.chronicConditions.join(', ') : 'None recorded';
  const sensitivities = patient.sensitivities && patient.sensitivities.length > 0 ? patient.sensitivities.join(', ') : 'None recorded';
  const familyHistory = patient.familyHistory || 'None recorded';
  
  // Emergency contacts HTML
  const emergencyContact = patient.emergencyContact || 'Not specified';
  const emergencyRelationship = patient.emergencyRelationship || 'Not specified';
  const emergencyPhone = patient.emergencyPhone || patient.phone || 'Not specified';
  
  // Insurance HTML
  const insuranceProvider = patient.insuranceProvider || 'Self-pay';
  const policyNumber = patient.policyNumber || 'N/A';
  const coverageType = patient.coverageType || 'Basic';
  const insuranceValidUntil = patient.insuranceValidUntil || 'Not specified';
  
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Complete Patient Report - ${patientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1F2937; line-height: 1.6; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 4px solid #10B981; padding-bottom: 25px; margin-bottom: 40px; }
        .clinic-info h1 { color: #10B981; margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; }
        .clinic-info p { margin: 4px 0; color: #64748B; font-size: 13px; font-weight: 600; }
        .section { margin: 30px 0; }
        .section-title { color: #1F2937; font-size: 20px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-grid div { padding: 10px; background: #F8F9FA; border-radius: 8px; }
        .info-grid label { font-size: 12px; font-weight: 600; color: #6B7280; display: block; margin-bottom: 5px; }
        .info-grid .value { font-size: 14px; color: #374151; font-weight: 500; }
        .timeline { background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .timeline-item { border-left: 3px solid #E5E7EB; padding-left: 20px; position: relative; }
        .timeline-item::before { content: ''; position: absolute; left: -6px; top: 0; bottom: 0; width: 3px; background: #E5E7EB; }
        .timeline-date { font-size: 12px; color: #6B7280; font-weight: 600; margin-bottom: 5px; }
        .timeline-content { margin-bottom: 15px; }
        .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .vital-item { background: #F0F9FF; padding: 15px; border-radius: 8px; text-align: center; }
        .vital-label { font-size: 11px; color: #6B7280; font-weight: 600; display: block; margin-bottom: 5px; }
        .vital-value { font-size: 16px; font-weight: 700; color: #1F2937; }
        .treatment-plan { background: #F0F9FF; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .plan-title { font-size: 18px; font-weight: 700; color: #1F2937; margin-bottom: 10px; }
        .plan-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #E5E7EB; }
        .plan-status { font-size: 11px; padding: 4px 8px; border-radius: 12px; display: inline-block; }
        .medications-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .medications-table th { text-align: left; padding: 12px; border-bottom: 2px solid #E5E7EB; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 900; }
        .medications-table td { padding: 12px; border-bottom: 1px solid #F0F9F6; font-size: 14px; color: #374151; }
        .documents-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .document-item { background: white; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 10px; }
        .document-name { font-weight: 600; color: #1F2937; }
        .document-date { font-size: 11px; color: #6B7280; }
        .footer { margin-top: 50px; text-align: center; }
        .signature { text-align: center; border-top: 2px solid #1F2937; width: 220px; padding-top: 12px; }
        @media print { body { padding: 0px; } .header { border-bottom-width: 5px; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="clinic-info">
          <h1>${tenant?.name || 'EMR Medical Center'}</h1>
          <p>Hospital Clinical Registry • Complete Patient Records</p>
          <p>Global ID: ${(tenant?.id || 'SYS').slice(0, 8).toUpperCase()}</p>
          <p>Patient Report Generated: ${dateStr}</p>
        </div>
        <div class="text-right">
          <p style="font-size: 14px; margin: 0; font-weight: 900; text-transform: uppercase; color: #1F2937;">Patient ID: ${patient.id?.slice(0, 8).toUpperCase()}</p>
          <p style="font-size: 11px; color:#6B7280; margin: 4px 0; font-weight: 800; text-transform: uppercase;">Report Ref: PAT-${patient.id?.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <!-- Patient Demographics -->
      <div class="section">
        <h2 class="section-title">Patient Demographics</h2>
        <div class="info-grid">
          <div>
            <label>Full Name</label>
            <div class="value">${patientName}</div>
          </div>
          <div>
            <label>Medical Record Number</label>
            <div class="value">${mrn}</div>
          </div>
          <div>
            <label>Date of Birth</label>
            <div class="value">${patient.dob || 'N/A'}</div>
          </div>
          <div>
            <label>Age</label>
            <div class="value">${age}</div>
          </div>
          <div>
            <label>Gender</label>
            <div class="value">${gender}</div>
          </div>
          <div>
            <label>Contact</label>
            <div class="value">${contact}</div>
          </div>
          <div>
            <label>Address</label>
            <div class="value">${address}</div>
          </div>
        </div>
      </div>

      <!-- Treatment Plans -->
      <div class="section">
        <h2 class="section-title">Treatment Plans & Protocols</h2>
        ${treatmentPlansHTML}
      </div>

      <!-- Current Vitals & Health Metrics -->
      <div class="section">
        <h2 class="section-title">Current Health Metrics</h2>
        <div class="vitals-grid">
          <div>
            <label>Blood Pressure</label>
            <div class="vital-value">${bp}</div>
          </div>
          <div>
            <label>Heart Rate</label>
            <div class="vital-value">${hr}</div>
          </div>
          <div>
            <label>Temperature</label>
            <div class="vital-value">${temperature}</div>
          </div>
          <div>
            <label>Weight</label>
            <div class="vital-value">${weight}</div>
          </div>
          <div>
            <label>Height</label>
            <div class="vital-value">${height}</div>
          </div>
          <div>
            <label>BMI</label>
            <div class="vital-value">${bmi}</div>
          </div>
          <div>
            <label>Oxygen Saturation</label>
            <div class="vital-value">${oxygenSaturation}</div>
          </div>
        </div>
      </div>

      <!-- Health Reports & Lab Results -->
      <div class="section">
        <h2 class="section-title">Health Reports & Lab Results</h2>
        ${labResultsHTML}
      </div>

      <!-- Medications History -->
      <div class="section">
        <h2 class="section-title">Medications History</h2>
        <table class="medications-table">
          <thead>
            <tr>
              <th>Medication Name</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Start Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${medicationsHTML}
          </tbody>
        </table>
      </div>

      <!-- Allergies & Sensitivities -->
      <div class="section">
        <h2 class="section-title">Allergies & Sensitivities</h2>
        <div class="info-grid">
          <div>
            <label>Allergies</label>
            <div class="value">${allergies}</div>
          </div>
          <div>
            <label>Chronic Conditions</label>
            <div class="value">${chronicConditions}</div>
          </div>
          <div>
            <label>Sensitivities</label>
            <div class="value">${sensitivities}</div>
          </div>
          <div>
            <label>Family History</label>
            <div class="value">${familyHistory}</div>
          </div>
        </div>
      </div>

      <!-- Emergency Contacts -->
      <div class="section">
        <h2 class="section-title">Emergency Contacts</h2>
        <div class="info-grid">
          <div>
            <label>Primary Contact</label>
            <div class="value">${emergencyContact}</div>
          </div>
          <div>
            <label>Relationship</label>
            <div class="value">${emergencyRelationship}</div>
          </div>
          <div>
            <label>Phone</label>
            <div class="value">${emergencyPhone}</div>
          </div>
        </div>
      </div>

      <!-- Insurance Information -->
      <div class="section">
        <h2 class="section-title">Insurance Information</h2>
        <div class="info-grid">
          <div>
            <label>Insurance Provider</label>
            <div class="value">${insuranceProvider}</div>
          </div>
          <div>
            <label>Policy Number</label>
            <div class="value">${policyNumber}</div>
          </div>
          <div>
            <label>Coverage Type</label>
            <div class="value">${coverageType}</div>
          </div>
          <div>
            <label>Valid Until</label>
            <div class="value">${insuranceValidUntil}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest">Confidential Medical Record</p>
          <p class="text-[10px] font-medium text-slate-700 mt-2">Generated on ${dateStr}</p>
        </div>
        <div class="signature">
          <strong style="font-size: 15px; color: #1F2937; text-transform: uppercase; letter-spacing: 0.02em;">Digital Signature</strong>
          <p style="font-size: 11px; color: #6B7280; font-weight: 800; text-transform: uppercase;">${tenant?.name || 'Medical Center'}</p>
        </div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

export default function EnhancedEmrPage({ tenant, activeUser, patients, providers, encounters, onCreateEncounter, onDischarge, onCreateDocument }) {
  const { showToast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['overview', 'demographics', 'history', 'treatment', 'vitals', 'reports', 'medications', 'allergies', 'insurance']);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    const p = patients.find(p => p.id === selectedPatientId);
    if (p) {
      return {
        ...p,
        treatmentPlans: p.treatmentPlans || [],
        latestVitals: p.latestVitals || {},
        labResults: p.labResults || [],
        medications: p.medications || [],
        allergies: p.allergies || [],
        chronicConditions: p.chronicConditions || [],
        sensitives: p.sensitivities || [],
        familyHistory: p.familyHistory || '',
        emergencyContact: p.emergencyContact || '',
        emergencyRelationship: p.emergencyRelationship || '',
        emergencyPhone: p.emergencyPhone || '',
        insuranceProvider: p.insuranceProvider || '',
        policyNumber: p.policyNumber || '',
        coverageType: p.coverageType || 'Basic',
        insuranceValidUntil: p.insuranceValidUntil || ''
      };
    }
    return p;
  }, [patients, selectedPatientId]);

  const patientHistory = useMemo(() => {
    if (!selectedPatientId) return [];
    return encounters
      .filter(e => e.patientId === selectedPatientId)
      .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
      .map(e => ({
        ...e,
        medications: e.medications || [],
        vitals: e.vitals || {},
        labResults: e.labResults || []
      }));
  }, [encounters, selectedPatientId]);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatientId(patient.id);
    setActiveTab('overview');
    setShowPatientSearch(false);
  };

  const handlePrintReport = () => {
    if (selectedPatient) {
      printPatientReport(selectedPatient, tenant);
    }
  };

  const activeEncounters = useMemo(() => encounters.filter(e => e.status === 'open'), [encounters]);
  const pastEncounters = useMemo(() => encounters.filter(e => e.status === 'closed'), [encounters]);

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Complete Patient History
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            Comprehensive medical records, treatment plans, and health analytics
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowPatientSearch(!showPatientSearch)}
            className="clinical-btn clinical-btn--accent"
          >
            <User className="w-4 h-4" />
            {showPatientSearch ? 'Hide Search' : 'Find Patient'}
          </button>
          {selectedPatient && (
            <button
              onClick={handlePrintReport}
              className="clinical-btn bg-white text-slate-700 border border-slate-200"
            >
              <Printer className="w-4 h-4" />
              Print Complete Report
            </button>
          )}
          <button
            onClick={() => setSelectedPatientId('')}
            className="clinical-btn bg-white text-slate-700 border border-slate-200"
          >
            <Users className="w-4 h-4" />
            Back to Patient List
          </button>
        </div>
      </header>

      {/* Patient Search Overlay */}
      {showPatientSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-900">Find Patient</h3>
              <button
                onClick={() => setShowPatientSearch(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-lg bg-white hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PatientSearch 
              tenantId={tenant?.id}
              onSelect={handlePatientSelect}
              patients={patients}
            />
          </div>
        </div>
      )}

      {/* Patient Overview */}
      {selectedPatient ? (
        <div className="grid grid-cols-12 gap-6 p-6">
          {/* Patient Summary Card */}
          <div className="col-span-12">
            <div className="clinical-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--clinical-secondary)]/20 text-white flex items-center justify-center">
                    {(selectedPatient.firstName || 'P')[0]}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">
                      MRN: {selectedPatient.mrn || 'PENDING'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSection('demographics')}
                  className="text-white/70 hover:text-white"
                >
                  {expandedSections.includes('demographics') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              <div className="text-white/30 font-bold text-lg">
                Patient Overview
              </div>
            </div>
            {expandedSections.includes('demographics') && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Full Name</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Medical Record Number</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.mrn || 'PENDING'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Date of Birth</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.dob || 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Age</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.dob ? `${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} years` : 'Age not calculated'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Gender</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.gender || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Contact</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.phone || 'Not specified'} • {selectedPatient.email || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Address</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.address || 'Not specified'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Blood Group</label>
                  <div className="text-base font-medium text-slate-900">
                    {selectedPatient.bloodGroup || 'Not specified'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="col-span-12">
            <div className="clinical-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--clinical-secondary)]/20 text-white flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white/30 font-bold text-lg">
                      Quick Statistics
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSection('history')}
                  className="text-white/70 hover:text-white"
                >
                  {expandedSections.includes('history') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              <div className="text-white/30 font-bold text-lg">
                Clinical History Overview
              </div>
            </div>
            {expandedSections.includes('history') && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-[var(--clinical-secondary)]/10 rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">Total Encounters</div>
                    <div className="text-4xl font-bold text-white">{patientHistory.length}</div>
                  </div>
                  <div className="text-center p-4 bg-[var(--clinical-secondary)]/10 rounded-xl border border-white/10">
                    <div className="text-2xl font-bold text-white mb-2">Active Treatments</div>
                    <div className="text-4xl font-bold text-white">{activeEncounters.length}</div>
                  </div>
                  <div className="text-center p-4 bg-[var(--clinical-secondary)]/10 rounded-xl border border-white/10">
                    <div className="text-2xl font-bold text-white mb-2">Completed Encounters</div>
                    <div className="text-4xl font-bold text-white">{pastEncounters.length}</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-white/80 mt-4">
                  <div className="text-sm text-white/70">Last Visit: {patientHistory.length > 0 ? new Date(patientHistory[0].createdAt || patientHistory[0].created_at).toLocaleDateString('en-IN') : 'No visits recorded'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Health Metrics */}
          <div className="col-span-12">
            <div className="clinical-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--clinical-secondary)]/20 text-white flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white/30 font-bold text-lg">
                      Health Metrics
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSection('vitals')}
                  className="text-white/70 hover:text-white"
                >
                  {expandedSections.includes('vitals') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              <div className="text-white/30 font-bold text-lg">
                Current Vitals & Health Analytics
              </div>
            </div>
            {expandedSections.includes('vitals') && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Last Recorded</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.date ? new Date(selectedPatient.latestVitals.date).toLocaleDateString('en-IN') : 'No vitals recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Blood Pressure</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.bp || 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Heart Rate</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.hr || 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Temperature</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.temperature ? `${selectedPatient.latestVitals.temperature}°C` : 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Weight</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.weight ? `${selectedPatient.latestVitals.weight} kg` : 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Height</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.height ? `${selectedPatient.latestVitals.height} cm` : 'Not recorded'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">BMI</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.bmi || 'Not calculated'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Oxygen Saturation</label>
                    <div className="text-base font-medium text-slate-900">
                      {selectedPatient.latestVitals?.oxygenSaturation ? `${selectedPatient.latestVitals.oxygenSaturation}%` : 'Not recorded'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="col-span-12">
            <div className="clinical-card">
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setActiveTab('new')}
                  className={`clinical-btn ${activeTab === 'new' ? 'bg-[var(--clinical-secondary)] text-white' : 'bg-white text-slate-700'} hover:bg-[var(--clinical-secondary)] hover:text-white border-slate-200`}
                >
                  <Plus className="w-4 h-4" />
                  New Assessment
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`clinical-btn ${activeTab === 'timeline' ? 'bg-[var(--clinical-secondary)] text-white' : 'bg-white text-slate-700'} hover:bg-[var(--clinical-secondary)] hover:text-white border-slate-200`}
                >
                  <Clock className="w-4 h-4" />
                  Timeline View
                </button>
                <button
                  onClick={() => {
                    if (selectedPatient) {
                      window.location.href = `/emr?patient=${selectedPatient.id}`;
                    }
                  }}
                  className={`clinical-btn bg-white text-slate-700 hover:bg-slate-50 border-slate-200`}
                >
                  Open Full EMR
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/80 rounded-xl border-2 border-dashed border-slate-300 p-8">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="mt-4 text-slate-500">Select a patient to view their complete medical history</p>
          </div>
        </div>
      )}
    </div>
  );
}
