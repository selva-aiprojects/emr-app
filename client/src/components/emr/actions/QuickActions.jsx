import { Pill, TestTube, Bed } from 'lucide-react';

export default function QuickActions({
  canPrescribe,
  canOrderLabs,
  canAdmit,
  onPrescribe,
  onOrderLabs,
  onAdmit,
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canPrescribe && (
            <button
              onClick={onPrescribe}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Pill className="w-4 h-4" />
              Prescribe Medication
            </button>
          )}
          
          {canOrderLabs && (
            <button
              onClick={onOrderLabs}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <TestTube className="w-4 h-4" />
              Order Lab Tests
            </button>
          )}
          
          {canAdmit && (
            <button
              onClick={onAdmit}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Bed className="w-4 h-4" />
              Admit Patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
