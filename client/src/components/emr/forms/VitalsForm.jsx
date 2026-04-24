export default function VitalsForm({ encounterData, setEncounterData }) {
  const handleVitalsChange = (vitalField, value) => {
    setEncounterData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [vitalField]: value
      }
    }));
  };

  const handleBloodPressureChange = (side, value) => {
    setEncounterData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        bp: {
          ...prev.vitals.bp,
          [side]: value
        }
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Systolic"
                value={encounterData.vitals.bp.systolic}
                onChange={(e) => handleBloodPressureChange('systolic', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Diastolic"
                value={encounterData.vitals.bp.diastolic}
                onChange={(e) => handleBloodPressureChange('diastolic', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate</label>
            <input
              type="number"
              placeholder="bpm"
              value={encounterData.vitals.heartRate}
              onChange={(e) => handleVitalsChange('heartRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
            <input
              type="number"
              placeholder="°F"
              value={encounterData.vitals.temperature}
              onChange={(e) => handleVitalsChange('temperature', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen Saturation</label>
            <input
              type="number"
              placeholder="%"
              value={encounterData.vitals.oxygenSat}
              onChange={(e) => handleVitalsChange('oxygenSat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
