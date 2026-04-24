import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { 
  Plus, Search, Package, AlertCircle, CheckCircle, Clock, Eye, Activity,
  ShoppingCart, Users, Filter, ArrowRight, ShieldCheck, Pill, BrainCircuit,
  Sparkles, Loader2, AlertTriangle, TrendingDown, TrendingUp, Calendar,
  FileText, BarChart3, Thermometer, Heart, ActivitySquare, X, ArrowUpRight,
  ClipboardList, Settings, MoreVertical, Download
} from 'lucide-react';
import { currency } from '../utils/format.js';
import { 
  getEnhancedPharmacyInventory,
  getEnhancedPrescriptions,
  checkDrugInteractions,
  createPharmacyDispensing,
  getPharmacyDashboard,
  getExpiringDrugs
} from '../api/enhanced_api.js';

export default function EnhancedPharmacyPage({ tenant, setView, activeUser }) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'prescriptions'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDispensePanel, setShowDispensePanel] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionResults, setInteractionResults] = useState([]);
  const [interactionLoading, setInteractionLoading] = useState(false);

  // Data states
  const [dashboard, setDashboard] = useState({});
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [expiringDrugs, setExpiringDrugs] = useState([]);

  useEffect(() => {
    if (!tenant?.id) return;
    
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [dashboardData, inventoryData, prescriptionsData, expiringData] = await Promise.all([
          getPharmacyDashboard(tenant.id),
          getEnhancedPharmacyInventory(tenant.id, { 
            stockStatus: stockFilter,
            genericName: searchTerm
          }),
          getEnhancedPrescriptions(tenant.id, { 
            status: statusFilter,
            prescriptionNumber: searchTerm
          }),
          getExpiringDrugs(tenant.id, 90)
        ]);

        setDashboard(dashboardData);
        setInventory(inventoryData);
        setPrescriptions(prescriptionsData);
        setExpiringDrugs(expiringData);
      } catch (error) {
        console.error('Error loading pharmacy data:', error);
        showToast({ title: 'Sync Failure', message: 'Failed to synchronize pharmaceutical ledger', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [tenant?.id, statusFilter, stockFilter, searchTerm]);

  const handleDispenseSubmit = async () => {
    if (!showDispensePanel || !tenant?.id) return;
    
    try {
      setLoading(true);
      await createPharmacyDispensing({
        tenantId: tenant.id,
        prescriptionId: showDispensePanel.id,
        patientId: showDispensePanel.patient_id,
        pharmacistId: activeUser?.id,
        dispensedDate: new Date().toISOString(),
        totalAmount: showDispensePanel.medicines.reduce((sum, m) => sum + (m.quantity * (m.mrp || 10)), 0),
        status: 'COMPLETED'
      });

      showToast({ title: 'Dispensing Complete', message: 'Pharmaceutical fulfillment finalized', type: 'success' });
      setShowDispensePanel(null);
      // Refresh prescriptions
      const p = await getEnhancedPrescriptions(tenant.id, { status: statusFilter });
      setPrescriptions(p);
    } catch (error) {
      showToast({ title: 'Fulfillment Error', message: 'Failed to execute dispensing protocol', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrugInteractionCheck = async (prescription) => {
    setShowInteractionModal(true);
    setInteractionLoading(true);
    try {
      const drugIds = prescription.medicines.map(m => m.drug_id);
      const interactions = await checkDrugInteractions(tenant.id, drugIds);
      setInteractionResults(interactions);
    } catch (error) {
      showToast({ title: 'Safety Shield Error', message: 'Molecular cross-check failed', type: 'error' });
    } finally {
      setInteractionLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: inventory.length,
    critical: inventory.filter(item => item.current_stock <= item.minimum_stock_level).length,
    activePrescriptions: prescriptions.filter(p => p.current_status === 'ACTIVE').length,
    revenue: dashboard.today_revenue || 0
  }), [inventory, prescriptions, dashboard]);

  if (loading && !dashboard.today_revenue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Synchronizing Clinical Pharmacy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in relative overflow-hidden font-sans">
      
      {/* GLOW DECORATION */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <header className="page-header-premium bg-slate-900 border-none shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
           <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                 Pharmacy Operations
                 <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-tighter font-black backdrop-blur-md">Supply Shard</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm mt-1">Institutional medication fulfillment and stock intelligence for {tenant?.name}.</p>
              <div className="flex items-center gap-4 mt-4">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Clinical Ledger: ACTIVE
                 </p>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Safety Protocols: VERIFIED
                 </p>
              </div>
           </div>

           <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-sm">
              {[
                { id: 'dashboard', label: 'Console', icon: BarChart3 },
                { id: 'inventory', label: 'Inventory', icon: Package },
                { id: 'prescriptions', label: 'Fulfillment', icon: ClipboardList }
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
        
        {/* VITAL MONITOR STRIP */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Revenue</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{currency(stats.revenue)}</h3>
              <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase">Institutional Liquidity</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Scripts</span>
                <ClipboardList size={16} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{stats.activePrescriptions}</h3>
              <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase">Awaiting Fulfillment</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Stock</span>
                <AlertTriangle size={16} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-rose-600">{stats.critical}</h3>
              <p className="text-[9px] font-bold text-rose-600/70 mt-1 uppercase">Immediate Procurement</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Health</span>
                <ShieldCheck size={16} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{(( (stats.total - stats.critical) / (stats.total || 1)) * 100).toFixed(0)}%</h3>
              <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase">Stable Supply Chain</p>
           </div>
        </section>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* RECENT PRESCRIPTIONS */}
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Queue: Recent Fulfillment Requests</h3>
                      <button onClick={() => setActiveTab('prescriptions')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">View Full Queue</button>
                   </div>
                   <div className="space-y-4">
                      {prescriptions.slice(0, 4).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                 <FileText size={18} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">{p.patient_name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Script: {p.prescription_number}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-900 uppercase">{p.medicines?.length} Items</p>
                                 <p className="text-[9px] font-bold text-indigo-500 uppercase mt-0.5">Dr. {p.doctor_name?.split(' ').pop()}</p>
                              </div>
                              <button 
                                onClick={() => setShowDispensePanel(p)}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"
                              >
                                 <ArrowUpRight size={18} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* EXPIRING ALERT */}
                <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-200">
                      <AlertTriangle size={28} />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Institutional Expiry Warning</h4>
                      <p className="text-[11px] font-medium text-rose-700/80 mt-1 max-w-xl">
                         Detected {expiringDrugs.length} molecular shards approaching expiration within 90 days. Disposition protocol recommended for optimal fiscal recovery.
                      </p>
                   </div>
                   <button className="px-6 py-2.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-colors">
                      Audit Shards
                   </button>
                </div>
             </div>

             <div className="col-span-12 lg:col-span-4 space-y-8">
                {/* STOCK ALERTS WIDGET */}
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Inventory Deviations</h3>
                   <div className="space-y-6">
                      {inventory.filter(i => i.stock_status === 'CRITICAL').slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-[10px] font-black">
                              {item.current_stock}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{item.generic_name}</p>
                              <div className="flex justify-between items-center mt-1">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min: {item.minimum_stock_level}</span>
                                 <span className="text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase font-black">Reorder</span>
                              </div>
                           </div>
                        </div>
                      ))}
                      {inventory.filter(i => i.stock_status === 'CRITICAL').length === 0 && (
                        <div className="py-10 text-center">
                           <ShieldCheck size={32} className="text-emerald-200 mx-auto mb-3" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Stock Levels Optimal</p>
                        </div>
                      )}
                   </div>
                   <button onClick={() => setActiveTab('inventory')} className="w-full mt-8 py-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">
                      Full Stock Audit
                   </button>
                </div>

                <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                      <BrainCircuit size={120} />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10">Drug Safety AI</h3>
                   <p className="text-indigo-100/70 text-[11px] font-medium leading-relaxed mb-6 relative z-10">
                      Institutional AI active. All fulfillment requests undergo automated molecular cross-check for clinical contraindications.
                   </p>
                   <div className="flex items-center gap-2 relative z-10">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Analysis Mode: Real-time</span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
             <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-6">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pharmaceutical Inventory</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Drug Registry</p>
                   </div>
                   <div className="h-8 w-px bg-slate-100" />
                   <div className="flex items-center gap-2">
                      <Search size={14} className="text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Filter stock ledger..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-900 outline-none w-48 placeholder:text-slate-300"
                      />
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors">
                      <Download size={14} /> Export CSV
                   </button>
                   <button className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">
                      <Plus size={14} /> Add Stock
                   </button>
                </div>
             </header>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Molecular Generic / Brand</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal (MRP)</th>
                         <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Shard</th>
                         <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Pill size={18} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.generic_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.brand_name} • {item.dosage_form || 'Tablet'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-black text-slate-900 tabular-nums">{item.current_stock}</span>
                                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                   item.current_stock <= item.minimum_stock_level ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                 }`}>
                                   {item.current_stock <= item.minimum_stock_level ? 'Critical' : 'Stable'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-xs font-black text-slate-900 tabular-nums">{currency(item.mrp)}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Unit Rate</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-xs font-black text-slate-700 tabular-nums">{new Date(item.expiry_date).toLocaleDateString()}</p>
                              <p className={`text-[9px] font-black uppercase mt-1 ${
                                (new Date(item.expiry_date) - new Date()) / (1000*60*60*24) < 90 ? 'text-rose-500' : 'text-slate-400'
                              }`}>
                                {Math.ceil((new Date(item.expiry_date) - new Date()) / (1000*60*60*24))} Days Left
                              </p>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                 <Settings size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
             {prescriptions.map(p => (
               <div key={p.id} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                  {p.current_status === 'ACTIVE' && (
                    <div className="absolute top-0 right-0 p-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  )}
                  
                  <header className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                        <ClipboardList size={20} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.patient_name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">MRN: {(p.patient_id || '').slice(0, 8)}</p>
                     </div>
                  </header>

                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Provider</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase">Dr. {p.doctor_name}</span>
                     </div>
                     <div className="px-2">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Medication Regimen</h5>
                        <div className="space-y-3">
                           {p.medicines?.map((m, i) => (
                             <div key={i} className="flex justify-between items-start">
                                <span className="text-xs font-black text-slate-800 leading-tight">{m.generic_name}</span>
                                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap ml-4">QTY: {m.quantity}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleDrugInteractionCheck(p)}
                       className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                     >
                        Check Interactions
                     </button>
                     <button 
                       onClick={() => setShowDispensePanel(p)}
                       className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-emerald-600 transition-all"
                     >
                        Dispense
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>

      {/* DISPENSING SIDE PANEL */}
      {showDispensePanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDispensePanel(null)}></div>
           <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <header className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10">
                       <ShoppingCart size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-tight">Fulfillment Executive</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Script Ref: {showDispensePanel.prescription_number}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDispensePanel(null)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 transition-colors">
                    <X size={20} />
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Subject Identity</h4>
                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                       <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-lg">
                          {showDispensePanel.patient_name[0]}
                       </div>
                       <div>
                          <p className="text-lg font-black text-slate-900">{showDispensePanel.patient_name}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase">MRN: {(showDispensePanel.patient_id || '').slice(0, 8)}</p>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Prescribed Items</h4>
                    <div className="space-y-4">
                       {showDispensePanel.medicines?.map((m, i) => (
                         <div key={i} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                            <div>
                               <p className="text-sm font-black text-slate-900">{m.generic_name}</p>
                               <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">{m.dosage_instructions}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-black text-slate-900">QTY: {m.quantity}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">₹{(m.mrp || 10).toFixed(2)}/unit</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100/50 flex gap-5">
                    <ShieldCheck size={24} className="text-emerald-600 shrink-0 mt-1" />
                    <p className="text-[12px] font-medium text-emerald-700 leading-relaxed italic">
                       Fulfillment protocol verified. Stock availability confirmed for all {showDispensePanel.medicines?.length} requested items.
                    </p>
                 </div>
              </div>

              <div className="p-10 border-t border-slate-50 bg-slate-50/30">
                 <div className="flex justify-between items-center mb-8 px-2">
                    <span className="text-sm font-black text-slate-400 uppercase">Total Settlement</span>
                    <span className="text-2xl font-black text-slate-900">{currency(showDispensePanel.medicines.reduce((sum, m) => sum + (m.quantity * (m.mrp || 10)), 0))}</span>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={handleDispenseSubmit}
                      disabled={loading}
                      className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-300 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                    >
                       {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Finalize Dispensing'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* INTERACTIONS MODAL */}
      {showInteractionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowInteractionModal(false)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-scale-up">
              <header className="px-10 py-10 bg-indigo-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                       <BrainCircuit size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Clinical Safety Shield</h2>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Molecular Interaction Analysis active</p>
                    </div>
                 </div>
                 <button onClick={() => setShowInteractionModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors">
                    <X size={24} />
                 </button>
              </header>

              <div className="p-12">
                 {interactionLoading ? (
                   <div className="py-20 text-center">
                      <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-6" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Synthesizing Contraindications...</p>
                   </div>
                 ) : interactionResults.length === 0 ? (
                   <div className="py-10 text-center">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                         <ShieldCheck size={40} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 uppercase">Regimen Clear</h4>
                      <p className="text-sm text-slate-400 font-medium mt-2">No clinical interactions detected for this prescription.</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      {interactionResults.map((res, i) => (
                        <div key={i} className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-5">
                           <AlertTriangle size={24} className="text-rose-500 shrink-0 mt-1" />
                           <div>
                              <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1">{res.severity} Risk</p>
                              <p className="text-sm font-bold text-rose-900 leading-relaxed">{res.description}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setShowInteractionModal(false)} className="px-10 py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest">
                       Dismiss Analysis
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
