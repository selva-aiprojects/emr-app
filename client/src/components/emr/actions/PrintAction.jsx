import { Printer } from 'lucide-react';

export default function PrintAction({ onPrint }) {
  return (
    <button
      onClick={onPrint}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      <Printer className="w-4 h-4" />
      Print Summary
    </button>
  );
}
