import { Save, Loader2 } from 'lucide-react';

export default function FormActions({
  onBack,
  onCreateEncounter,
  isCreatingEncounter,
  isDisabled
}) {
  return (
    <div className="flex justify-end gap-4">
      <button
        onClick={onBack}
        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={onCreateEncounter}
        disabled={isCreatingEncounter || isDisabled}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isCreatingEncounter ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isCreatingEncounter ? 'Creating...' : 'Create Encounter'}
      </button>
    </div>
  );
}
