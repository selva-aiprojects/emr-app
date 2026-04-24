import { ChevronLeft } from 'lucide-react';
import PatientInfoCard from './sections/PatientInfoCard.jsx';
import ClinicalInfo from './sections/ClinicalInfo.jsx';
import QuickActions from './actions/QuickActions.jsx';
import PrintAction from './actions/PrintAction.jsx';
import { PrintService } from './utils/PrintService.jsx';

export default function EncounterDetailPage({
  tenant,
  selectedPatient,
  selectedEncounter,
  onBack,
  canPrescribe,
  canOrderLabs,
  canAdmit,
  onPrescribe,
  onOrderLabs,
  onAdmit,
}) {
  const handlePrint = () => {
    PrintService.printEncounterSummary(tenant, selectedPatient, selectedEncounter);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Encounter Details</h1>
            </div>
            <div className="flex items-center gap-4">
              <PrintAction onPrint={handlePrint} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Patient Information */}
        <PatientInfoCard
          selectedPatient={selectedPatient}
          selectedEncounter={selectedEncounter}
        />

        {/* Clinical Information */}
        <ClinicalInfo selectedEncounter={selectedEncounter} />

        {/* Quick Actions */}
        <QuickActions
          canPrescribe={canPrescribe}
          canOrderLabs={canOrderLabs}
          canAdmit={canAdmit}
          onPrescribe={onPrescribe}
          onOrderLabs={onOrderLabs}
          onAdmit={onAdmit}
        />
      </div>
    </div>
  );
}
