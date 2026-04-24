import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import { 
  Droplet, 
  Users, 
  Activity, 
  History, 
  Heart, 
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Contact,
  CheckCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import MetricCard from '../components/MetricCard.jsx';

export default function DonorPage({ tenant }) {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [bloodUnits, setBloodUnits] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Fetch blood bank data from backend
  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const loadData = async () => {
    try {
      if (tenant?.id) {
        setLoading(true);
        const [unitsData, requestsData] = await Promise.all([
          api.getBloodUnits(tenant.id),
          api.getBloodRequests(tenant.id)
        ]);
        setBloodUnits(Array.isArray(unitsData) ? unitsData : []);
        setBloodRequests(Array.isArray(requestsData) ? requestsData : []);
      }
    } catch (error) {
      console.error('Error fetching blood bank data:', error);
      showToast({ message: 'Failed to load blood bank data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Transform blood units to summary inventory format
  const bloodInventory = useMemo(() => {
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return groups.map(group => {
      const units = bloodUnits.filter(u => u.blood_group === group);
      const totalVolume = units.reduce((acc, u) => acc + (Number(u.volume_ml) || 0), 0);
      const unitsCount = (totalVolume / 250).toFixed(1);
      const isCritical = totalVolume < 500;
      
      return {
        group,
        units: unitsCount,
        volume: totalVolume,
        pulse: isCritical ? 'CRITICAL' : 'STABLE',
        level: Math.min(100, Math.round((totalVolume / 2000) * 100))
      };
    });
  }, [bloodUnits]);

  const filteredRequests = useMemo(() => {
    return bloodRequests.filter(req => {
      const search = searchTerm.toLowerCase();
      return (req.patient_name || '').toLowerCase().includes(search) || 
             (req.requested_group || '').toLowerCase().includes(search);
    });
  }, [bloodRequests, searchTerm]);

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      tenantId: tenant.id,
      bloodGroup: fd.get('bloodGroup'),
      volumeMl: Number(fd.get('volumeMl')),
      donorName: fd.get('donorName'),
      donorContact: fd.get('donorContact'),
      expiryDate: fd.get('expiryDate') || null
    };

    setRegistering(true);
    try {
      await api.createBloodUnit(payload);
      showToast({ message: `Donor ${fd.get('donorName')} registered successfully!`, type: 'success', title: 'Blood Bank' });
      setShowRegModal(false);
      loadData();
    } catch (err) {
      showToast({ message: 'Registration failed: ' + err.message, type: 'error' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading && bloodUnits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Droplet className="w-12 h-12 text-red-300 animate-pulse mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Blood Shard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in space-y-10 pb-20">
      <header className="page-header-premium">
        <div>
           <h1 className="flex items-center gap-4 text-white">
              Institutional Blood Bank Shard
              <span className="system-shard-badge">Vital Inventory Shard</span>
           </h1>
           <p className="dim-label">Strategic donor registry and high-velocity vital inventory monitoring for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black uppercase tracking-widest mt-4 flex items-center gap-2 text-white/50">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Inventory Integrity: 100% • Real-time Cross-match Active
           </p>
        </div>
        <div className="flex items-center gap-4 relative z-20">
           <button 
             onClick={() => setShowRegModal(true)}
             className="clinical-btn bg-white !text-slate-900 px-8 rounded-2xl text-meta-sm shadow-2xl hover:bg-slate-50 transition-all border-none font-black min-w-[180px]"
           >
              <Plus className="w-4 h-4 mr-2" />
              Register Donor
           </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-l-4 border-l-blue-500">
           <p className="stat-label">Total Units</p>
           <p className="stat-value">{(bloodUnits.reduce((acc, u) => acc + (Number(u.volume_ml) || 0), 0) / 250).toFixed(0)}</p>
           <p className="stat-sub text-blue-600 font-bold uppercase tracking-widest mt-1">Operational Pool</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
           <p className="stat-label">Stock Healthy</p>
           <p className="stat-value">{bloodInventory.filter(i => i.pulse === 'STABLE').length}</p>
           <p className="stat-sub text-emerald-600 font-bold uppercase tracking-widest mt-1">Groups Stable</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-amber-500">
           <p className="stat-label">Active Requests</p>
           <p className="stat-value">{bloodRequests.filter(r => r.status === 'Pending').length}</p>
           <p className="stat-sub text-amber-600 font-bold uppercase tracking-widest mt-1">Pending Release</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-rose-500">
           <p className="stat-label">Critical Alerts</p>
           <p className="stat-value">{bloodInventory.filter(i => i.pulse === 'CRITICAL').length}</p>
           <p className="stat-sub text-rose-600 font-bold uppercase tracking-widest mt-1">Depleted Pools</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Inventory Status */}
        <div className="lg:col-span-2 space-y-8">
          <article className="glass-panel p-0 overflow-hidden shadow-sm">
            <header className="px-8 py-6 border-b border-slate-100 bg-slate-50/20">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-red-500" /> Live Inventory Pulse
               </h3>
            </header>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {bloodInventory.map((item) => (
                <div key={item.group} className="group p-5 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:border-red-100 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner ${
                        item.pulse === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-slate-800 border border-slate-100'
                      }`}>
                        {item.group}
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Volume</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-900 tabular-nums">{item.units} Units</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            item.pulse === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.pulse}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-400 mb-1">{item.level}% Utility</span>
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            item.level < 30 ? 'bg-red-500' : item.level < 60 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${item.level}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Recent Transfusion Requests */}
          <article className="glass-panel p-0 overflow-hidden shadow-sm">
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Transfusion Shards</h3>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input 
                  placeholder="Search requests..." 
                  className="input-field pl-6 pr-12 w-64 text-xs font-bold bg-white h-10 border-slate-100"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </header>
            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Target Patient</th>
                    <th className="text-center">Req. Group</th>
                    <th className="text-center">Priority</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Logistics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[10px]">No active transfusion requests</td></tr>
                  ) : filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td>
                        <div className="text-sm font-black text-slate-900">{req.patient_name}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">REF-{req.id.slice(0, 8)}</div>
                      </td>
                      <td className="text-center font-black text-slate-800 text-lg">{req.requested_group}</td>
                      <td className="text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          req.priority === 'urgent' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{req.status}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><ArrowUpRight size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        {/* Action Sidebar */}
        <aside className="space-y-8">
           <article className="glass-panel p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl mb-8 relative z-10">
                 <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-4 relative z-10 leading-tight">Emergency Paging Node</h3>
              <p className="text-sm text-slate-400 mb-8 relative z-10 leading-relaxed font-medium">Broadcast urgent cross-match requirements to institutional network nodes.</p>
              <button className="clinical-btn bg-red-600 !text-white w-full py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-2xl shadow-red-600/20 border-none">Initiate Global Alert</button>
           </article>

           <article className="glass-panel p-8 border-l-4 border-l-indigo-600 bg-indigo-50/10">
              <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <History size={16} /> Data Trend Shards
              </h4>
              <div className="space-y-6">
                 {[
                   { label: 'Weekly Donors', val: '↑ 14%', color: 'text-emerald-600' },
                   { label: 'Utilization Avg', val: '1.2u / Day', color: 'text-slate-900' },
                   { label: 'Cross-match Time', val: '8.4 Min', color: 'text-indigo-600' }
                 ].map(t => (
                   <div key={t.label} className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.label}</span>
                     <span className={`text-[11px] font-black ${t.color}`}>{t.val}</span>
                   </div>
                 ))}
              </div>
           </article>
        </aside>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="relative glass-panel w-full max-w-2xl p-10 shadow-3xl overflow-y-auto max-h-[90vh]">
              <header className="mb-10 flex justify-between items-start">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Donor Registration</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Institutional Vital Inventory Provisioning</p>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400" onClick={() => setShowRegModal(false)}>
                    <Plus className="w-6 h-6 rotate-45" />
                 </button>
              </header>

              <form onSubmit={handleRegisterDonor} className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Donor Nominal Identity</label>
                       <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="donorName" className="input-field pl-12 h-14 bg-slate-50 border-none font-bold" placeholder="E.g. Sarah Jenkins" required />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Contact Vector</label>
                       <div className="relative">
                          <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="donorContact" className="input-field pl-12 h-14 bg-slate-50 border-none font-bold" placeholder="+91 98XXX XXXXX" required />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Blood Group</label>
                       <div className="relative">
                          <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                          <select name="bloodGroup" className="input-field pl-12 h-14 bg-slate-50 border-none font-black text-lg" required>
                             {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Volume (ML)</label>
                       <div className="relative">
                          <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="volumeMl" type="number" defaultValue="250" className="input-field pl-12 h-14 bg-slate-50 border-none font-black" required />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Inventory Expiry</label>
                       <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="expiryDate" type="date" className="input-field pl-12 h-14 bg-slate-50 border-none font-bold" required />
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                    <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                    <p className="text-[10px] font-bold text-red-900 uppercase tracking-tight leading-relaxed">
                       Registration committed to the institutional vital shard. Ensure donor screening protocol is followed before inventory synchronization.
                    </p>
                 </div>

                 <div className="pt-8 flex gap-4">
                    <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase text-slate-400">Abort</button>
                    <button type="submit" disabled={registering} className="flex-[2] btn-primary py-5 text-[11px] font-black uppercase shadow-2xl bg-slate-900 border-none rounded-2xl">
                       {registering ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Commit Donor Registry'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
