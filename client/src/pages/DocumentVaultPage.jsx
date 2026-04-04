import { useMemo, useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Archive, FileText, Trash2, Upload, Sparkles, Bot, Loader2, X } from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';
import { getAIImageAnalysis } from '../ai-api.js';

const CATEGORY_OPTIONS = [
  'lab_report',
  'prescription',
  'invoice',
  'consent',
  'imaging',
  'discharge_summary',
  'admin',
  'other'
];

const canManageDocs = (role) => ['Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Front Office'].includes(role);

export default function DocumentVaultPage({ activeUser, documents = [], patients = [], onCreateDocument, onSetDocumentDeleted }) {
  const { showToast } = useToast();

  const [showUpload, setShowUpload] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeImage = async (docId, storageKey) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const resp = await getAIImageAnalysis(docId, storageKey);
      setAnalysis({ docId, text: resp.analysis });
    } catch (err) {
      console.error('AI Scan Error:', err);
      showToast({ message: 'Failed to analyze clinical document.', type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const categoryOk = categoryFilter === 'all' || doc.category === categoryFilter;
      const text = `${doc.title} ${doc.file_name || doc.fileName}`.toLowerCase();
      const searchOk = !search || text.includes(search.toLowerCase());
      return categoryOk && searchOk;
    });
  }, [documents, categoryFilter, search]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Vault</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Centralized patient and administrative document metadata with retention controls.</p>
        </div>
        {canManageDocs(activeUser?.role) && (
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-slate-800 transition inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showUpload ? 'Close Upload' : 'Add Document'}
          </button>
        )}
      </header>

      <article className="premium-panel grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or filename"
          className="w-full p-2 border border-slate-200 rounded-lg text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full p-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="all">All categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="text-xs text-slate-500 font-semibold flex items-center">
          {filteredDocuments.length} document(s) in current view
        </div>
      </article>

      {showUpload && canManageDocs(activeUser?.role) && (
        <article className="premium-panel">
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await onCreateDocument({
                patientId: fd.get('patientId') || null,
                category: fd.get('category'),
                title: fd.get('title'),
                fileName: fd.get('fileName'),
                mimeType: fd.get('mimeType'),
                storageKey: fd.get('storageKey'),
                sizeBytes: Number(fd.get('sizeBytes') || 0),
                tags: (fd.get('tags') || '')
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean)
              });
              e.target.reset();
              showToast({ message: 'Document saved to vault!', type: 'success', title: 'Documents' });
              setShowUpload(false);
            }}
          >
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Title</label>
              <input name="title" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Category</label>
              <select name="category" defaultValue="other" className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Patient</label>
              <select name="patientId" defaultValue="" className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Administrative / Non-patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">File Name</label>
              <input name="fileName" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">MIME Type</label>
              <input name="mimeType" placeholder="application/pdf" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Storage Key</label>
              <input name="storageKey" placeholder="docs/2026/03/file.pdf" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Size (bytes)</label>
              <input name="sizeBytes" type="number" min="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tags (comma separated)</label>
              <input name="tags" placeholder="urgent,lab,ipd" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="rounded-lg bg-indigo-600 text-white px-5 py-2 text-sm font-bold hover:bg-indigo-700 transition">
                Save Metadata
              </button>
            </div>
          </form>
        </article>
      )}

      <article className="premium-panel p-0 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <EmptyState
            title="No documents yet"
            subtitle="Upload document metadata to build a searchable shared vault."
            icon={Archive}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <h3 className="font-bold text-slate-900">{doc.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-600">
                        {doc.category}
                      </span>
                      {doc.is_deleted && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-rose-100 text-rose-700">
                          Deleted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{doc.file_name || doc.fileName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {doc.patient_name ? `Patient: ${doc.patient_name} • ` : ''}Uploaded {new Date(doc.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManageDocs(activeUser?.role) && !doc.is_deleted && (
                      <button
                        type="button"
                        onClick={() => handleAnalyzeImage(doc.id, doc.storage_key || doc.storageKey)}
                        disabled={isAnalyzing}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {isAnalyzing && analysis?.docId === doc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        AI Scan
                      </button>
                    )}
                    {canManageDocs(activeUser?.role) && (
                      <button
                        type="button"
                        className={`text-xs font-bold inline-flex items-center gap-1 ${
                          doc.is_deleted ? 'text-emerald-600 hover:text-emerald-700' : 'text-rose-600 hover:text-rose-700'
                        }`}
                        onClick={async () => {
                          await onSetDocumentDeleted(doc.id, !doc.is_deleted);
                          showToast({ message: doc.is_deleted ? 'Document restored.' : 'Document archived.', type: 'success', title: 'Documents' });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {doc.is_deleted ? 'Restore' : 'Soft Delete'}
                      </button>
                    )}
                  </div>
                </div>

                {analysis && analysis.docId === doc.id && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-fade-in relative">
                    <button 
                      onClick={() => setAnalysis(null)}
                      className="absolute top-4 right-4 text-indigo-300 hover:text-indigo-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Clinical Vision Findings</h4>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase mt-0.5 tracking-wider">Document AI Interpreter</p>
                      </div>
                    </div>
                    <div className="text-sm leading-relaxed text-indigo-900/80 whitespace-pre-wrap font-medium border-l-4 border-indigo-200 pl-6 py-2">
                      {analysis.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
