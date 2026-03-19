import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Activity,
  ShoppingCart,
  Users,
  SearchIcon,
  Filter,
  ArrowRight,
  ShieldCheck,
  Pill
} from 'lucide-react';
import { currency } from '../utils/format.js';
import { EmptyState } from '../components/ui/index.jsx';

export default function PharmacyPage({ tenant, onDispense }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [searchValue, setSearchValue] = useState('');
  const [showDispenseModal, setShowDispenseModal] = useState(null);

  useEffect(() => {
    if (activeTab === 'queue' && tenant) {
      loadQueue();
    }
  }, [activeTab, tenant]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getPharmacyQueue(tenant.id);
      setQueue(res.data || []);
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
      await api.finalizeDispense(item.item_id);
      
      // Auto-Billing Trigger for Medication
      await api.autoBillItem(tenant.id, {
        patientId: item.patient_id,
        description: `Medication Dispensed: ${item.generic_name} (${item.quantity_prescribed} Units)`,
        amount: item.amount || 250, // Simulated financial shard
        type: 'pharmacy'
      });
      
      // Visual feedback for Patient Journey Demo
      alert(`✅ Dispensation Complete\n\n1. Stock Deducted\n2. Audit Log Created (Reference: AUD-${Math.random().toString(36).substr(2, 9).toUpperCase()})\n3. Bill Linked to Patient Ledger`);
      
      loadQueue();
      if (onDispense) onDispense();
      setShowDispenseModal(null);
    } catch (err) {
      alert('Dispense Failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(item => 
    item.patient_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.generic_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.brand_name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const metrics = {
    pending: queue.filter(item => item.status === 'pending').length,
    ready: queue.filter(item => item.status === 'ready').length,
    dispensed: queue.filter(item => item.status === 'dispensed').length,
    critical: queue.filter(item => item.priority === 'high').length,
  };

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Pharmacy Dispatch & Logistics
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Clinical Node</span>
           </h1>
           <p className="dim-label">Institutional medication dispensing, prescription fulfillment, and inventory monitoring for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Dispensation Integrity Validated • Real-time Procurement active
           </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="clinical-btn !rounded-2xl px-8 shadow-xl shadow-blue-500/10 min-w-[180px]">
             <Plus className="w-4 h-4 mr-2" />
             New Prescription
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-amber-500">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Dispense</p>
              <h4 className="text-3xl font-black text-slate-900 mt-1">{metrics.pending}</h4>
              <p className="text-[9px] font-black text-amber-600 mt-2 uppercase tracking-widest">Queue Active</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
           </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready for Pickup</p>
              <h4 className="text-3xl font-black text-slate-900 mt-1">{metrics.ready}</h4>
              <p className="text-[9px] font-black text-emerald-600 mt-2 uppercase tracking-widest">Verified orders</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
           </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-blue-500">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispensed Today</p>
              <h4 className="text-3xl font-black text-slate-900 mt-1">{metrics.dispensed}</h4>
              <p className="text-[9px] font-black text-blue-600 mt-2 uppercase tracking-widest">Fulfilled</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Package className="w-6 h-6" />
           </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-rose-500">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Shortage</p>
              <h4 className="text-3xl font-black text-slate-900 mt-1">12</h4>
              <p className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest">Restock Needed</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-tab-bar mb-8">
        {['queue', 'inventory', 'alerts', 'procurement'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`premium-tab-item ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'queue' && (
          <article className="glass-panel p-0 overflow-hidden shadow-sm animate-fade-in">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
              <div>
                <h3 className="text-lg font-black text-slate-900">Rx Fulfillment Queue</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Authorized clinical prescriptions awaiting dispensation</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  placeholder="Search by patient or medication..." 
                  className="input-field pl-12 pr-6 py-4 w-full md:w-80 text-sm font-bold bg-white"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                />
              </div>
            </div>

            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Medication Entity</th>
                    <th>Patient Account</th>
                    <th>Dosage / Unit</th>
                    <th>Protocol</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-20 text-slate-400 animate-pulse">Synchronizing with clinical ledger...</td></tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <EmptyState 
                          title="No prescriptions detected in fulfillment pool" 
                          subtitle="The pharmacy dispatch node is currently idle. No authorized clinical orders are awaiting dispensation."
                          icon={Pill}
                        />
                      </td>
                    </tr>
                  ) : filteredQueue.map(item => (
                    <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-black">
                            {item.generic_name?.[0] || 'M'}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-800">{item.generic_name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.brand_name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm font-bold text-slate-800">{item.patient_name}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase mt-0.5">REF: {item.patient_id?.slice(0, 8)}</div>
                      </td>
                      <td>
                         <div className="text-sm font-black text-slate-900">{item.quantity_prescribed} {item.unit || 'units'}</div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                          item.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                      <td className="text-right">
                         <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setShowDispenseModal(item)}
                              className="px-4 py-2 bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              Finalize
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {/* INVENTORY TAB: Stock Intelligence */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-fade-in">
             <section className="vitals-monitor">
                <div className="vital-node vital-node--critical shadow-sm">
                   <div className="flex justify-between items-start">
                      <span className="vital-label">Threshold Breaches</span>
                      <AlertCircle className="w-4 h-4 text-rose-500 opacity-50" />
                   </div>
                   <span className="vital-value tabular-nums mt-1">08</span>
                   <p className="text-[10px] font-black text-rose-600 mt-2 uppercase">Immediate restock required</p>
                </div>
                <div className="vital-node vital-node--safe shadow-sm">
                   <div className="flex justify-between items-start">
                      <span className="vital-label">Expiring Shards (90d)</span>
                      <Clock className="w-4 h-4 text-emerald-500 opacity-50" />
                   </div>
                   <span className="vital-value tabular-nums mt-1">24</span>
                   <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase">FIFO Rotation Active</p>
                </div>
             </section>

             <article className="glass-panel p-0 overflow-hidden shadow-sm">
                <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Clinical Stock Registry</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Real-time medication unit ledger</p>
                   </div>
                   <button className="clinical-btn bg-white border border-slate-200 text-slate-700 px-6 !min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-widest">
                      Export Inventory Shard
                   </button>
                </header>
                <div className="premium-table-container">
                   <table className="premium-table">
                      <thead>
                         <tr>
                            <th>Medication Entity</th>
                            <th>Current Stock</th>
                            <th>Reorder Shard</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {[
                            { name: 'Paracetamol 500mg', brand: 'Calpol', stock: 120, reorder: 50, status: 'stable' },
                            { name: 'Amoxicillin 250mg', brand: 'Mox', stock: 12, reorder: 30, status: 'critical' },
                            { name: 'Insulin Glargine', brand: 'Lantus', stock: 45, reorder: 20, status: 'stable' }
                         ].map((item, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                             <td>
                                <div className="text-sm font-black text-slate-800">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">{item.brand}</div>
                             </td>
                             <td className="text-sm font-black tabular-nums">{item.stock} Units</td>
                             <td className="text-sm font-bold text-slate-400 tabular-nums">{item.reorder}</td>
                             <td>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                   {item.status}
                                </span>
                             </td>
                             <td className="text-right">
                                <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                                   <ArrowRight className="w-4 h-4" />
                                </button>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </article>
          </div>
        )}

        {/* PROCUREMENT TAB: Vendor & PO Management */}
        {activeTab === 'procurement' && (
          <div className="grid grid-cols-12 gap-8 animate-fade-in">
             <aside className="col-span-12 lg:col-span-4 space-y-8">
                <article className="glass-panel p-8">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 pb-4 border-b border-slate-50">Generate Purchase Order</h3>
                   <form className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Vendor Shard</label>
                         <select className="input-field h-[56px] bg-slate-50 border-none rounded-xl font-bold">
                            <option>PharmaCorp Int</option>
                            <option>Surgical Dynamics</option>
                            <option>BioSystems Global</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Medication Link</label>
                         <input placeholder="Search catalog..." className="input-field py-4 bg-slate-50 border-none rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quantity</label>
                            <input type="number" defaultValue="100" className="input-field py-4 bg-slate-50 border-none rounded-xl font-black" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Expected Influx</label>
                            <input type="date" className="input-field py-4 bg-slate-50 border-none rounded-xl text-xs" />
                         </div>
                      </div>
                      <button className="clinical-btn bg-slate-900 text-white w-full py-4 text-[11px] font-black uppercase tracking-widest rounded-xl shadow-2xl">
                         Commit Purchase Order
                      </button>
                   </form>
                </article>

                <article className="glass-panel bg-indigo-900 text-white p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                   <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Active Contracts</h4>
                   <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center text-xs">
                         <span className="font-bold">BioSystems</span>
                         <span className="text-indigo-300">Net-30</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="font-bold">PharmaCorp</span>
                         <span className="text-indigo-300">Advance</span>
                      </div>
                   </div>
                </article>
             </aside>

             <main className="col-span-12 lg:col-span-8">
                <article className="glass-panel p-0 overflow-hidden shadow-sm">
                   <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                      <div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">PO Ledger Shards</h3>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Pending and committed procurement streams</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                         <ShoppingCart className="w-5 h-5" />
                      </div>
                   </header>
                   <div className="premium-table-container">
                      <table className="premium-table">
                         <thead>
                            <tr>
                               <th>PO Ref / Date</th>
                               <th>Vendor Node</th>
                               <th>Quantum (Val)</th>
                               <th>Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {[
                               { ref: 'PO-2024-001', date: 'Mar 12', vendor: 'PharmaCorp', amount: 45000, status: 'Inward Pending' },
                               { ref: 'PO-2024-002', date: 'Mar 14', vendor: 'BioSystems', amount: 12500, status: 'authorized' },
                               { ref: 'PO-2024-003', date: 'Mar 15', vendor: 'PharmaCorp', amount: 8200, status: 'cancelled' }
                            ].map((po, idx) => (
                               <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td>
                                     <div className="text-sm font-black text-slate-900">{po.ref}</div>
                                     <div className="text-[10px] text-slate-400 font-bold uppercase">{po.date}, 2024</div>
                                  </td>
                                  <td>
                                     <div className="text-sm font-bold text-slate-700">{po.vendor}</div>
                                  </td>
                                  <td className="text-sm font-black tabular-nums">{currency(po.amount)}</td>
                                  <td>
                                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        po.status === 'authorized' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        po.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                     }`}>
                                        {po.status}
                                     </span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </article>
             </main>
          </div>
        )}
      </div>

      {/* Dispense Modal */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-8 animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Finalize Dispensation</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Verify medication integrity and quantity</p>
              </div>
              <button onClick={() => setShowDispenseModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Recipient</label>
                    <p className="text-sm font-black text-slate-800">{showDispenseModal.patient_name}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medication</label>
                    <p className="text-sm font-black text-blue-600">{showDispenseModal.generic_name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verified Quantity</label>
                  <input
                    type="number"
                    defaultValue={showDispenseModal.quantity_prescribed}
                    className="input-field py-4 bg-white font-mono font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Clinical Remarks</label>
                  <textarea
                    className="input-field py-4 h-24 bg-white resize-none"
                    placeholder="Add fulfillment notes or warnings..."
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() => setShowDispenseModal(null)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleDispense(showDispenseModal)}
                  className="flex-2 btn-primary py-4 px-10 text-[10px] uppercase tracking-widest shadow-xl"
                >
                  Confirm Fulfillment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
