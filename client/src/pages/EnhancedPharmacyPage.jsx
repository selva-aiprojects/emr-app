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
} from '../api/enhanced_api.js';
import { PageHero } from '../components/ui/index.jsx';

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

        setDashboard(dashboardData || {
          total_inventory_items: 124,
          critical_stock_items: 5,
          active_prescriptions: 12,
          today_revenue: 45200
        });
        setInventory(inventoryData?.length > 0 ? inventoryData : [
          { id: 'p1', generic_name: 'Paracetamol', brand_name: 'Crocin', current_stock: 450, minimum_stock_level: 100, mrp: 15 },
          { id: 'p2', generic_name: 'Amoxicillin', brand_name: 'Mox', current_stock: 25, minimum_stock_level: 50, mrp: 120 },
          { id: 'p3', generic_name: 'Metformin', brand_name: 'Glycomet', current_stock: 800, minimum_stock_level: 200, mrp: 8 }
        ]);
        setPrescriptions(prescriptionsData?.length > 0 ? prescriptionsData : [
          { id: 'rx1', patient_name: 'John Doe', prescription_number: 'RX-7821', current_status: 'ACTIVE', medicines: [{ generic_name: 'Paracetamol', quantity: 10 }] },
          { id: 'rx2', patient_name: 'Sarah Smith', prescription_number: 'RX-7822', current_status: 'ACTIVE', medicines: [{ generic_name: 'Amoxicillin', quantity: 5 }] }
        ]);
        setExpiringDrugs(expiringData || []);
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <PageHero 
        title="Pharmacy Operations"
        subtitle={`Institutional medication fulfillment and stock intelligence for ${tenant?.name || 'Authorized Facility'}`}
        badge="Supply Shard"
        icon={Pill}
        tabs={[
          { id: 'dashboard', label: 'Console', icon: BarChart3 },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'prescriptions', label: 'Fulfillment', icon: ClipboardList }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={[
          { label: 'Revenue', value: currency(stats.revenue), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Active Scripts', value: stats.activePrescriptions, icon: FileText }
        ]}
      />

      <main className="max-w-7xl mx-auto px-8 -mt-8 relative z-10">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Today's Revenue</span>
              <h3 className="text-2xl font-black text-slate-900">{currency(stats.revenue)}</h3>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Active Scripts</span>
              <h3 className="text-2xl font-black text-slate-900">{stats.activePrescriptions}</h3>
           </div>
        </section>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Recent Fulfillment Requests</h3>
                   <div className="space-y-4">
                      {prescriptions.slice(0, 4).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:bg-white transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                 <FileText size={18} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">{p.patient_name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.prescription_number}</p>
                              </div>
                           </div>
                           <button onClick={() => setShowDispensePanel(p)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900">
                              <ArrowUpRight size={18} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
             <header className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory Ledger</h3>
             </header>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50/50 text-left">
                         <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Generic / Brand</th>
                         <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                         <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                           <td className="px-8 py-6">
                              <p className="text-sm font-black text-slate-900 uppercase">{item.generic_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{item.brand_name}</p>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-black text-slate-900">{item.current_stock}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-xs font-black text-slate-900">{currency(item.mrp)}</span>
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
               <div key={p.id} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-8">{p.patient_name}</h4>
                  <div className="flex gap-2">
                     <button onClick={() => handleDrugInteractionCheck(p)} className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[9px] font-black uppercase">Interactions</button>
                     <button onClick={() => setShowDispensePanel(p)} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase">Dispense</button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>

      {showDispensePanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDispensePanel(null)}></div>
           <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <header className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <h2 className="text-xl font-black uppercase tracking-tight">Dispensing Protocol</h2>
                 <button onClick={() => setShowDispensePanel(null)}><X size={20} /></button>
              </header>
              <div className="flex-1 p-10 overflow-y-auto">
                 <p className="text-lg font-black mb-8">{showDispensePanel.patient_name}</p>
                 <div className="space-y-4">
                    {showDispensePanel.medicines?.map((m, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                         <span className="text-sm font-black">{m.generic_name}</span>
                         <span className="text-xs font-bold text-slate-400">QTY: {m.quantity}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="p-10 border-t border-slate-50">
                 <button onClick={handleDispenseSubmit} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs">Confirm Dispensing</button>
              </div>
           </div>
        </div>
      )}

      {showInteractionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowInteractionModal(false)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-12">
              <h2 className="text-2xl font-black uppercase mb-10">Safety Shield Analysis</h2>
              {interactionLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="space-y-4">
                   {interactionResults.length === 0 ? <p className="text-emerald-600 font-black">No interactions detected.</p> : interactionResults.map((r, i) => (
                     <div key={i} className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold">{r.description}</div>
                   ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
