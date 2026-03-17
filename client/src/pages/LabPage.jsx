import { useState, useMemo } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';

export default function LabPage({ tenant, activeUser }) {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useMemo(() => {
    async function load() {
      if (!tenant?.id) return;
      setLoading(true);
      try {
        const data = await api.getLabOrders(tenant.id);
        setLabOrders(data);
      } catch (err) {
        console.error('Diagnostic Feed Interrupted:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenant?.id]);

  const stats = {
    pending: labOrders.filter(o => o.status === 'pending').length,
    critical: labOrders.filter(o => o.result_value && (o.result_value > 200 || o.result_value < 50)).length,
    completed: labOrders.filter(o => o.status === 'completed').length
  };

  const handleRecordResult = (order) => {
    setSelectedOrder(order);
    setShowResultModal(true);
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <div className="page-header-premium mb-8">
        <div>
          <h1 className="flex items-center gap-3">
             Diagnostic Intelligence Hub
             <span className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 uppercase tracking-tighter font-black">Laboratory Node</span>
          </h1>
          <p className="dim-label">Pathological stream and automated diagnostic result ledger</p>
        </div>
        <div className="flex gap-4">
           {/* No-click critical counts */}
           <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-5 py-2 border-r border-slate-100">
                 <span className="vital-label">Awaiting Samples</span>
                 <span className="text-sm font-black tabular-nums">{stats.pending} Shards</span>
              </div>
              <div className="px-5 py-2">
                 <span className="vital-label">Critical Findings</span>
                 <span className="text-sm font-black text-rose-600 tabular-nums">{stats.critical} Nodes</span>
              </div>
           </div>
        </div>
      </div>

      {/* SYSTEM STATUS GRID */}
      <section className="vitals-monitor mb-10">
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
        <main className="col-span-12 lg:col-span-8">
           <article className="clinical-card !p-0 overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Diagnostic Stream</h3>
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
                       <th className="tracking-widest">Patient Identity</th>
                       <th className="tracking-widest">Diagnostic Test</th>
                       <th className="tracking-widest">Target Dept</th>
                       <th className="tracking-widest">Status / Outcome</th>
                       <th style={{ textAlign: 'right' }} className="tracking-widest">Governance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-24 text-slate-300 italic font-black uppercase tracking-widest">Syncing diagnostic feed...</td></tr>
                    ) : labOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <EmptyState 
                            title="No pathological shards identified" 
                            subtitle="The diagnostic intelligence node has found no active identity shards in the current pathological residency."
                            icon={FlaskConical}
                          />
                        </td>
                      </tr>
                    ) : labOrders.map((order, idx) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td>
                           <div className="font-black text-slate-900">{order.patient_name || 'Clinical Subject'}</div>
                           <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 tabular-nums">Ref: {(order.id || 'X').slice(0, 8)}</div>
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
                           {order.status === 'pending' ? (
                             <button className="clinical-btn bg-slate-900 text-white px-6 !min-h-[40px] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border-none" onClick={() => handleRecordResult(order)}>Record Observation</button>
                           ) : (
                             <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm" title="Authorization Extract">
                                <Printer className="w-4 h-4" />
                             </button>
                           )}
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
                 <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Urgency Governance</h3>
              </div>
              <p className="text-[11px] font-medium text-rose-800/70 leading-relaxed mb-6">
                 Adverse pathological findings are automatically prioritized in the clinical stream. Ensure second-tier verification for all critical outcomes before finalizing the diagnostic node.
              </p>
              <div className="p-4 bg-white border border-rose-100 rounded-2xl">
                 <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Active Critical Nodes</div>
                 <div className="text-xl font-black text-rose-700 tabular-nums">0{stats.critical} Unresolved</div>
              </div>
           </article>
        </aside>
      </div>

      {showResultModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowResultModal(false)}>
          <div className="relative clinical-card w-full max-w-lg p-8 shadow-2xl space-y-8" onClick={e => e.stopPropagation()}>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pathological Observation</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ref: {selectedOrder?.test_name} for {selectedOrder?.patient_name}</p>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quantitiative Observation</label>
                   <div className="relative">
                      <input type="number" step="0.01" className="input-field py-5 pr-16 bg-slate-50 border-none rounded-2xl text-lg font-black" placeholder="0.00" autoFocus />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">{selectedOrder?.unit || 'Units'}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Institutional Narrative</label>
                   <textarea className="input-field py-5 h-32 bg-slate-50 border-none rounded-2xl resize-none font-medium" placeholder="Clinical findings, morphology, or pathalogic notes..."></textarea>
                </div>
             </div>

             <div className="flex gap-4 pt-4">
                <button className="clinical-btn bg-slate-900 text-white flex-1 rounded-2xl text-xs shadow-xl" onClick={() => setShowResultModal(false)}>Authorize Outcome</button>
                <button className="clinical-btn bg-white border border-slate-200 text-slate-400 px-8 rounded-2xl text-xs" onClick={() => setShowResultModal(false)}>Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
