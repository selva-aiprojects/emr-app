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
      o.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id?.toString().includes(searchTerm)
    );
  }, [labOrders, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <header className="page-header-premium bg-slate-900 border-none shadow-2xl px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
           <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                 Diagnostic Command
                 <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-tighter font-black backdrop-blur-md">Lab Shard</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm mt-1">Real-time pathology tracking and clinical diagnostic analytics for {tenant?.name}.</p>
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
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pending Load</span>
              <h3 className="text-2xl font-black text-slate-900">{stats.pending}</h3>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Validated Outcomes</span>
              <h3 className="text-2xl font-black text-slate-900">{stats.completed}</h3>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Critical Shards</span>
              <h3 className="text-2xl font-black text-rose-600">{stats.critical}</h3>
           </div>
        </section>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Diagnostic Queue Preview</h3>
                   <div className="space-y-4">
                      {filteredOrders.slice(0, 5).map(o => (
                        <div key={o.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:bg-white transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                 <FlaskConical size={18} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">{o.patient_name || 'Clinical Subject'}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{o.test_name}</p>
                              </div>
                           </div>
                           <button onClick={() => o.status === 'pending' ? handleRecordResult(o) : handleAiInterpretation(o)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900">
                              <ArrowUpRight size={18} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
             <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Diagnostic Ledger</h3>
             </header>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 text-left">
                         <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                         <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Shard</th>
                         <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                         <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                           <td className="px-8 py-6">
                              <p className="text-sm font-black text-slate-900 uppercase">{o.patient_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">MRN: {o.patient_id?.slice(0, 8)}</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-xs font-black text-slate-700 uppercase">{o.test_name}</p>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`text-[10px] font-black uppercase ${o.status === 'completed' ? 'text-emerald-700' : 'text-amber-600'}`}>{o.status}</span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              {o.status === 'pending' ? (
                                <button onClick={() => handleRecordResult(o)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">Commit</button>
                              ) : (
                                <button onClick={() => handleAiInterpretation(o)} className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><BrainCircuit size={16} /></button>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>

      {showResultModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowResultModal(false)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-12 animate-scale-up">
              <h2 className="text-2xl font-black uppercase mb-10">Diagnostic Authorization</h2>
              <form onSubmit={handleFinalizeResult} className="space-y-8">
                 <input name="resultValue" type="number" step="0.01" className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl text-3xl font-black outline-none" placeholder="0.00" required />
                 <textarea name="notes" className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl text-sm min-h-[160px] outline-none" placeholder="Narrative..."></textarea>
                 <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs">Commit Outcome</button>
              </form>
           </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowAiModal(false)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-12">
              <h2 className="text-2xl font-black uppercase mb-10">Diagnostic AI Suite</h2>
              {aiLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="p-8 bg-slate-50 rounded-[40px]">
                   <p className="text-sm font-medium italic">"{aiAnalysis?.interpretation}"</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
