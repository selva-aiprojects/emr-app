import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { identityService } from '../services/identity.service.js';
import PatientPicker from '../components/PatientPicker.jsx';
import EmrDashboard from '../components/emr/EmrDashboard.jsx';
import NewEncounterPage from '../components/emr/NewEncounterPage.jsx';
import EncounterListPage from '../components/emr/EncounterListPage.jsx';
import PatientDetailPage from '../components/emr/PatientDetailPage.jsx';
import EncounterDetailPage from '../components/emr/EncounterDetailPage.jsx';
import {
  getAIPatientSummary,
  getAITreatmentSuggestion,
} from '../ai-api.js';
import '../styles/critical-care.css';

const INITIAL_ENCOUNTER = {
  type: 'Out-patient',
  priority: 'Routine',
  chiefComplaint: '',
  diagnosis: '',
  notes: '',
  vitals: {
    bp: { systolic: '', diastolic: '' },
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSat: '',
    respiratoryRate: '',
  },
  assessment: '',
  plan: '',
  medications: [],
  labs: [],
  imaging: [],
  procedures: [],
};

export const EMR_WORKFLOWS = {
  DASHBOARD: 'dashboard',
  NEW_ENCOUNTER: 'new-encounter',
  ENCOUNTER_LIST: 'encounter-list',
  PATIENT_DETAIL: 'patient-detail',
  ENCOUNTER_DETAIL: 'encounter-detail',
};

/**
 * Pure EMR Page - Clinical Workflow Only
 * No superadmin functionality, only patient care operations
 */
