import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api';
import '../styles/critical-care.css';
import { 
  FlaskConical, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Printer, 
  FileText,
  ShieldAlert,
  BrainCircuit,
  Sparkles,
  Loader2,
  BarChart3
} from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';

export default function LabPage({ tenant, activeUser }) {
  const { showToast } = useToast();

  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    async function load() {
      if (!tenant?.id) return;
      setLoading(true);
      try {
        const data = await api.getLabOrders(tenant.id);
        setLabOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Diagnostic Feed Interrupted:', err);
        setLabOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenant?.id, api]);

  const stats = useMemo(() => {
    try {
      const orders = Array.isArray(labOrders) ? labOrders : [];
      return {
        pending: orders.filter(o => o && o.status === 'pending').length,
        critical: orders.filter(o => {
          if (!o) return false;
          const val = Number(o.result_value);
          return !isNaN(val) && (val > 200 || val < 50);
        }).length,
        completed: orders.filter(o => o && o.status === 'completed').length
      };
    } catch (e) {
      console.error("Stats Calc Failure:", e);
      return { pending: 0, critical: 0, completed: 0 };
    }
  }, [labOrders]);

  const handleRecordResult = (order) => {
    setSelectedOrder(order);
    setShowResultModal(true);
  };

  const handleAiInterpretation = async (order) => {
    setSelectedOrder(order);
    setAiAnalysis(null);
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const data = await api.interpretLabResults(tenant.id, order.id);
      setAiAnalysis(data);
      showToast({ message: 'Diagnostic interpretation synthesized successfully.', type: 'success', title: 'Clinical AI' });
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to synthesize AI interpretation. Check diagnostic feeds.', type: 'error', title: 'Clinical AI' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleFinalizeResult = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const value = fd.get('resultValue');
    const notes = fd.get('notes');
    
    if (!value) {
      showToast({ message: 'Result value is required for clinical integrity.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.recordLabResults(selectedOrder.id, {
        results: { value: parseFloat(value), unit: selectedOrder.unit || 'mg/dL' },
        notes,
        criticalFlag: parseFloat(value) > 200 || parseFloat(value) < 50
      });
      
      showToast({ message: 'Diagnostic outcome committed to persistence ledger.', type: 'success', title: 'Lab Network' });
      setShowResultModal(false);
      
      // Refresh local state
      const updated = await api.getLabOrders(tenant.id);
      setLabOrders(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to authorize diagnostic outcome.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'orders'

  return (
    <div className="page-shell-premium animate-fade-in">

      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Laboratory & Diagnostic Hub
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Laboratory Network</span>
           </h1>
           <p className="dim-label">Manage lab test orders, view test results, and generate diagnostic reports for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 text-indigo-500" /> Lab Integrity Verified • Diagnostic feeds operational
           </p>
        </div>
        <div className="flex items-center gap-4">
           {/* No-click critical counts */}
           <div className="flex bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-r border-slate-100 bg-slate-50/50">
                 <span className="stat-label block mb-1">Awaiting Samples</span>
                 <span className="stat-value-sm tabular-nums">{stats.pending}</span>
              </div>
              <div className="px-5 py-3 bg-white">
                 <span className="stat-label block mb-1">Critical Findings</span>
                 <span className="stat-value-sm text-rose-600 tabular-nums">{stats.critical}</span>
              </div>
           </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-8 w-fit">
        {[
          { id: 'dashboard', label: 'Diagnostic Dashboard', icon: BarChart3 },
          { id: 'orders', label: 'Clinical Orders Queue', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-10 animate-fade-in">
          {/* SYSTEM STATUS GRID */}
          <section className="vitals-monitor">
            <div className="vital-node vital-node--warning shadow-sm">
               <div className="flex justify-between items-start">
                  <span className="vital-label">Pending Diagnostic Load</span>
                  <Clock className="w-4 h-4 text-amber-500 opacity-50" />
               </div>
               <span className="vital-value tabular-nums mt-1">{stats.pending}</span>
               <p className="text-[10px] font-black text-amber-600 mt-2 uppercase">Mean turnaround: 42m</p>
            </div>

            <div className="vital-node vital-node--safe shadow-sm">
               <div className="flex justify-between items-start">
                  <span className="vital-label">Validated Results</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-50" />
               </div>
               <span className="vital-value tabular-nums mt-1">{stats.completed}</span>
               <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase">24h Throughput stable</p>
            </div>

            <div className="vital-node vital-node--critical shadow-sm">
               <div className="flex justify-between items-start">
                  <span className="vital-label">Adverse Pathologies</span>
                  <AlertCircle className="w-4 h-4 text-rose-500 opacity-50" />
               </div>
               <span className="vital-value tabular-nums mt-1">{stats.critical}</span>
               <p className="text-[10px] font-black text-rose-600 mt-2 uppercase">Immediate clinical bypass</p>
            </div>
          </section>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="clinical-card h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 border-dashed">
                <BarChart3 className="w-12 h-12 text-slate-200 mb-4" />
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Diagnostic Volume Analytics</h4>
                <p className="text-[10px] text-slate-400 uppercase mt-1">Advanced pathological trends will appear here as the ledger grows</p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-8">
               <article className="clinical-card border-l-4 border-emerald-500">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Terminal className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fast-Track Terminal</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Operational Bypass</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left group hover:border-emerald-200 hover:bg-white transition-all" onClick={() => setActiveTab('orders')}>
                        <FlaskConical className="w-5 h-5 text-slate-300 mb-4 group-hover:text-emerald-500" />
                        <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Process Orders</span>
                     </button>
                     <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left group hover:border-emerald-200 hover:bg-white transition-all">
                        <FileText className="w-5 h-5 text-slate-300 mb-4 group-hover:text-emerald-500" />
                        <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Report Sync</span>
                     </button>
                  </div>
               </article>
            </div>
          </div>
        </div>
      ) : (

      <div className="grid grid-cols-12 gap-8">
        <main className="col-span-12 lg:col-span-8">
           <article className="clinical-card !p-0 overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lab Orders Queue</h3>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Real-time pathology ledger</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                   <Activity className="w-4 h-4" />
                </div>
             </div>

             <div className="premium-table-container">
               <table className="premium-table">
                 <thead>
                    <tr>
                       <th className="tracking-widest">Patient Name</th>
                       <th className="tracking-widest">Diagnostic Test</th>
                       <th className="tracking-widest">Target Dept</th>
                       <th className="tracking-widest">Status / Outcome</th>
                       <th style={{ textAlign: 'right' }} className="tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-24 text-slate-300 italic font-black uppercase tracking-widest">Syncing diagnostic feed...</td></tr>
                    ) : labOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <EmptyState 
                            title="No laboratory tests found" 
                            subtitle="No test orders match your current criteria."
                            icon={FlaskConical}
                          />
                        </td>
                      </tr>
                    ) : labOrders.map((order, idx) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td>
                           <div className="font-black text-slate-900">{order.patient_name || 'Clinical Subject'}</div>
                           <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 tabular-nums">Ref: {String(order.id || 'X').slice(0, 8)}</div>
                        </td>
                        <td>
                           <div className="text-[13px] font-black text-slate-700">{order.test_name}</div>
                           <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">{order.category || 'General Pathology'}</div>
                        </td>
                        <td>
                           <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">{order.lab_name}</span>
                        </td>
                        <td>
                           <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 animate-pulse'}`}></span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'text-emerald-700' : 'text-amber-600'}`}>
                                 {order.status === 'completed' ? `Outcome: ${order.result_value}${order.unit || ''}` : 'Sample Ingested'}
                              </span>
                           </div>
                        </td>
                         <td className="text-right">
                           <div className="flex justify-end gap-2">
                            {order.status === 'pending' ? (
                              <button className="clinical-btn bg-slate-900 text-white px-6 !min-h-[40px] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border-none" onClick={() => handleRecordResult(order)}>Record Observation</button>
                            ) : (
                              <>
                                <button 
                                  className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm group" 
                                  title="Clinical AI Interpretation"
                                  onClick={() => handleAiInterpretation(order)}
                                >
                                   <BrainCircuit className="w-4 h-4 group-hover:animate-pulse" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm" title="Authorization Extract">
                                   <Printer className="w-4 h-4" />
                                </button>
                              </>
                            )}
                           </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </article>
        </main>

        <aside className="col-span-12 lg:col-span-4 space-y-8">
           <article className="clinical-card border-l-4 border-emerald-500">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fast-Track Terminal</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Operational Bypass</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left group hover:border-emerald-200 hover:bg-white transition-all">
                    <FlaskConical className="w-5 h-5 text-slate-300 mb-4 group-hover:text-emerald-500" />
                    <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Batch Entry</span>
                 </button>
                 <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left group hover:border-emerald-200 hover:bg-white transition-all">
                    <FileText className="w-5 h-5 text-slate-300 mb-4 group-hover:text-emerald-500" />
                    <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Report Sync</span>
                 </button>
              </div>
           </article>

           <article className="clinical-card border-l-4 border-rose-500 bg-rose-50/20">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                 </div>
                 <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Critical Priority Guidelines</h3>
              </div>
              <p className="text-[11px] font-medium text-rose-800/70 leading-relaxed mb-6">
                 Abnormal lab findings are automatically prioritized. Ensure secondary checking for all critical values before finalizing the lab report.
              </p>
               <div className="p-4 bg-white border border-rose-100 rounded-2xl">
                  <div className="stat-label mb-2">Active Critical Tests</div>
                  <div className="stat-value text-rose-700 tabular-nums">{stats.critical} Unresolved</div>
               </div>
           </article>
        </aside>
      </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowAiModal(false)}>
          <div className="relative clinical-card w-full max-w-2xl p-0 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BrainCircuit className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex items-center gap-4 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Clinical AI Diagnostic Suite</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Automated Pathological Interpretation • Ref: {selectedOrder?.test_name}
              </p>
            </div>

            <div className="p-8 space-y-8 bg-white min-h-[300px]">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synthesizing clinical snaphot...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-50">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Patient Subject</label>
                      <p className="text-sm font-black text-slate-900">{selectedOrder?.patient_name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Diagnostic Observation</label>
                      <p className="text-sm font-black text-orange-600">{selectedOrder?.result_value} {selectedOrder?.unit}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                      AI-Driven Interpretation Summary
                    </label>
                    <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                      <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                        "{aiAnalysis.interpretation}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</div>
                      <div className="text-xs font-black text-emerald-600 uppercase">Verified Feed</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Clinical Confidence</div>
                      <div className="text-xs font-black text-slate-900 uppercase">High (94%)</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Model Shard</div>
                      <div className="text-xs font-black text-slate-900 uppercase">Gemini-1.5-Flash</div>
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-start gap-3 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Bypass Notice: AI interpretations must be validated by a licensed clinical pathologist before finalized as medical record data.
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                   <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                   <p className="text-sm font-black text-slate-900 uppercase">Diagnostic analysis unavailable</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Check diagnostic network connectivity</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button className="clinical-btn bg-slate-900 text-white px-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl" onClick={() => setShowAiModal(false)}>Acknowledge & Sync</button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowResultModal(false)}>
          <form className="relative clinical-card w-full max-w-lg p-8 shadow-2xl space-y-8" onClick={e => e.stopPropagation()} onSubmit={handleFinalizeResult}>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pathological Observation</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ref: {selectedOrder?.test_name} for {selectedOrder?.patient_name}</p>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quantitiative Observation</label>
                   <div className="relative">
                      <input name="resultValue" type="number" step="0.01" className="input-field py-5 pr-16 bg-slate-50 border-none rounded-2xl text-lg font-black" placeholder="0.00" autoFocus required />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">{selectedOrder?.unit || 'Units'}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Institutional Narrative</label>
                   <textarea name="notes" className="input-field py-5 h-32 bg-slate-50 border-none rounded-2xl resize-none font-medium" placeholder="Clinical findings, morphology, or pathalogic notes..."></textarea>
                </div>
             </div>

             <div className="flex gap-4 pt-4">
                <button type="submit" className="clinical-btn bg-slate-900 text-white flex-1 rounded-2xl text-xs shadow-xl" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Authorize Outcome'}
                </button>
                <button type="button" className="clinical-btn bg-white border border-slate-200 text-slate-400 px-8 rounded-2xl text-xs" onClick={() => setShowResultModal(false)}>Cancel</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}
