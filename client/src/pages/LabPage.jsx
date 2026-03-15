import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { 
  Plus, 
  Search, 
  Download, 
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Eye,
  Activity,
  FlaskConical,
  Beaker,
  FileText,
  ChevronRight,
  TrendingUp,
  UserSearch
} from 'lucide-react';

const COMMON_TESTS = [
  { code: 'CBC', name: 'Complete Blood Count' },
  { code: 'BMP', name: 'Basic Metabolic Panel' },
  { code: 'LFT', name: 'Liver Function Test' },
  { code: 'RFT', name: 'Renal Function Test' },
  { code: 'GLUCOSE', name: 'Fasting Blood Glucose' },
  { code: 'LIPID', name: 'Lipid Profile' },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone' },
  { code: 'UA', name: 'Urinalysis' },
];

export default function LabPage({ tenant }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showResultModal, setShowResultModal] = useState(null);
  const [resultText, setResultText] = useState('');
  const [criticalFlag, setCriticalFlag] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadOrders();
  }, [activeTab, tenant]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? null : activeTab;
      const data = await api.getLabOrders(tenant?.id, status);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lab orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateLabOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleSubmitResult = async () => {
    if (!resultText.trim()) return;
    setSubmittingResult(true);
    try {
      await api.recordLabResults(showResultModal.id, {
        results: resultText,
        criticalFlag,
      });
      setShowResultModal(null);
      setResultText('');
      setCriticalFlag(false);
      loadOrders();
    } catch (err) {
      alert('Failed to record result: ' + err.message);
    } finally {
      setSubmittingResult(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.patient_first_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    order.patient_last_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    order.display?.toLowerCase().includes(searchValue.toLowerCase()) ||
    order.code?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const metrics = {
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in-progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    critical: orders.filter(o => {
      const parsed = o.notes ? JSON.parse(o.notes) : null;
      return parsed?.criticalFlag;
    }).length,
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <div className="page-header-premium mb-8">
        <div>
          <h1 className="flex items-center gap-3">
            Laboratory Diagnostics
            <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-3 py-1 rounded-full uppercase tracking-tighter border border-[var(--primary)]/10">Engine Active</span>
          </h1>
          <p>Precision diagnostic testing, pathology throughput, and verified clinical results.</p>
        </div>
        <button className="btn-primary py-4 px-10 text-[10px] uppercase tracking-[0.2em] shadow-xl group">
           <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
           New Laboratory Order
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-6 border-l-4 border-l-amber-500 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Analysis</p>
                 <h4 className="text-3xl font-black text-slate-900 mt-2">{metrics.pending}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                 <Clock className="w-6 h-6" />
              </div>
           </div>
           <p className="text-[9px] font-black text-amber-600 mt-4 uppercase tracking-[0.1em] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 14% Velocity increase
           </p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-blue-500 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing (WIP)</p>
                 <h4 className="text-3xl font-black text-slate-900 mt-2">{metrics.inProgress}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                 <Play className="w-6 h-6" />
              </div>
           </div>
           <p className="text-[9px] font-black text-blue-600 mt-4 uppercase tracking-[0.1em]">Active clinical cycles</p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-emerald-500 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported Today</p>
                 <h4 className="text-3xl font-black text-slate-900 mt-2">{metrics.completed}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                 <CheckCircle className="w-6 h-6" />
              </div>
           </div>
           <p className="text-[9px] font-black text-emerald-600 mt-4 uppercase tracking-[0.1em]">✓ Metadata synchronized</p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-rose-500 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Alerts</p>
                 <h4 className="text-3xl font-black text-slate-900 mt-2">{metrics.critical}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                 <Activity className="w-6 h-6" />
              </div>
           </div>
           <p className="text-[9px] font-black text-rose-600 mt-4 uppercase tracking-[0.1em]">Priority pathology queue</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {/* Main Ledger */}
          <article className="glass-panel p-0 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
               <div>
                  <div className="premium-tab-bar">
                    {['pending', 'in-progress', 'completed', 'all'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`premium-tab-item ${activeTab === tab ? 'active' : ''}`}
                      >
                        {tab.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    placeholder="Filter by MRN, patient or test..." 
                    className="input-field pl-12 pr-6 py-4 w-full md:w-80 text-sm font-bold bg-white"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnostic Hub</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Registry</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Chronology</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical State</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan="5" className="px-8 py-32 text-center text-slate-400 animate-pulse font-bold tracking-tighter">SYNCHRONIZING WITH PATHOLOGY CLOUD...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan="5" className="px-8 py-32 text-center text-slate-400 italic font-medium">No diagnostic requests detected in current clinical shard.</td></tr>
                    ) : filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <FlaskConical className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 lowercase first-letter:uppercase">{order.display || order.code}</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">CODE: {order.code}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-sm font-bold text-slate-800">{order.patient_first_name} {order.patient_last_name}</div>
                           <div className="text-[10px] text-slate-400 font-black uppercase mt-1">MRN: {order.patient_id?.slice(0, 8)}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-sm font-bold text-slate-700">{new Date(order.created_at).toLocaleDateString()}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Clinical Lead: {order.ordered_by_name || 'Staff'}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border ${
                             order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             order.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                             'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : order.status === 'in-progress' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                             {order.status}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button 
                             onClick={() => setShowResultModal(order)}
                             className="px-4 py-2 bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                           >
                              Manage Request
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </article>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-8">
           {/* Workable Sidebar */}
           <article className="glass-panel p-8">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Fast-Track Terminal</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Common Laboratory Node</p>
                 </div>
              </div>

              <div className="space-y-4">
                 {[
                   { icon: Plus, label: 'Authorize Lab Order', color: 'bg-emerald-50 text-emerald-600' },
                   { icon: UserSearch, label: 'Clinical Lookup', color: 'bg-blue-50 text-blue-600' },
                   { icon: Download, label: 'Export Batch Ledger', color: 'bg-indigo-50 text-indigo-600' },
                   { icon: FileText, label: 'Download Test List', color: 'bg-slate-50 text-slate-600' }
                 ].map((action, idx) => (
                   <button key={idx} className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[var(--primary)] hover:shadow-md transition-all group overflow-hidden">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <action.icon className="w-5 h-5" />
                         </div>
                         <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{action.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                   </button>
                 ))}
              </div>
           </article>

           {/* Reference Panel */}
           <article className="glass-panel p-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Standard Nomenclature</h3>
              <div className="space-y-3">
                 {COMMON_TESTS.map(test => (
                   <div key={test.code} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-lg group">
                      <span className="text-[10px] font-black text-[var(--primary)] font-mono px-2 py-0.5 bg-[var(--primary-soft)] rounded group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">{test.code}</span>
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis ml-4">{test.name}</span>
                   </div>
                 ))}
              </div>
           </article>
        </div>
      </div>

      {/* Result Entry Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl p-10 animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Record Clinical Finding</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Update diagnostic ledger for verification</p>
              </div>
              <button 
                onClick={() => setShowResultModal(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Account</label>
                  <p className="text-sm font-black text-slate-800 mt-1">{showResultModal.patient_first_name} {showResultModal.patient_last_name}</p>
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Test</label>
                   <p className="text-sm font-black text-indigo-600 mt-1 uppercase">{showResultModal.display || showResultModal.code}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pathology Findings (Results)</label>
                <textarea
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  className="input-field py-4 min-h-[160px] bg-white text-sm font-mono border-slate-200"
                  placeholder="Input detailed values, observations, or standard clinical conclusions..."
                />
              </div>

              <div className="flex items-center gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="critical"
                    checked={criticalFlag}
                    onChange={(e) => setCriticalFlag(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </div>
                <label htmlFor="critical" className="text-[11px] font-black uppercase tracking-widest text-rose-700 select-none">
                  Flag as Critical Narrative (High Priority Alert)
                </label>
              </div>

              <div className="pt-8 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() => setShowResultModal(null)}
                  className="flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmitResult}
                  disabled={submittingResult || !resultText.trim()}
                  className="flex-[2] btn-primary py-4 px-10 text-[11px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50"
                >
                  {submittingResult ? 'Synchronizing...' : 'Finalize & Dispatch Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