export default function EmrOnlyPage({
  tenant,
  activeUser,
  patients,
  providers,
  encounters,
  onCreateEncounter,
  setView,
  selectedId, // Prop from App.jsx
  initialWorkflow = 'dashboard', // Prop from App.jsx
  onWorkflowChange, // Prop from App.jsx
}) {
  const { showToast } = useToast();

  const tier = (tenant?.subscription_tier || tenant?.subscriptionTier || 'free').toLowerCase();
  
  // Clinical permissions: (Tier Allowed) && (Role Allowed)
  const isClinical = (activeUser?.role || '').toLowerCase() === 'doctor' || (activeUser?.role || '').toLowerCase() === 'admin';
  const canInpatient = isClinical && (tier === 'basic' || tier === 'professional' || tier === 'enterprise');
  const canPrescribe = isClinical && tier === 'enterprise';
  const canOrderLabs = isClinical;
  const canAdmit = canInpatient;

  const [activeWorkflow, setActiveWorkflow] = useState(initialWorkflow);
  
  // Update internal workflow when prop changes (from sidebar)
  useEffect(() => {
    if (initialWorkflow && initialWorkflow !== activeWorkflow) {
      setActiveWorkflow(initialWorkflow);
    }
  }, [initialWorkflow]);

  // Notify parent when workflow changes internally
  const handleWorkflowChangeInternal = useCallback((newWorkflow) => {
    setActiveWorkflow(newWorkflow);
    onWorkflowChange?.(newWorkflow);
  }, [onWorkflowChange]);

  const [selectedPatient, setSelectedPatient] = useState(() => {
    if (selectedId) {
      return (patients || []).find(p => String(p.id) === String(selectedId)) || null;
    }
    return null;
  });
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [encounterData, setEncounterData] = useState(INITIAL_ENCOUNTER);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiTreatment, setAiTreatment] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingTreatment, setIsGeneratingTreatment] = useState(false);
  const [isCreatingEncounter, setIsCreatingEncounter] = useState(false);

  // Sync patient from global context if it changes
  useEffect(() => {
    if (selectedId && (!selectedPatient || selectedPatient.id !== selectedId)) {
      const p = (patients || []).find(x => String(x.id) === String(selectedId));
      if (p) setSelectedPatient(p);
    }
  }, [selectedId, patients]);

  // ── Sidebar → EMR workflow bridge ──────────────────────────────
  // The AppLayout sidebar dispatches 'emrWorkflowChange' CustomEvents
  // when the user clicks EMR sub-navigation items (New Encounter, etc.).
  // This listener keeps the internal workflow state in sync.
  useEffect(() => {
    const handleWorkflowChange = (e) => {
      const target = e.detail;
      if (target && Object.values(EMR_WORKFLOWS).includes(target)) {
        handleWorkflowChangeInternal(target);
      }
    };
    window.addEventListener('emrWorkflowChange', handleWorkflowChange);
    return () => window.removeEventListener('emrWorkflowChange', handleWorkflowChange);
  }, []);

  // Keep identity service in sync
  useEffect(() => {
    if (patients?.length) {
      identityService.updateRegistry(patients);
    }
  }, [patients]);

  // Patient statistics
  const patientStats = useMemo(() => {
    if (!patients?.length) {
      return {
        total: 0,
        active: 0,
        recent: 0,
        totalEncounters: 0,
        openEncounters: 0,
      };
    }

    const activePatients = patients.filter((p) => {
      const patientEncounters = encounters.filter((e) => e.patientId === p.id);
      return patientEncounters.some(
        (e) => e.status === 'open' || e.status === 'active',
      );
    });

    const recentPatients = patients.filter((p) => {
      const patientEncounters = encounters.filter((e) => e.patientId === p.id);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      return patientEncounters.some((e) => new Date(e.createdAt) > recentDate);
    });

    return {
      total: patients.length,
      active: activePatients.length,
      recent: recentPatients.length,
      totalEncounters: encounters.length,
      openEncounters: encounters.filter(
        (e) => e.status === 'open' || e.status === 'active',
      ).length,
    };
  }, [patients, encounters]);

  const resetEncounterForm = useCallback(
    () => setEncounterData(INITIAL_ENCOUNTER),
    [],
  );

  // Patient selection with enhanced search
  const handlePatientSelect = useCallback((patient) => {
    setSelectedPatient(patient);
    setActivePatientId?.(patient.id);
    setSelectedEncounter(null);
    resetEncounterForm();
    setShowPatientPicker(false);
    handleWorkflowChangeInternal(EMR_WORKFLOWS.PATIENT_DETAIL);
    
    const name = `${patient.firstName || patient.first_name || ''} ${patient.lastName || patient.last_name || ''}`.trim();
    showToast({
      title: 'Patient Selected',
      message: `${name || 'Patient'} selected`,
      type: 'success'
    });
  }, [showToast, resetEncounterForm]);

  // Patient search functionality
  const handlePatientSearch = useCallback(() => {
    setShowPatientPicker(true);
  }, []);

  // Create new encounter — reads from internal state (encounterData) like EmrPage
  const handleCreateEncounter = useCallback(async () => {
    if (!selectedPatient || !encounterData.chiefComplaint) {
      showToast({
        message: 'Patient and chief complaint are required',
        type: 'error',
      });
      return;
    }

    setIsCreatingEncounter(true);
    try {
      const encounterPayload = {
        patientId: selectedPatient.id,
        providerId: activeUser?.id || providers[0]?.id,
        type: encounterData.type,
        priority: encounterData.priority,
        complaint: encounterData.chiefComplaint,
        diagnosis: encounterData.diagnosis,
        assessment: encounterData.assessment,
        plan: encounterData.plan,
        notes: encounterData.notes,
        vitals: encounterData.vitals,
        bp: (encounterData.vitals?.bp?.systolic && encounterData.vitals?.bp?.diastolic) ? `${encounterData.vitals.bp.systolic}/${encounterData.vitals.bp.diastolic}` : '',
        hr: encounterData.vitals?.heartRate || '',
        temperature: encounterData.vitals?.temperature || '',
        oxygen_saturation: encounterData.vitals?.oxygenSat || '',
        medications: encounterData.medications,
        pharmacyItems: (encounterData.medications || []).map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        })),
        labs: encounterData.labs,
        imaging: encounterData.imaging,
        procedures: encounterData.procedures,
        status: 'open',
      };

      const newEncounter = await onCreateEncounter(encounterPayload);
      if (newEncounter) {
        setSelectedEncounter(newEncounter);
        resetEncounterForm();
        setActiveWorkflow(EMR_WORKFLOWS.ENCOUNTER_DETAIL);
        showToast({
          message: 'Encounter created successfully',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Create encounter failed:', error);
      showToast({
        message: 'Failed to create encounter',
        type: 'error'
      });
    } finally {
      setIsCreatingEncounter(false);
    }
  }, [selectedPatient, encounterData, activeUser, providers, onCreateEncounter, showToast, resetEncounterForm]);

  // AI summary generation
  const handleGenerateAISummary = useCallback(async (patientId) => {
    setIsGeneratingAI(true);
    try {
      const summaryData = await getAIPatientSummary(patientId);
      setAiSummary(summaryData.summary);
      
      showToast({
        title: 'AI Summary Generated',
        message: 'Patient summary created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('AI summary failed:', error);
      showToast({
        title: 'AI Error',
        message: 'Failed to generate AI summary',
        type: 'error'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [showToast]);

  // AI treatment suggestions
  const handleGenerateAITreatment = useCallback(async (patientId, symptoms) => {
    setIsGeneratingTreatment(true);
    try {
      const treatment = await getAITreatmentSuggestion({
        patientId,
        complaint: symptoms,
        diagnosis: encounterData.diagnosis,
        history: selectedPatient?.medicalHistory || ''
      });
      setAiTreatment(treatment.suggestion);
      
      showToast({
        title: 'AI Treatment Suggestion',
        message: 'Treatment suggestions generated',
        type: 'success'
      });
    } catch (error) {
      console.error('AI treatment failed:', error);
      showToast({
        title: 'AI Error',
        message: 'Failed to generate treatment suggestions',
        type: 'error'
      });
    } finally {
      setIsGeneratingTreatment(false);
    }
  }, [showToast, encounterData.diagnosis, selectedPatient]);

  // Encounter row click — navigate to detail
  const handleEncounterRowClick = useCallback((encounter) => {
    setSelectedEncounter(encounter);
    const p = (patients || []).find(x => String(x.id) === String(encounter.patientId || encounter.patient_id));
    if (p) setSelectedPatient(p);
    handleWorkflowChangeInternal(EMR_WORKFLOWS.ENCOUNTER_DETAIL);
  }, [patients, handleWorkflowChangeInternal]);

  // Only render for clinical roles
  const isClinicalUser = ['doctor', 'nurse', 'admin', 'receptionist'].includes(
    (activeUser?.role || '').toLowerCase(),
  );


  if (!isClinicalUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to clinical staff.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Patient Picker */}
      <PatientPicker
        tenantId={tenant?.id}
        patients={patients}
        encounters={encounters}
        onSelect={handlePatientSelect}
        onRegister={handleCreateEncounter}
        isOpen={showPatientPicker}
        onClose={() => setShowPatientPicker(false)}
      />

      {/* ── Workflow Views ────────────────────────────────────── */}
      {activeWorkflow === EMR_WORKFLOWS.DASHBOARD && (
        <EmrDashboard
          tenant={tenant}
          patients={patients}
          encounters={encounters}
          patientStats={patientStats}
          onNewEncounter={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.NEW_ENCOUNTER)}
          onFindPatient={() => setShowPatientPicker(true)}
          onHistory={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.ENCOUNTER_LIST)}
          onRecentEncounterClick={handleEncounterRowClick}
        />
      )}

      {activeWorkflow === EMR_WORKFLOWS.NEW_ENCOUNTER && (
        <NewEncounterPage
          onBack={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.DASHBOARD)}
          selectedPatient={selectedPatient}
          onOpenPatientPicker={() => setShowPatientPicker(true)}
          onClearPatient={() => {
            setSelectedPatient(null);
            resetEncounterForm();
          }}
          patients={patients}
          encounterData={encounterData}
          setEncounterData={setEncounterData}
          onCreateEncounter={handleCreateEncounter}
          isCreating={isCreatingEncounter}
          canInpatient={canInpatient}
          canPrescribe={canPrescribe}
          aiSummary={aiSummary}
          aiTreatment={aiTreatment}
          isGeneratingAI={isGeneratingAI}
          isGeneratingTreatment={isGeneratingTreatment}
          onGenerateAISummary={handleGenerateAISummary}
          onGenerateAITreatment={handleGenerateAITreatment}
        />
      )}

      {activeWorkflow === EMR_WORKFLOWS.ENCOUNTER_LIST && (
        <EncounterListPage
          encounters={encounters}
          patients={patients}
          onBack={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.DASHBOARD)}
          onSelectEncounter={handleEncounterRowClick}
        />
      )}

      {activeWorkflow === EMR_WORKFLOWS.PATIENT_DETAIL && selectedPatient && (
        <PatientDetailPage
          selectedPatient={selectedPatient}
          onBack={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.DASHBOARD)}
          onNewEncounter={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.NEW_ENCOUNTER)}
          onHistory={() => handleWorkflowChangeInternal(EMR_WORKFLOWS.ENCOUNTER_LIST)}
        />
      )}

      {activeWorkflow === EMR_WORKFLOWS.ENCOUNTER_DETAIL &&
        selectedEncounter &&
        selectedPatient && (
          <EncounterDetailPage
            onBack={() => setActiveWorkflow(EMR_WORKFLOWS.ENCOUNTER_LIST)}
            selectedPatient={selectedPatient}
            selectedEncounter={selectedEncounter}
            canPrescribe={canPrescribe}
            canOrderLabs={true}
            canAdmit={canInpatient}
            onPrescribe={() => {
              if (setView) {
                setView('pharmacy');
              } else {
                showToast({ message: 'Opening prescription module...', type: 'info' });
              }
            }}
            onOrderLabs={() => {
              if (typeof setView === 'function') setView('lab');
            }}
            onAdmit={() => {
              if (typeof setView === 'function') setView('inpatient');
            }}
          />
        )}
    </>
  );
}
