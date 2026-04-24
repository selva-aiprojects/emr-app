export default function AssessmentForm({ encounterData, setEncounterData }) {
  const handleChange = (field, value) => {
    setEncounterData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Clinical Assessment & Plan</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
            <textarea
              value={encounterData.assessment}
              onChange={(e) => handleChange('assessment', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Clinical assessment and findings..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
            <textarea
              value={encounterData.plan}
              onChange={(e) => handleChange('plan', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Treatment plan and follow-up instructions..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
