export default function ClinicalInfo({ selectedEncounter }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Clinical Information</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Encounter Details</h3>
            <div className="space-y-2">
              <p><span className="text-sm text-gray-500">Type:</span> {selectedEncounter.type}</p>
              <p><span className="text-sm text-gray-500">Priority:</span> {selectedEncounter.priority}</p>
              <p><span className="text-sm text-gray-500">Date:</span> {new Date(selectedEncounter.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Vital Signs</h3>
            <div className="space-y-2">
              <p><span className="text-sm text-gray-500">BP:</span> {selectedEncounter.bp || '--'} mmHg</p>
              <p><span className="text-sm text-gray-500">Heart Rate:</span> {selectedEncounter.hr || '--'} bpm</p>
              <p><span className="text-sm text-gray-500">Temperature:</span> {selectedEncounter.temperature || '--'}°F</p>
              <p><span className="text-sm text-gray-500">O2 Saturation:</span> {selectedEncounter.oxygen_saturation || selectedEncounter.oxygenSaturation || '--'}%</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Chief Complaint</h3>
          <p className="text-gray-700">{selectedEncounter.chiefComplaint || 'Not recorded'}</p>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Diagnosis</h3>
          <p className="text-gray-700">{selectedEncounter.diagnosis || 'Not recorded'}</p>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Assessment</h3>
          <p className="text-gray-700">{selectedEncounter.assessment || 'Not recorded'}</p>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Treatment Plan</h3>
          <p className="text-gray-700">{selectedEncounter.plan || 'Not recorded'}</p>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Clinical Notes</h3>
          <p className="text-gray-700">{selectedEncounter.notes || 'No additional notes recorded.'}</p>
        </div>

        {selectedEncounter.medications && selectedEncounter.medications.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Medications & Prescriptions</h3>
            <div className="bg-blue-50 rounded-xl border border-blue-100 divide-y divide-blue-100 overflow-hidden">
              {selectedEncounter.medications.map((med, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-blue-900">{med.name}</p>
                    <p className="text-sm text-blue-700">{med.dosage} - {med.frequency} for {med.duration}</p>
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-blue-600 italic">Note: {med.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
