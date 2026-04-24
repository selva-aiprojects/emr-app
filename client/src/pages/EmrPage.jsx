// EmrPageShell.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { identityService } from '../services/identity.service.js';
import PatientPickerOverlay from '../components/emr/PatientPickerOverlay.jsx';
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
  type: 'outpatient',
  priority: 'routine',
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

export const WORKFLOWS = {
  DASHBOARD: 'dashboard',
  NEW_ENCOUNTER: 'new-encounter',
  ENCOUNTER_LIST: 'encounter-list',
  PATIENT_DETAIL: 'patient-detail',
  ENCOUNTER_DETAIL: 'encounter-detail',
};

function EmrPageShell({
  tenant,
  activeUser,
  patients,
  providers,
  encounters,
  onCreateEncounter,
}) {
  const { showToast } = useToast();

  const [activeWorkflow, setActiveWorkflow] = useState(WORKFLOWS.DASHBOARD);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [encounterData, setEncounterData] = useState(INITIAL_ENCOUNTER);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiTreatment, setAiTreatment] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingTreatment, setIsGeneratingTreatment] = useState(false);
  const [isCreatingEncounter, setIsCreatingEncounter] = useState(false);

  // permissions
  const canPrescribe =
    activeUser?.role === 'doctor' || activeUser?.role === 'admin';
  const canOrderLabs = canPrescribe;
  const canAdmit = canPrescribe;

  // keep identity service in sync
  useEffect(() => {
    if (patients?.length) {
      identityService.updateRegistry(patients);
    }
  }, [patients]);

  // centralized stats
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
      return patientEncounters.some((e) => {
        const encounterDate = new Date(e.createdAt || e.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return encounterDate > thirtyDaysAgo;
      });
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

  const handlePatientSelect = useCallback((patient) => {
    setSelectedPatient(patient);
    setSelectedEncounter(null);
    resetEncounterForm();
    setActiveWorkflow(WORKFLOWS.PATIENT_DETAIL);
  }, [resetEncounterForm]);

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
        chiefComplaint: encounterData.chiefComplaint,
        diagnosis: encounterData.diagnosis,
        assessment: encounterData.assessment,
        plan: encounterData.plan,
        notes: encounterData.notes,
        vitals: encounterData.vitals,
        medications: encounterData.medications,
        labs: encounterData.labs,
        imaging: encounterData.imaging,
        procedures: encounterData.procedures,
        status: 'open',
      };

      const newEncounter = await onCreateEncounter(encounterPayload);
      if (newEncounter) {
        setSelectedEncounter(newEncounter);
        resetEncounterForm();
        setActiveWorkflow(WORKFLOWS.ENCOUNTER_DETAIL);
        showToast({
          message: 'Encounter created successfully',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to create encounter:', error);
      showToast({ message: 'Failed to create encounter', type: 'error' });
    } finally {
      setIsCreatingEncounter(false);
    }
  }, [
    selectedPatient,
    encounterData,
    activeUser,
    providers,
    onCreateEncounter,
    showToast,
    resetEncounterForm,
  ]);

  const handleGenerateAISummary = useCallback(async () => {
    if (!selectedPatient) return;

    setIsGeneratingAI(true);
    setAiSummary(null);
    try {
      const summary = await getAIPatientSummary(selectedPatient.id);
      setAiSummary(summary);
    } catch (error) {
      console.error('AI Summary Error:', error);
      setAiSummary(
        'Failed to generate clinical overview. AI Assistant failed to respond.',
      );
    } finally {
      setIsGeneratingAI(false);
    }
  }, [selectedPatient]);

  const handleGenerateAITreatment = useCallback(async () => {
    if (!encounterData.chiefComplaint || !encounterData.diagnosis) {
      showToast({
        message:
          'Chief complaint and diagnosis are required for AI suggestions',
        type: 'error',
      });
      return;
    }

    setIsGeneratingTreatment(true);
    setAiTreatment(null);
    try {
      const response = await getAITreatmentSuggestion({
        complaint: encounterData.chiefComplaint,
        diagnosis: encounterData.diagnosis,
        history:
          selectedPatient?.medicalHistory?.chronicConditions || 'None',
      });
      setAiTreatment(response.suggestion);
    } catch (error) {
      console.error('AI Treatment Error:', error);
      showToast({
        message: 'Failed to generate AI treatment suggestion',
        type: 'error',
      });
    } finally {
      setIsGeneratingTreatment(false);
    }
  }, [encounterData, selectedPatient, showToast]);

  const handleEncounterRowClick = useCallback(
    (encounter) => {
      const patient = patients.find((p) => p.id === encounter.patientId);
      setSelectedPatient(patient || null);
      setSelectedEncounter(encounter);
      setActiveWorkflow(WORKFLOWS.ENCOUNTER_DETAIL);
    },
    [patients],
  );

  return (
    <>
      {activeWorkflow === WORKFLOWS.DASHBOARD && (
        <EmrDashboard
          tenant={tenant}
          patients={patients}
          encounters={encounters}
          patientStats={patientStats}
          onNewEncounter={() => setActiveWorkflow(WORKFLOWS.NEW_ENCOUNTER)}
          onFindPatient={() => setShowPatientPicker(true)}
          onHistory={() => setActiveWorkflow(WORKFLOWS.ENCOUNTER_LIST)}
          onRecentEncounterClick={handleEncounterRowClick}
        />
      )}

      {activeWorkflow === WORKFLOWS.NEW_ENCOUNTER && (
        <NewEncounterPage
          tenant={tenant}
          selectedPatient={selectedPatient}
          encounterData={encounterData}
          setEncounterData={setEncounterData}
          onBack={() => setActiveWorkflow(WORKFLOWS.DASHBOARD)}
          onOpenPatientPicker={() => setShowPatientPicker(true)}
          onClearPatient={() => setSelectedPatient(null)}
          onCreateEncounter={handleCreateEncounter}
          isCreatingEncounter={isCreatingEncounter}
          aiSummary={aiSummary}
          aiTreatment={aiTreatment}
          isGeneratingAI={isGeneratingAI}
          isGeneratingTreatment={isGeneratingTreatment}
          onGenerateAISummary={handleGenerateAISummary}
          onGenerateAITreatment={handleGenerateAITreatment}
        />
      )}

      {activeWorkflow === WORKFLOWS.ENCOUNTER_LIST && (
        <EncounterListPage
          encounters={encounters}
          patients={patients}
          onBack={() => setActiveWorkflow(WORKFLOWS.DASHBOARD)}
          onSelectEncounter={handleEncounterRowClick}
        />
      )}

      {activeWorkflow === WORKFLOWS.PATIENT_DETAIL && selectedPatient && (
        <PatientDetailPage
          selectedPatient={selectedPatient}
          onBack={() => setActiveWorkflow(WORKFLOWS.DASHBOARD)}
          onNewEncounter={() => setActiveWorkflow(WORKFLOWS.NEW_ENCOUNTER)}
          onHistory={() => setActiveWorkflow(WORKFLOWS.ENCOUNTER_LIST)}
        />
      )}

      {activeWorkflow === WORKFLOWS.ENCOUNTER_DETAIL &&
        selectedEncounter &&
        selectedPatient && (
          <EncounterDetailPage
            tenant={tenant}
            selectedPatient={selectedPatient}
            selectedEncounter={selectedEncounter}
            onBack={() => setActiveWorkflow(WORKFLOWS.DASHBOARD)}
            canPrescribe={canPrescribe}
            canOrderLabs={canOrderLabs}
            canAdmit={canAdmit}
          />
        )}

      <PatientPickerOverlay
        open={showPatientPicker}
        onClose={() => setShowPatientPicker(false)}
        tenant={tenant}
        patients={patients}
        encounters={encounters}
        onSelect={handlePatientSelect}
      />
    </>
  );
}

export default EmrPageShell;
