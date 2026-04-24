import { Plus, Trash2, Pill } from 'lucide-react';

export default function MedicationForm({ encounterData, setEncounterData }) {
  const addMedication = () => {
    const newMed = {
      id: `med-${Date.now()}`,
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    setEncounterData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), newMed]
    }));
  };

  const removeMedication = (id) => {
    setEncounterData(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m.id !== id)
    }));
  };

  const updateMedication = (id, field, value) => {
    setEncounterData(prev => ({
      ...prev,
      medications: prev.medications.map(m => 
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Prescriptions & Medications</h3>
        </div>
        <button
          onClick={addMedication}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      <div className="p-6">
        {(!encounterData.medications || encounterData.medications.length === 0) ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No medications added yet.</p>
            <button
              onClick={addMedication}
              className="mt-2 text-blue-600 font-medium hover:underline text-sm"
            >
              Add first medication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {encounterData.medications.map((med, index) => (
              <div 
                key={med.id} 
                className="p-4 border border-gray-200 rounded-xl bg-white hover:border-blue-200 transition-colors group relative"
              >
                <button
                  onClick={() => removeMedication(med.id)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-10">
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Medication Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol"
                      value={med.name}
                      onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={med.dosage}
                      onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. Twice daily"
                      value={med.frequency}
                      onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days"
                      value={med.duration}
                      onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Instructions</label>
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. take after food)"
                      value={med.instructions}
                      onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
