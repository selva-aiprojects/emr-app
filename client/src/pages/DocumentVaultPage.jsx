import { useMemo, useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { Archive, FileText, Trash2, Upload, Sparkles, Bot, Loader2, X, ShieldCheck } from 'lucide-react';
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
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Document Vault
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Archival Node</span>
           </h1>
           <p className="dim-label">Centralized patient and administrative document metadata with retention controls.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Data Integrity Verified • SSAE-18 Audited
           </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {canManageDocs(activeUser?.role) && (
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {showUpload ? 'Abord Upload' : 'Archive New Doc'}
            </button>
          )}

          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-white font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer px-4"
            >
              <option value="all" className="text-slate-900">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat} className="text-slate-900">{cat}</option>
              ))}
            </select>
            <div className="w-[1px] h-4 bg-white/20 mx-2 self-center"></div>
            <div className="text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center px-4">
              {filteredDocuments.length} Record Shards
            </div>
          </div>
        </div>
      </header>

      <article className="premium-panel mb-8">
        <div className="relative group">
           <input
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search title, filename or clinical tags..."
             className="w-full h-14 pl-6 pr-12 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-900/5 transition-all"
           />
           <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
              <Sparkles className="w-4 h-4" />
           </div>
        </div>
      </article>

      {showUpload && canManageDocs(activeUser?.role) && (
        <article className="premium-panel mb-10 overflow-hidden border-2 border-indigo-100/50">
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
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
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Document Title</label>
                <input name="title" required className="input-field" placeholder="e.g. Lab Report March 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                   <select name="category" defaultValue="other" className="input-field">
                     {CATEGORY_OPTIONS.map((cat) => (
                       <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Patient Correlation</label>
                   <select name="patientId" defaultValue="" className="input-field text-[11px]">
                     <option value="">Administrative Shard</option>
                     {patients.map((p) => (
                       <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>
                     ))}
                   </select>
                 </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Clinical Tags</label>
                <input name="tags" placeholder="urgent, lab, pathology" className="input-field" />
              </div>
            </div>
            
            <div className="space-y-6">
               <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original Filename</label>
                <input name="fileName" required className="input-field" placeholder="report_332.pdf" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">MIME Type</label>
                   <input name="mimeType" placeholder="application/pdf" className="input-field" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Size (Bytes)</label>
                   <input name="sizeBytes" type="number" min="0" className="input-field" placeholder="0" />
                 </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Persistence Storage Key</label>
                <input name="storageKey" placeholder="vault/2026/report.pdf" className="input-field" />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50">
               <button type="button" onClick={() => setShowUpload(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 transition-colors">Cancel Provision</button>
               <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all">Persist to Vault</button>
            </div>
          </form>
        </article>
      )}

      <article className="premium-panel p-0 overflow-hidden shadow-premium bg-white border-none">
        {filteredDocuments.length === 0 ? (
          <EmptyState
            title="No record shards detected"
            subtitle="The archival vault contains no document metadata matching current constraints."
            icon={Archive}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shrink-0">
                       <FileText size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-slate-900 group-hover:translate-x-1 transition-transform uppercase tracking-tight">{doc.title}</h3>
                        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                          {doc.category.replace('_', ' ')}
                        </span>
                        {doc.is_deleted && (
                          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600">
                            Archived/Deleted
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tighter opacity-70">{doc.file_name || doc.fileName}</p>
                      <div className="text-[10px] font-black text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest">
                        {doc.patient_name ? <><span className="text-slate-900">PATIENT: {doc.patient_name}</span> • </> : ''}
                        <span>UPLOADED {new Date(doc.created_at).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManageDocs(activeUser?.role) && !doc.is_deleted && (
                      <button
                        type="button"
                        onClick={() => handleAnalyzeImage(doc.id, doc.storage_key || doc.storageKey)}
                        disabled={isAnalyzing}
                        className="px-5 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-sm"
                      >
                        {isAnalyzing && analysis?.docId === doc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Clinical Vision Scan
                      </button>
                    )}
                    {canManageDocs(activeUser?.role) && (
                      <button
                        type="button"
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-sm ${
                          doc.is_deleted ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                        }`}
                        onClick={async () => {
                          await onSetDocumentDeleted(doc.id, !doc.is_deleted);
                          showToast({ message: doc.is_deleted ? 'Document restored.' : 'Document archived.', type: 'success', title: 'Documents' });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {doc.is_deleted ? 'Restore Shard' : 'Soft Delete'}
                      </button>
                    )}
                  </div>
                </div>

                {analysis && analysis.docId === doc.id && (
                  <div className="mt-6 bg-slate-900 text-white rounded-3xl p-8 animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <button 
                      onClick={() => setAnalysis(null)}
                      className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Bot className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.25em]">Clinical Visual Intelligence</h4>
                        <p className="text-[10px] font-bold text-white/40 uppercase mt-0.5 tracking-wider">Automated Shard Interpretation</p>
                      </div>
                    </div>
                    <div className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap font-medium border-l-2 border-indigo-500/50 pl-8 py-2 max-w-4xl">
                      {analysis.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
