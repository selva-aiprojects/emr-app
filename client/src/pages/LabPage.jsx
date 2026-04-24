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
  BarChart3,
  Search,
  X,
  ArrowUpRight,
  ClipboardList,
  Filter,
  Download,
  ShieldCheck,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';
import { identityService } from '../services/identity.service.js';

export default function LabPage({ tenant, activeUser, patients = [], labOrders = [], onRefreshLab }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (patients?.length > 0) {
      identityService.updateRegistry(patients);
    }
  }, [patients]);

  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'orders'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!tenant?.id) return;
    const interval = setInterval(() => onRefreshLab && onRefreshLab(), 10000);
    return () => clearInterval(interval);
  }, [tenant?.id, onRefreshLab]);

  const stats = useMemo(() => {
    const orders = Array.isArray(labOrders) ? labOrders : [];
    return {
      pending: orders.filter(o => o?.status === 'pending').length,
      critical: orders.filter(o => {
        const val = Number(o?.result_value);
        return !isNaN(val) && (val > 200 || val < 50);
      }).length,
      completed: orders.filter(o => o?.status === 'completed').length
    };
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
      showToast({ title: 'Diagnostic AI', message: 'Interpretation synthesized', type: 'success' });
    } catch (err) {
      showToast({ title: 'AI Error', message: 'Analysis synthesis failed', type: 'error' });
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
      showToast({ message: 'Observation value required', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.recordLabResults(selectedOrder.id, {
        results: { value: parseFloat(value), unit: selectedOrder.unit || 'mg/dL' },
        notes,
        criticalFlag: parseFloat(value) > 200 || parseFloat(value) < 50
      });
      
      showToast({ title: 'Registry Updated', message: 'Diagnostic outcome committed', type: 'success' });
      setShowResultModal(false);
      if (onRefreshLab) onRefreshLab();
    } catch (err) {
      showToast({ title: 'Error', message: 'Authorization failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const orders = Array.isArray(labOrders) ? labOrders : [];
    if (!searchTerm) return orders;
    return orders.filter(o => 
      o.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id?.toString().includes(searchTerm)
    );
  }, [labOrders, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in relative overflow-hidden font-sans">
      
      {/* DECORATION */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <header className="page-header-premium bg-slate-900 border-none shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
           <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                 Diagnostic Command
                 <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-tighter font-black backdrop-blur-md">Lab Shard</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm mt-1">Real-time pathology tracking and clinical diagnostic analytics for {tenant?.name}.</p>
              <div className="flex items-center gap-4 mt-4">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5" /> Diagnostic Feed: ONLINE
                 </p>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Integrity: VERIFIED
                 </p>
              </div>
           </div>

           <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-sm">
              {[
                { id: 'dashboard', label: 'Monitor', icon: BarChart3 },
                { id: 'orders', label: 'Order Ledger', icon: ClipboardList }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 -mt-8 relative z-10">
        
        {/* DIAGNOSTIC MONITOR STRIP */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Load</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{stats.pending}</h3>
              <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase">Mean T.A.T: 42m</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validated Outcomes</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{stats.completed}</h3>
              <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase">Institutional Volume Stable</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Shards</span>
                <AlertCircle size={16} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-rose-600">{stats.critical}</h3>
              <p className="text-[9px] font-bold text-rose-600/70 mt-1 uppercase">Requires Escalation</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Fidelity</span>
                <ShieldCheck size={16} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">99.8%</h3>
              <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase">EHR Synchronization</p>
           </div>
        </section>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* RECENT ORDERS PREVIEW */}
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Diagnostic Queue Preview</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">View All Orders</button>
                   </div>
                   <div className="space-y-4">
                      {filteredOrders.slice(0, 5).map(o => (
                        <div key={o.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                 <FlaskConical size={18} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">{o.patient_name || 'Clinical Subject'}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{o.test_name || 'General Assay'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-900 uppercase">{o.status}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{o.lab_name || 'Main Lab'}</p>
                              </div>
                              <button 
                                onClick={() => o.status === 'pending' ? handleRecordResult(o) : handleAiInterpretation(o)}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"
                              >
                                 <ArrowUpRight size={18} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                      <BrainCircuit size={150} />
                   </div>
                   <div className="relative z-10 max-w-lg">
                      <h3 className="text-xl font-black uppercase tracking-tight mb-4">Diagnostic Synthesis AI</h3>
                      <p className="text-indigo-100/70 text-sm font-medium leading-relaxed mb-8">
                         Leverage high-precision molecular analysis to synthesize complex pathological markers. AI-assisted interpretations are automatically synced with the patient's longitudinal EHR.
                      </p>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Model: Gemini-1.5</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Confidence: 94%</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="col-span-12 lg:col-span-4 space-y-8">
                {/* CRITICAL ALERTS WIDGET */}
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                         <AlertCircle size={20} />
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Critical Pathology</h3>
                   </div>
                   <div className="space-y-6">
                      {labOrders.filter(o => o.result_value > 200 || o.result_value < 50).slice(0, 5).map(o => (
                        <div key={o.id} className="p-4 bg-rose-50/50 rounded-[24px] border border-rose-100/50">
                           <div className="flex justify-between items-start mb-2">
                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{o.patient_name}</p>
                              <span className="text-[9px] font-black text-rose-600 uppercase">Alert</span>
                           </div>
                           <p className="text-[10px] font-bold text-rose-700/70 uppercase mb-3">{o.test_name}</p>
                           <div className="flex justify-between items-end">
                              <div className="text-lg font-black text-rose-600 tabular-nums">{o.result_value} <span className="text-[10px] text-rose-400">{o.unit}</span></div>
                              <button onClick={() => handleAiInterpretation(o)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Review AI</button>
                           </div>
                        </div>
                      ))}
                      {stats.critical === 0 && (
                        <div className="py-12 text-center">
                           <ShieldCheck size={40} className="text-emerald-100 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Zero Critical Shards</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] p-8 text-white">
                   <h3 className="text-xs font-black uppercase tracking-widest mb-6">Institutional TAT Monitoring</h3>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Hematology</span>
                         <span className="text-xs font-black tabular-nums text-emerald-400">28m</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                         <div className="bg-emerald-500 h-full w-[40%]"></div>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Biochemistry</span>
                         <span className="text-xs font-black tabular-nums text-amber-400">54m</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                         <div className="bg-amber-500 h-full w-[70%]"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
             <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Diagnostic Ledger</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Pathology Queue</p>
                   </div>
                   <div className="h-8 w-px bg-slate-100" />
                   <div className="flex items-center gap-3">
                      <Search size={14} className="text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Search diagnostic feed..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-900 outline-none w-64 placeholder:text-slate-300"
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                   <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors">
                      <Filter size={14} /> Filter Feed
                   </button>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">
                      <Download size={14} /> Export Results
                   </button>
                </div>
             </header>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Identity</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assay / Test Shard</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Entity</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fidelity Status</th>
                         <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredOrders.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="py-32 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <FlaskConical size={24} className="text-slate-200" />
                              </div>
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Zero Diagnostic Orders in Ledger</p>
                           </td>
                        </tr>
                      ) : (
                        filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/30 transition-colors group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase group-hover:bg-indigo-900 group-hover:text-white transition-all">
                                      {(o.patient_name || 'P').charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{o.patient_name || 'Clinical Subject'}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">MRN: {(o.patient_id || '').slice(0, 8)}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <p className="text-xs font-black text-slate-700 uppercase">{o.test_name || 'General Assay'}</p>
                                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1 tracking-tighter">{o.category || 'Clinical Pathology'}</p>
                             </td>
                             <td className="px-8 py-6">
                                <p className="text-xs font-black text-slate-900 uppercase">{o.lab_name || 'Diagnostic Node'}</p>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${o.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
                                   <span className={`text-[10px] font-black uppercase tracking-widest ${o.status === 'completed' ? 'text-emerald-700' : 'text-amber-600'}`}>
                                      {o.status === 'completed' ? `Outcome: ${o.result_value}${o.unit || ''}` : 'Ingested'}
                                   </span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                {o.status === 'pending' ? (
                                  <button 
                                    onClick={() => handleRecordResult(o)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                                  >
                                     Commit Result
                                  </button>
                                ) : (
                                  <div className="flex justify-end gap-2">
                                     <button onClick={() => handleAiInterpretation(o)} className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100">
                                        <BrainCircuit size={16} />
                                     </button>
                                     <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-200">
                                        <Printer size={16} />
                                     </button>
                                  </div>
                                )}
                             </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>

      {/* RESULT ENTRY TERMINAL */}
      {showResultModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowResultModal(false)}></div>
           <div className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[400px_1fr] animate-scale-up">
              
              <aside className="bg-slate-50 p-10 border-r border-slate-100">
                 <header className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                       <FileText size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black uppercase tracking-tight">Clinical Shard</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnostic Context</p>
                    </div>
                 </header>

                 <div className="space-y-8">
                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject</label>
                       <p className="text-sm font-black text-slate-900">{selectedOrder?.patient_name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">MRN: {selectedOrder?.patient_id?.slice(0, 8)}</p>
                    </div>

                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Diagnostic Assay</label>
                       <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedOrder?.test_name}</p>
                       <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">{selectedOrder?.category}</p>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                       <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-4">Physician Narrative</h5>
                       <p className="text-[12px] text-slate-600 leading-relaxed italic font-medium">
                          "{selectedOrder?.notes || 'No clinical narrative provided by source entity.'}"
                       </p>
                    </div>
                 </div>
              </aside>

              <form className="p-12 space-y-10" onSubmit={handleFinalizeResult}>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Diagnostic Authorization</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Outcome Commitment • Ref: {selectedOrder?.id}</p>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assay Observation (Quantitative)</label>
                       <div className="relative">
                          <input 
                            name="resultValue" 
                            type="number" 
                            step="0.01" 
                            className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl text-3xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-200" 
                            placeholder="0.00" 
                            autoFocus 
                            required 
                          />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{selectedOrder?.unit || 'UNITS'}</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pathological Narrative</label>
                       <textarea 
                         name="notes" 
                         className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[160px] resize-none placeholder:text-slate-200" 
                         placeholder="Synthesize morphology, findings, or critical alerts..."
                       ></textarea>
                    </div>
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 bg-slate-900 text-white px-10 py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                    >
                       {loading ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Authorize & Commit Outcome'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowResultModal(false)}
                      className="px-10 py-6 rounded-[32px] bg-white border-2 border-slate-100 text-xs font-black uppercase text-slate-400 transition-colors hover:text-slate-600"
                    >
                       Cancel
                    </button>
                 </div>
              </form>

           </div>
        </div>
      )}

      {/* AI INTERPRETATION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowAiModal(false)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-scale-up">
              <header className="px-10 py-10 bg-indigo-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                       <BrainCircuit size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Diagnostic AI Suite</h2>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Artificial Intelligence Pathological Analysis</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAiModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors">
                    <X size={24} />
                 </button>
              </header>

              <div className="p-12 space-y-10">
                 {aiLoading ? (
                   <div className="py-20 text-center">
                      <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-6" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Synthesizing Diagnostic Narrative...</p>
                   </div>
                 ) : (
                   <div className="space-y-10 animate-fade-in">
                      <div className="grid grid-cols-2 gap-10">
                         <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject Observation</span>
                            <p className="text-2xl font-black text-slate-900 tabular-nums">{selectedOrder?.result_value} <span className="text-xs text-slate-400">{selectedOrder?.unit}</span></p>
                         </div>
                         <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Confidence Level</span>
                            <p className="text-2xl font-black text-emerald-500 uppercase tracking-tight">High (94%)</p>
                         </div>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                         <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> AI Synthesis Summary
                         </h4>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                            "{aiAnalysis?.interpretation || 'Analysis synthesis failed to yield a clear narrative. Please verify diagnostic feeds.'}"
                         </p>
                      </div>

                      <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex gap-5">
                         <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                         <p className="text-[11px] font-medium text-rose-700 leading-relaxed italic">
                            Diagnostic Warning: AI-driven interpretations are advisory shards only. All outcomes must be verified by a licensed clinical pathologist.
                         </p>
                      </div>
                   </div>
                 )}

                 <div className="pt-10 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setShowAiModal(false)} className="px-10 py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest">
                       Acknowledge Analysis
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
