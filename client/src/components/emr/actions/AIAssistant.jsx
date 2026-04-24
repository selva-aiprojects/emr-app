import { Loader2, Bot, Sparkles } from 'lucide-react';

export default function AIAssistant({
  aiSummary,
  aiTreatment,
  isGeneratingAI,
  isGeneratingTreatment,
  onGenerateAISummary,
  onGenerateAITreatment
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">AI Clinical Assistant</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onGenerateAISummary}
            disabled={isGeneratingAI}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            {isGeneratingAI ? 'Generating...' : 'Generate Patient Summary'}
          </button>

          <button
            onClick={onGenerateAITreatment}
            disabled={isGeneratingTreatment}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isGeneratingTreatment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGeneratingTreatment ? 'Generating...' : 'AI Treatment Suggestion'}
          </button>
        </div>

        {aiSummary && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-2">AI Patient Summary</h4>
            <p className="text-sm text-indigo-700 whitespace-pre-wrap">{aiSummary}</p>
          </div>
        )}

        {aiTreatment && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">AI Treatment Suggestion</h4>
            <p className="text-sm text-purple-700 whitespace-pre-wrap">{aiTreatment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
