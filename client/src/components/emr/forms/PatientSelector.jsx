import { Users, User, X } from 'lucide-react';

export default function PatientSelector({ 
  selectedPatient, 
  onOpenPatientPicker, 
  onClearPatient 
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Step 1: Select Patient</h2>
      </div>
      <div className="p-6">
        {!selectedPatient ? (
          <button
            onClick={onOpenPatientPicker}
            className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Click to select patient</p>
              <p className="text-sm text-gray-500 mt-2">Choose from existing patients</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  MRN: {selectedPatient.mrn} | Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
                </p>
              </div>
            </div>
            <button
              onClick={onClearPatient}
              className="p-2 hover:bg-green-100 rounded-lg"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
