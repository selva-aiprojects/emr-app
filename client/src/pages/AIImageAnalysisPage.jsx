import { useState, useRef } from 'react';
import { 
  Scan, 
  Upload, 
  Zap, 
  ShieldCheck, 
  Activity, 
  FileText, 
  Plus, 
  ChevronRight,
  Eye,
  Microscope,
  Award
} from 'lucide-react';
import '../styles/critical-care.css';

export default function AIImageAnalysisPage({ tenant }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  };

  const startAnalysis = () => {
    if (!file) return;
    setAnalyzing(true);
    // Simulated Vision AI latency
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        finding: 'Suspected Linear Fracture of the distal radius.',
        confidence: 94.2,
        suggestion: 'Correlate with clinical tenderness and initiate orthopedic consult.',
        safetyNote: 'AI Impression for screening only. Verification by radiologist mandatory.'
      });
    }, 3000);
  };

  return (
    <div className="page-shell-premium animate-fade-in text-slate-900">
      <header className="page-header-premium mb-12 pb-8 border-b border-gray-100">
        <div className="flex-1">
           <h1 className="page-title-rich flex items-center gap-4">
              <Zap className="text-amber-500 fill-amber-500" size={28} />
              AI Diagnostic Vision
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black shadow-xl">Vision Shard v2.0</span>
           </h1>
           <p className="dim-label mt-2 max-w-2xl">Autonomous clinical image analysis and pattern recognition for {tenant?.name || 'Institutional Medical Group'}. Powered by Gemini Vision Mesh.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HIPAA Compliant</div>
                 <div className="text-xs font-black text-slate-900">Zero-Retention Processing</div>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
         {/* Analysis Terminal */}
         <main className="col-span-12 lg:col-span-8">
            <div className="clinical-card !p-0 overflow-hidden bg-slate-900 border-none shadow-2xl min-h-[500px] flex flex-col">
               <header className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-3">
                     <Scan size={16} className="text-indigo-400" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Vision Input Terminal</span>
                  </div>
                  <div className="flex gap-1">
                     {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10"></div>)}
                  </div>
               </header>

               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white relative">
                  {!file ? (
                    <div className="space-y-6 group transition-all cursor-pointer" onClick={handleUpload}>
                       <div className="w-24 h-24 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mx-auto group-hover:border-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                          <Upload size={32} className="text-white/40 group-hover:text-indigo-400" />
                       </div>
                       <div>
                          <h4 className="text-lg font-black tracking-tight">Ingest Clinical Media</h4>
                          <p className="text-sm text-white/40 mt-1">Upload X-ray, MRI, or CT Scan (DICOM/PNG/JPG)</p>
                       </div>
                       <button className="px-8 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">Browse Shards</button>
                    </div>
                  ) : (
                    <div className="w-full max-w-lg animate-fade-in">
                       <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
                          {/* Mock Image Representation */}
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center opacity-50">
                                <Microscope size={48} className="text-white/20 mb-4" />
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{file.name} Loaded</span>
                             </div>
                          </div>
                          
                          {analyzing && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_infinite_linear]"></div>
                          )}
                          
                          {/* Animated Scan Line CSS */}
                          <style>{`
                            @keyframes scan {
                              0% { top: 0% }
                              100% { top: 100% }
                            }
                          `}</style>
                       </div>
                       
                       {!analyzing && !result && (
                         <div className="mt-8">
                            <button 
                              onClick={startAnalysis}
                              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 border-none"
                            >
                               <Zap size={18} /> INITIATE VISION AI
                            </button>
                            <button onClick={() => setFile(null)} className="mt-4 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Clear Input</button>
                         </div>
                       )}
                       
                       {analyzing && (
                         <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-center gap-3 text-indigo-400">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                               <span className="text-xs font-black uppercase tracking-widest">Neural Mapping in Progress...</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 animate-[progress_3s_ease-out-forward]"></div>
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} accept="image/*" />
               </div>
            </div>
         </main>

         {/* Results / Impression Column */}
         <aside className="col-span-12 lg:col-span-4 space-y-8">
            <article className={`clinical-card min-h-[400px] transition-all duration-700 ${result ? 'border-amber-100 bg-amber-50/20' : 'opacity-50 grayscale'}`}>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 border-b border-gray-100 pb-4 flex items-center gap-3">
                  <Activity size={18} className="text-indigo-600" />
                  AI Clinical Impression
               </h3>
               
               {result ? (
                 <div className="space-y-8 animate-fade-in">
                    <div>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Automated Finding</div>
                       <p className="text-lg font-black text-slate-900 leading-tight">{result.finding}</p>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-amber-100">
                       <Award className="text-amber-500" />
                       <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase">Confidence Score</div>
                          <div className="text-xl font-black text-slate-900">{result.confidence}%</div>
                       </div>
                    </div>

                    <div>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Trajectory</div>
                       <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-xl italic text-xs leading-relaxed">
                          "{result.suggestion}"
                       </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                       <div className="flex gap-4">
                          <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none">Sync with EMR</button>
                          <button className="px-5 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-900 transition-all"><FileText size={14} /></button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                    <Microscope size={48} className="mb-6 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Awaiting visual shard ingestion for analysis...</p>
                 </div>
               )}
            </article>

            <article className="clinical-card bg-rose-50 border-rose-100">
               <div className="flex items-center gap-3 text-rose-600 mb-4">
                  <Eye size={18} />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Medical Disclaimer</h4>
               </div>
               <p className="text-[10px] text-rose-800/70 font-medium leading-relaxed uppercase tracking-tighter">
                  This vision AI is an assistive screening tool. IT DOES NOT REPLACE HUMAN RADIOLOGIST VALIDATION. All high-confidence observations must be cross-verified before initiating invasive procedures.
               </p>
            </article>
         </aside>
      </div>

      <footer className="mt-12 p-8 bg-slate-50 border border-slate-200 rounded-3xl flex justify-between items-center">
         <div className="flex items-center gap-3">
            <Zap className="text-amber-500" size={16} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Engine: active</span>
         </div>
         <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Shard-Identity: VISION-ALPHA-01</div>
      </footer>
    </div>
  );
}
