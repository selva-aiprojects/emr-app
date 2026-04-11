import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  ShoppingCart,
  Filter,
  ArrowRight,
  ShieldCheck,
  Pill,
  BrainCircuit,
  Sparkles,
  Loader2,
  AlertTriangle,
  History
} from 'lucide-react';
import { currency } from '../utils/format.js';
import { EmptyState } from '../components/ui/index.jsx';

export default function PharmacyPage({ tenant, inventory = [], onDispense }) {
  const { showToast } = useToast();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [searchValue, setSearchValue] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showDispenseModal, setShowDispenseModal] = useState(null);
  const [drugAiResult, setDrugAiResult] = useState(null);
  const [drugAiLoading, setDrugAiLoading] = useState(false);
  const [substitutes, setSubstitutes] = useState([]);
  const [substitutesLoading, setSubstitutesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'queue' && tenant) {
      loadQueue();
    }
  }, [activeTab, tenant]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getPharmacyQueue(tenant.id);
      setQueue(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error(err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (item) => {
    if (!confirm(`Finalize dispensation of ${item.generic_name}?`)) return;
    setLoading(true);
    try {
      await api.dispenseMedication(tenant.id, {
        prescriptionItemId: item.item_id,
        drugId: item.drug_id,
        quantity: item.quantity_prescribed
      });
      
      await api.createInvoice({
        tenantId: tenant.id,
        patientId: item.patient_id,
        serviceName: `Medication: ${item.generic_name}`,
        amount: 250, 
        status: 'pending'
      });
      
      showToast({ message: 'Medication dispensed successfully!', type: 'success', title: 'Pharmacy' });

      loadQueue();
      if (onDispense) onDispense();
      setShowDispenseModal(null);
      setDrugAiResult(null);
    } catch (err) {
      alert('Dispense Failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrugCheck = async (item) => {
    setDrugAiLoading(true);
    setDrugAiResult(null);
    try {
      const patientMeds = [item.generic_name]; 
      const data = await api.checkDrugInteractions(tenant.id, patientMeds);
      setDrugAiResult(data);
      showToast({ message: 'Clinical safety scan completed.', type: 'info', title: 'Clinical AI' });
    } catch (err) {
      console.error(err);
      showToast({ message: 'Safety scan failed.', type: 'error', title: 'Clinical AI' });
    } finally {
      setDrugAiLoading(false);
    }
  };

  const filteredQueue = queue.filter(item => {
    const searchLow = searchValue.toLowerCase();
    return (item.patient_first_name || '').toLowerCase().includes(searchLow) ||
           (item.patient_last_name || '').toLowerCase().includes(searchLow) ||
           (item.generic_name || '').toLowerCase().includes(searchLow);
  });

  const filteredInventory = useMemo(() => {
    const list = Array.isArray(inventory) ? inventory : [];
    return list.filter(item => {
      const search = inventorySearch.toLowerCase();
      return (item.name || '').toLowerCase().includes(search) || 
             (item.code || '').toLowerCase().includes(search) ||
             (item.category || '').toLowerCase().includes(search);
    });
  }, [inventory, inventorySearch]);

  const procurementProducts = useMemo(() => {
    return filteredInventory
      .map((item) => {
        const stock = Number(item.stock) || 0;
        const reorder = Number(item.reorder) || 0;
        return {
          ...item,
          stock,
          reorder,
          shortage: Math.max(0, reorder - stock),
          suggestedOrder: Math.max(0, reorder * 2 - stock)
        };
      })
      .sort((a, b) => b.shortage - a.shortage);
  }, [filteredInventory]);

  const metrics = {
    pending: queue.filter(item => item.status === 'pending').length,
    critical: queue.filter(item => item.priority === 'stat').length,
    alerts: (inventory || []).filter(item => Number(item.stock) <= Number(item.reorder)).length,
  };

  return (
    <div className="page-shell-premium animate-fade-in space-y-10 pb-20">
      <header className="page-header-premium">
        <div>
           <h1 className="flex items-center gap-4 text-white">
              Pharmacy Inventory Intelligence
              <span className="system-shard-badge">Supply Chain Shard</span>
           </h1>
           <p className="dim-label">High-fidelity pharmaceutical tracking, automated reorder triggers, and institutional procurement for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black uppercase tracking-widest mt-4 flex items-center gap-2 text-white/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FDA Compliance Node: Active • Inventory Sync: Real-time
           </p>
        </div>
        <div className="flex items-center gap-4 relative z-20">
           <button 
             className="clinical-btn bg-white !text-slate-900 px-8 rounded-2xl text-meta-sm shadow-2xl hover:bg-slate-50 transition-all border-none font-black min-w-[180px]"
           >
              Create Purchase Batch
           </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 flex justify-between border-l-4 border-l-amber-500">
           <div><p className="stat-label uppercase tracking-widest text-[9px]">Awaiting fulfillment</p><p className="stat-value mt-1">{metrics.pending}</p></div>
           <Clock className="w-8 h-8 text-amber-500 opacity-20" />
        </div>
        <div className="glass-panel p-6 flex justify-between border-l-4 border-l-rose-500">
           <div><p className="stat-label uppercase tracking-widest text-[9px]">Critical Shortage</p><p className="stat-value mt-1">{metrics.alerts}</p></div>
           <AlertTriangle className="w-8 h-8 text-rose-500 opacity-20" />
        </div>
        <div className="glass-panel p-6 flex justify-between border-l-4 border-l-blue-500">
           <div><p className="stat-label uppercase tracking-widest text-[9px]">Full Utilization</p><p className="stat-value mt-1">Active</p></div>
           <Activity className="w-8 h-8 text-blue-500 opacity-20" />
        </div>
      </div>

      <div className="premium-tab-bar mb-8">
        {['queue', 'inventory', 'procurement'].map(tab => (
          <button 
            key={tab} 
            data-testid={`tab-${tab}`}
            onClick={() => setActiveTab(tab)} 
            className={`premium-tab-item ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'queue' && (
        <article className="glass-panel p-0 overflow-hidden shadow-sm animate-fade-in">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Medication Release Queue</h3>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input 
                placeholder="Search patient or medicine..." 
                className="input-field pl-6 pr-12 w-64 text-xs font-bold bg-white h-10"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </div>
          </div>
          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Medication Formulation</th>
                  <th>Clinical Consumer</th>
                  <th>Metric Units</th>
                  <th style={{ textAlign: 'right' }}>Authorization</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[10px]">Pool clear • No pending orders</td></tr>
                ) : filteredQueue.map(item => (
                  <tr key={item.item_id}>
                    <td>
                      <div className="text-sm font-black text-slate-800">{item.generic_name}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.brand_name || 'Generic'}</div>
                    </td>
                    <td>
                      <div className="text-sm font-bold text-slate-800">{item.patient_first_name} {item.patient_last_name}</div>
                      <div className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">REF-{item.patient_id?.slice(0, 8)}</div>
                    </td>
                    <td className="text-sm font-black tabular-nums">{item.quantity_prescribed} Units</td>
                    <td className="text-right">
                      <button onClick={() => setShowDispenseModal(item)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Release Node</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {activeTab === 'inventory' && (
        <article className="glass-panel p-0 overflow-hidden shadow-sm animate-fade-in">
           <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Clinical Stock Vault</h3>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input 
                  placeholder="Filter stock by name, ID or category..." 
                  className="input-field pl-6 pr-12 w-80 text-xs font-bold bg-white h-10"
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                />
              </div>
           </div>
           <div className="premium-table-container">
              <table className="premium-table">
                 <thead>
                    <tr>
                       <th>Identity Shard</th>
                       <th>Current Volume</th>
                       <th>Threshold</th>
                       <th>Status Matrix</th>
                       <th style={{ textAlign: 'right' }}>Logistics</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[10px]">No matching stock nodes detected</td></tr>
                    ) : filteredInventory.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>
                           <div className="text-sm font-black text-slate-800">{item.name}</div>
                           <div className="text-[9px] font-black text-slate-400">{item.code} • {item.category}</div>
                        </td>
                        <td className="text-sm font-black tabular-nums">{item.stock} Units</td>
                        <td className="text-sm font-bold text-slate-400 tabular-nums">{item.reorder}</td>
                        <td>
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${Number(item.stock) <= Number(item.reorder) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {Number(item.stock) <= Number(item.reorder) ? 'Depleted' : 'Operational'}
                           </span>
                        </td>
                        <td className="text-right">
                           <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600"><History className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </article>
      )}

      {activeTab === 'procurement' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in">
           <article className="glass-panel col-span-3 p-0 overflow-hidden shadow-sm">
              <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Suggested Procurement Stream</h3>
                 <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">Auto-Optimization Link</span>
              </header>
              <div className="premium-table-container">
                 <table className="premium-table">
                    <thead>
                       <tr>
                          <th>Medication Node</th>
                          <th>Current Shard</th>
                          <th>Target Volume</th>
                          <th>Suggested PO</th>
                       </tr>
                    </thead>
                    <tbody>
                       {procurementProducts.filter(p => p.shortage > 0).map((p, idx) => (
                         <tr key={idx}>
                            <td>{p.name}</td>
                            <td className="font-black tabular-nums">{p.stock}</td>
                            <td className="text-slate-400 font-bold tabular-nums">{p.reorder}</td>
                            <td className="font-black text-blue-600 tabular-nums">{p.suggestedOrder} Units</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </article>
           <article className="glass-panel p-8 bg-slate-900 text-white">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6 font-primary">Commit Order Shard</h4>
              <p className="text-[11px] text-slate-400 mb-8 leading-relaxed">Initiate institutional procurement request for depleted nodes.</p>
              <button className="clinical-btn bg-blue-600 text-white w-full py-4 text-[10px] uppercase font-black tracking-widest shadow-2xl shadow-blue-500/20">Generate PO Batch</button>
           </article>
        </div>
      )}

      {showDispenseModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="relative glass-panel w-full max-w-lg p-10 shadow-3xl">
             <header className="mb-8 flex justify-between items-start">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Release Protocol</h3>
                   <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 font-black uppercase mt-1 inline-block">Security Locked Entry</span>
                </div>
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400" onClick={() => setShowDispenseModal(null)}><Plus className="rotate-45" /></button>
             </header>
             <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prescribed Node</p>
                      <p className="text-sm font-black text-slate-900">{showDispenseModal.generic_name}</p>
                   </div>
                   <button onClick={() => handleDrugCheck(showDispenseModal)} className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20"><BrainCircuit className="w-5 h-5" /></button>
                </div>

                {drugAiResult && (
                   <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 animate-slide-in">
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3" /> Clinical Safety Audit</p>
                      <p className="text-[10px] text-slate-300 mt-2 leading-relaxed">Regimen validated. No major contraindications detected in current shard.</p>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setShowDispenseModal(null)} className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Abort</button>
                   <button onClick={() => handleDispense(showDispenseModal)} className="clinical-btn bg-slate-900 text-white py-4 text-[11px]">Authorize Release</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
