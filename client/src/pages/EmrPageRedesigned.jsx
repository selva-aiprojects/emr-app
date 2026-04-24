import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { identityService } from '../services/identity.service.js';
import { superadminService } from '../services/superadmin.service.js';
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

export const WORKFLOWS = {
  DASHBOARD: 'dashboard',
  NEW_ENCOUNTER: 'new-encounter',
  ENCOUNTER_LIST: 'encounter-list',
  PATIENT_DETAIL: 'patient-detail',
  ENCOUNTER_DETAIL: 'encounter-detail',
};

function EmrPageRedesigned({
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
  
  // NEW: Superadmin data state
  const [superadminData, setSuperadminData] = useState(null);
  const [isLoadingSuperadmin, setIsLoadingSuperadmin] = useState(false);

  // permissions
  const canPrescribe =
    activeUser?.role === 'doctor' || activeUser?.role === 'admin';
  const canOrderLabs = canPrescribe;
  const canAdmit = canPrescribe;

  // NEW: Fetch superadmin data for dashboard
  useEffect(() => {
    const fetchSuperadminData = async () => {
      if (activeUser?.role === 'Superadmin') {
        setIsLoadingSuperadmin(true);
        try {
          const data = await superadminService.getFixedOverview();
          setSuperadminData(data);
          console.log('Superadmin data loaded:', data.totals);
        } catch (error) {
          console.warn('Failed to fetch superadmin data:', error.message);
          showToast({
            title: 'Dashboard Error',
            message: 'Could not load admin dashboard data',
            type: 'error'
          });
        } finally {
          setIsLoadingSuperadmin(false);
        }
      }
    };
    
    fetchSuperadminData();
  }, [activeUser?.role, showToast]);

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

  // NEW: Enhanced patient selection with search
  const handlePatientSelect = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowPatientPicker(false);
    
    // Navigate to patient detail
    setActiveWorkflow(WORKFLOWS.PATIENT_DETAIL);
    
    showToast({
      title: 'Patient Selected',
      message: `${patient.firstName || patient.first_name} ${patient.lastName || patient.last_name} selected`,
      type: 'success'
    });
  }, [showToast]);

  // NEW: Improved patient search
  const handlePatientSearch = useCallback(async (searchQuery) => {
    try {
      // Use the fixed PatientPicker component
      setShowPatientPicker(true);
    } catch (error) {
      console.error('Patient search failed:', error);
      showToast({
        title: 'Search Error',
        message: 'Failed to search patients',
        type: 'error'
      });
    }
  }, [showToast]);

  // NEW: Enhanced encounter creation
  const handleCreateEncounter = useCallback(async (encounterData) => {
    setIsCreatingEncounter(true);
    try {
      await onCreateEncounter(encounterData);
      setEncounterData(INITIAL_ENCOUNTER);
      setActiveWorkflow(WORKFLOWS.ENCOUNTER_LIST);
      
      showToast({
        title: 'Encounter Created',
        message: 'Patient encounter created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Create encounter failed:', error);
      showToast({
        title: 'Creation Error',
        message: 'Failed to create encounter',
        type: 'error'
      });
    } finally {
      setIsCreatingEncounter(false);
    }
  }, [onCreateEncounter, showToast]);

  // NEW: AI integration with better error handling
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

  // NEW: Workflow navigation with state management
  const navigateToWorkflow = useCallback((workflow) => {
    setActiveWorkflow(workflow);
    
    // Reset states when switching workflows
    if (workflow === WORKFLOWS.DASHBOARD) {
      setSelectedPatient(null);
      setSelectedEncounter(null);
      setAiSummary(null);
      setAiTreatment(null);
    }
  }, []);

  // NEW: Render current workflow component
  const renderWorkflow = useCallback(() => {
    const commonProps = {
      tenant,
      activeUser,
      patients,
      providers,
      encounters,
      selectedPatient,
      selectedEncounter,
      encounterData,
      aiSummary,
      aiTreatment,
      canPrescribe,
      canOrderLabs,
      canAdmit,
      isGeneratingAI,
      isGeneratingTreatment,
      isCreatingEncounter,
      onPatientSelect: handlePatientSelect,
      onPatientSearch: handlePatientSearch,
      onCreateEncounter: handleCreateEncounter,
      onGenerateAISummary: handleGenerateAISummary,
      onGenerateAITreatment: handleGenerateAITreatment,
      onNavigateWorkflow: navigateToWorkflow,
      setSelectedPatient,
      setSelectedEncounter,
      setEncounterData,
      setShowPatientPicker,
    };

    switch (activeWorkflow) {
      case WORKFLOWS.DASHBOARD:
        return (
          <EmrDashboard 
            {...commonProps}
            patientStats={patientStats}
            superadminData={superadminData}
            isLoadingSuperadmin={isLoadingSuperadmin}
          />
        );
      
      case WORKFLOWS.NEW_ENCOUNTER:
        return <NewEncounterPage {...commonProps} />;
      
      case WORKFLOWS.ENCOUNTER_LIST:
        return <EncounterListPage {...commonProps} />;
      
      case WORKFLOWS.PATIENT_DETAIL:
        return (
          <PatientDetailPage 
            {...commonProps}
            onGenerateAISummary={handleGenerateAISummary}
            onGenerateAITreatment={handleGenerateAITreatment}
          />
        );
      
      case WORKFLOWS.ENCOUNTER_DETAIL:
        return <EncounterDetailPage {...commonProps} />;
      
      default:
        return <EmrDashboard {...commonProps} patientStats={patientStats} />;
    }
  }, [
    activeWorkflow,
    tenant,
    activeUser,
    patients,
    providers,
    encounters,
    selectedPatient,
    selectedEncounter,
    encounterData,
    aiSummary,
    aiTreatment,
    patientStats,
    superadminData,
    isLoadingSuperadmin,
    canPrescribe,
    canOrderLabs,
    canAdmit,
    isGeneratingAI,
    isGeneratingTreatment,
    isCreatingEncounter,
    handlePatientSelect,
    handlePatientSearch,
    handleCreateEncounter,
    handleGenerateAISummary,
    handleGenerateAITreatment,
    navigateToWorkflow,
  ]);

  return (
    <>
      {/* Enhanced Patient Picker with Search */}
      <PatientPicker
        tenantId={tenant?.id}
        patients={patients}
        encounters={encounters}
        onSelect={handlePatientSelect}
        onRegister={handleCreateEncounter}
        isOpen={showPatientPicker}
        onClose={() => setShowPatientPicker(false)}
      />
      
      {/* Main Workflow Content */}
      <div className="flex-1 flex flex-col">
        {renderWorkflow()}
      </div>
    </>
  );
}

export default EmrPageRedesigned;
