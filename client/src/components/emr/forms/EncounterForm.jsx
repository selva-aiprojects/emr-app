export default function EncounterForm({ encounterData, setEncounterData, canInpatient }) {
  const handleChange = (field, value) => {
    setEncounterData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Step 2: Encounter Details</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Encounter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Encounter Type</label>
            <select
              value={encounterData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="outpatient">Outpatient</option>
              {canInpatient && <option value="inpatient">Inpatient</option>}
              {canInpatient && <option value="emergency">Emergency</option>}
              <option value="consultation">Consultation</option>
              <option value="followup">Follow-up</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={encounterData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Chief Complaint */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint *</label>
            <textarea
              value={encounterData.chiefComplaint}
              onChange={(e) => handleChange('chiefComplaint', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the patient's main reason for visit..."
            />
          </div>

          {/* Diagnosis */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Diagnosis</label>
            <textarea
              value={encounterData.diagnosis}
              onChange={(e) => handleChange('diagnosis', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provisional diagnosis based on initial assessment..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
