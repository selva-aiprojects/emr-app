import { User } from 'lucide-react';

export default function PatientInfoCard({ selectedPatient, selectedEncounter }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xl font-semibold text-gray-900">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </p>
            <p className="text-gray-500">
              MRN: {selectedPatient.mrn} | Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              selectedEncounter.status === 'open' 
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {selectedEncounter.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
