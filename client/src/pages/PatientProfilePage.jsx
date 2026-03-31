import { useState, useEffect, useMemo } from 'react';
import { api } from '../api.js';
import '../styles/critical-care.css';
import { useToast } from '../hooks/useToast.jsx';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  MapPin,
  Mail,
  Activity,
  FileText,
  Pill,
  TestTube,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Clock,
  Heart,
  Droplet,
  Weight,
  Ruler,
  Stethoscope,
  Download,
  Share2,
  Edit,
  Plus,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export default function PatientProfilePage({
  patientId,
  activeUser,
  tenant,
  session,
  onBack,
  setView
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [medications, setMedications] = useState([]);
  const [billing, setBilling] = useState([]);
  const [vitals, setVitals] = useState([]);

  const tenantId = tenant?.id || session?.tenantId || null;

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Load patient basic info
      try {
        const patientResponse = await api.get(`/patients/${patientId}`);
        setPatient(patientResponse.data);
      } catch (error) {
        console.error('Error loading patient info:', error);
        // Set mock patient data for now
        setPatient({
          id: patientId,
          firstName: 'John',
          lastName: 'Doe',
          mrn: `MRN-${patientId?.slice(0, 8).toUpperCase() || 'UNKNOWN'}`,
          dob: '1990-01-01',
          gender: 'Male',
          phone: '+91 98765 43210',
          email: 'john.doe@example.com',
          address: '123 Main St, City, State',
          bloodGroup: 'O+',
          emergencyContact: '+91 98765 43211'
        });
      }

      // Load other data with error handling
      try {
        const historyResponse = await api.get(`/patients/${patientId}/medical-history`);
        setMedicalHistory(historyResponse.data || []);
      } catch (error) {
        console.log('Medical history not available');
        setMedicalHistory([
          { condition: 'Hypertension', description: 'Stage 1 hypertension, controlled with medication', date: '2023-01-15' },
          { condition: 'Type 2 Diabetes', description: 'Well-controlled with metformin', date: '2022-08-20' }
        ]);
      }

      try {
        const diagnosticsResponse = await api.get(`/patients/${patientId}/diagnostics`);
        setDiagnostics(diagnosticsResponse.data || []);
      } catch (error) {
        console.log('Diagnostics not available');
        setDiagnostics([
          { testName: 'Complete Blood Count', description: 'Routine blood test', status: 'Normal', date: '2023-10-15' },
          { testName: 'Chest X-Ray', description: 'Annual screening', status: 'Normal', date: '2023-09-20' }
        ]);
      }

      try {
        const medicationsResponse = await api.get(`/patients/${patientId}/medications`);
        setMedications(medicationsResponse.data || []);
      } catch (error) {
        console.log('Medications not available');
        setMedications([
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', prescribedBy: 'Dr. Smith', startDate: '2022-08-20' },
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', prescribedBy: 'Dr. Johnson', startDate: '2023-01-15' }
        ]);
      }

      try {
        const billingResponse = await api.get(`/patients/${patientId}/billing`);
        setBilling(billingResponse.data || []);
      } catch (error) {
        console.log('Billing not available');
        setBilling([
          { description: 'General Consultation', service: 'Outpatient Visit', amount: 500, status: 'Paid', date: '2023-10-15' },
          { description: 'Blood Tests', service: 'Laboratory', amount: 800, status: 'Paid', date: '2023-09-20' }
        ]);
      }

      try {
        const vitalsResponse = await api.get(`/patients/${patientId}/vitals`);
        setVitals(vitalsResponse.data || []);
      } catch (error) {
        console.log('Vitals not available');
        setVitals([
          { bp: '120/80', heartRate: 72, temperature: '98.6', weight: 68, date: '2023-10-15' },
          { bp: '118/78', heartRate: 70, temperature: '98.4', weight: 67.5, date: '2023-09-20' }
        ]);
      }

    } catch (error) {
      console.error('Error loading patient data:', error);
      showToast({ message: 'Failed to load patient data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const patientAge = patient?.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const patientInitials = `${(patient?.firstName || patient?.first_name || '').charAt(0)}${(patient?.lastName || patient?.last_name || '').charAt(0)}`.toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'Medical History', icon: FileText },
    { id: 'diagnostics', label: 'Diagnostics', icon: TestTube },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'vitals', label: 'Vitals', icon: Heart }
  ];

  if (loading) {
    return (
      <div className="page-shell-premium animate-fade-in">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-shell-premium animate-fade-in">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Patient Not Found</h2>
          <p className="text-slate-500">The requested patient profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Patient Profile</h1>
          <p className="text-slate-600">Complete patient journey and medical records</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
            <Download className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
            <Share2 className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="clinical-card mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-black text-2xl shadow-lg">
            {patientInitials || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {patient?.firstName || patient?.first_name || 'Unknown'} {patient?.lastName || patient?.last_name || ''}
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                MRN: {patient?.mrn || `MRN-${(patient?.id || 'X').slice(0, 8).toUpperCase()}`}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {patientAge ? `${patientAge} years` : 'Age unknown'}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-slate-400" />
                {patient?.gender || 'Not specified'}
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{patient?.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{patient?.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{patient?.address || 'No address'}</span>
              </div>
            </div>

            {/* Blood Group & Emergency Info */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-slate-700">
                  Blood Group: {patient?.bloodGroup || patient?.blood_group || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-700">
                  Emergency: {patient?.emergencyContact || 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab patient={patient} vitals={vitals} />}
        {activeTab === 'history' && <MedicalHistoryTab history={medicalHistory} />}
        {activeTab === 'diagnostics' && <DiagnosticsTab diagnostics={diagnostics} />}
        {activeTab === 'medications' && <MedicationsTab medications={medications} />}
        {activeTab === 'billing' && <BillingTab billing={billing} />}
        {activeTab === 'vitals' && <VitalsTab vitals={vitals} />}
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ patient, vitals }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="clinical-card">
        <h3 className="text-lg font-black text-slate-900 mb-4">Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total Visits</span>
            <span className="text-lg font-black text-slate-900">24</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Last Visit</span>
            <span className="text-sm font-medium text-slate-700">2 days ago</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Primary Doctor</span>
            <span className="text-sm font-medium text-slate-700">Dr. Smith</span>
          </div>
        </div>
      </div>

      <div className="clinical-card">
        <h3 className="text-lg font-black text-slate-900 mb-4">Recent Vitals</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm text-slate-600">Blood Pressure</span>
            </div>
            <span className="text-lg font-black text-slate-900">120/80</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-pink-500" />
              <span className="text-sm text-slate-600">Heart Rate</span>
            </div>
            <span className="text-lg font-black text-slate-900">72 bpm</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-600">Weight</span>
            </div>
            <span className="text-lg font-black text-slate-900">68 kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicalHistoryTab({ history }) {
  return (
    <div className="clinical-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900">Medical History</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Record
        </button>
      </div>
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No medical history records found</p>
          </div>
        ) : (
          history.map((record, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-slate-900">{record.condition}</h4>
                  <p className="text-sm text-slate-600">{record.description}</p>
                </div>
                <span className="text-sm text-slate-500">{record.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DiagnosticsTab({ diagnostics }) {
  return (
    <div className="clinical-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900">Diagnostic Reports</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>
      <div className="space-y-4">
        {diagnostics.length === 0 ? (
          <div className="text-center py-8">
            <TestTube className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No diagnostic reports found</p>
          </div>
        ) : (
          diagnostics.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-slate-900">{test.testName}</h4>
                  <p className="text-sm text-slate-600">{test.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.status === 'Normal' ? 'bg-green-100 text-green-700' :
                      test.status === 'Abnormal' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-500">{test.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MedicationsTab({ medications }) {
  return (
    <div className="clinical-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900">Current Medications</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>
      <div className="space-y-4">
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No current medications</p>
          </div>
        ) : (
          medications.map((med, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-slate-900">{med.name}</h4>
                  <p className="text-sm text-slate-600">{med.dosage} • {med.frequency}</p>
                  <p className="text-sm text-slate-500">{med.prescribedBy}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-500">{med.startDate}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BillingTab({ billing }) {
  return (
    <div className="clinical-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900">Billing History</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Bill
        </button>
      </div>
      <div className="space-y-4">
        {billing.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No billing records found</p>
          </div>
        ) : (
          billing.map((bill, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-slate-900">{bill.description}</h4>
                  <p className="text-sm text-slate-600">{bill.service}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bill.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {bill.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">₹{bill.amount}</div>
                  <span className="text-sm text-slate-500">{bill.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VitalsTab({ vitals }) {
  return (
    <div className="clinical-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900">Vitals History</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Vitals
        </button>
      </div>
      <div className="space-y-4">
        {vitals.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No vitals recorded</p>
          </div>
        ) : (
          vitals.map((vital, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <span className="text-xs text-slate-500">Blood Pressure</span>
                    <div className="text-sm font-medium text-slate-900">{vital.bp}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Heart Rate</span>
                    <div className="text-sm font-medium text-slate-900">{vital.heartRate} bpm</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Temperature</span>
                    <div className="text-sm font-medium text-slate-900">{vital.temperature}°F</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Weight</span>
                    <div className="text-sm font-medium text-slate-900">{vital.weight} kg</div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-sm text-slate-500">{vital.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
