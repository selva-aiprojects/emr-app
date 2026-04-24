import { ChevronLeft } from 'lucide-react';
import PatientSelector from './forms/PatientSelector.jsx';
import EncounterForm from './forms/EncounterForm.jsx';
import VitalsForm from './forms/VitalsForm.jsx';
import AssessmentForm from './forms/AssessmentForm.jsx';
import MedicationForm from './forms/MedicationForm.jsx';
import AIAssistant from './actions/AIAssistant.jsx';
import FormActions from './actions/FormActions.jsx';

export default function NewEncounterPage({
  tenant,
  selectedPatient,
  encounterData,
  setEncounterData,
  onBack,
  onOpenPatientPicker,
  onClearPatient,
  onCreateEncounter,
  isCreatingEncounter,
  canInpatient,
  canPrescribe,
  aiSummary,
  aiTreatment,
  isGeneratingAI,
  isGeneratingTreatment,
  onGenerateAISummary,
  onGenerateAITreatment
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg mr-3"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">New Clinical Encounter</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Patient Selection */}
        <PatientSelector
          selectedPatient={selectedPatient}
          onOpenPatientPicker={onOpenPatientPicker}
          onClearPatient={onClearPatient}
        />

        {/* Encounter Details - Only show if patient is selected */}
        {selectedPatient && (
          <>
            <EncounterForm
              encounterData={encounterData}
              setEncounterData={setEncounterData}
              canInpatient={canInpatient}
            />

            <VitalsForm
              encounterData={encounterData}
              setEncounterData={setEncounterData}
            />

            <AssessmentForm
              encounterData={encounterData}
              setEncounterData={setEncounterData}
            />

            {canPrescribe && (
              <MedicationForm
                encounterData={encounterData}
                setEncounterData={setEncounterData}
              />
            )}

            <AIAssistant
              aiSummary={aiSummary}
              aiTreatment={aiTreatment}
              isGeneratingAI={isGeneratingAI}
              isGeneratingTreatment={isGeneratingTreatment}
              onGenerateAISummary={onGenerateAISummary}
              onGenerateAITreatment={onGenerateAITreatment}
            />

            <FormActions
              onBack={onBack}
              onCreateEncounter={onCreateEncounter}
              isCreatingEncounter={isCreatingEncounter}
              isDisabled={!encounterData.chiefComplaint}
            />
          </>
        )}
      </div>
    </div>
  );
}
