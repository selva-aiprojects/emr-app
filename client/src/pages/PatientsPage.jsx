import { useMemo, useState, useEffect } from 'react';
import { api } from '../api.js';
import { patientName } from '../utils/format.js';
import '../styles/critical-care.css';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Activity, 
  Clock,
  ShieldCheck,
  FileText,
  Stethoscope,
  MoreVertical,
  ClipboardList
} from 'lucide-react';

export default function PatientsPage({
  tenant,
  session,
  patients: patientsProp,
  setView,
  setActivePatientId,
  onCreatePatient
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'onboard'

  const tenantId = tenant?.id || session?.tenantId || null;

  const effectivePatients = useMemo(() => {
    return Array.isArray(patientsProp) ? patientsProp : patients;
  }, [patientsProp, patients]);

  useEffect(() => {
    async function load() {
      // If the shell already provides patient data, don't refetch here.
      if (Array.isArray(patientsProp)) {
        setLoading(false);
        return;
      }

      if (!tenantId) return;
      setLoading(true);
      try {
        const data = await api.getPatients(tenantId);
        setPatients(data || []);
      } catch (err) {
        console.error('Failed to load patient registry:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantId, patientsProp]);

  async function handleOnboard(e) {
    if (onCreatePatient) {
      // Delegate to App.jsx handler to keep global state consistent.
      return onCreatePatient(e);
    }

    if (!tenantId) return;
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.createPatient({
        tenantId,
        firstName: fd.get('firstName'),
        lastName: fd.get('lastName'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        dob: fd.get('dob'),
        gender: fd.get('gender')
      });
      const data = await api.getPatients(tenantId);
      setPatients(data || []);
      setActiveTab('registry');
      e.target.reset();
    } catch (err) {
      alert('Admission Protocol Error: ' + err.message);
    }
  }

  const filtered = effectivePatients.filter(p => {
    const full = `${p.firstName} ${p.lastName}`.toLowerCase();
    return full.includes(query.toLowerCase()) || p.id?.includes(query);
  });

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400 font-black uppercase tracking-[0.2em]">
        <div className="animate-pulse">Initializing Identification Hub...</div>
      </div>
    );
  }

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* 1. CLINICAL HEADER */}
      <header className="page-header-premium mb-10">
        <div>
          <h1 className="flex items-center gap-3">
             Master Clinical Registry
             <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Central Node</span>
          </h1>
          <p className="dim-label">Centralized identity governance and longitudinal record management</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1">
             <button 
               className={`clinical-btn !min-h-[40px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
               onClick={() => setActiveTab('registry')}
             >
               <ClipboardList className="w-3.5 h-3.5 mr-2" /> Registry
             </button>
             <button 
               className={`clinical-btn !min-h-[40px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'onboard' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
               onClick={() => setActiveTab('onboard')}
             >
               <UserPlus className="w-3.5 h-3.5 mr-2" /> New Admission
             </button>
           </div>
        </div>
      </header>

      {/* 2. REGISTRY INTERFACE */}
      {activeTab === 'registry' && (
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
             <div className="flex-1 relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Query identity by name, MRN, or diagnostic shard..." 
                  className="input-field pl-16 py-6 bg-white border-2 border-slate-50 rounded-3xl shadow-sm focus:shadow-xl focus:border-emerald-100 transition-all font-medium text-slate-800 placeholder:text-slate-300 w-full"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
             </div>
             <button className="clinical-btn bg-white text-slate-900 border border-slate-200 px-8 rounded-3xl hover:bg-slate-50 shadow-sm">
                <Filter className="w-4 h-4 mr-2" /> Filter Registry
             </button>
          </div>

          <div className="clinical-card !p-0 overflow-hidden border-none shadow-premium bg-white/40 backdrop-blur-xl">
             <div className="premium-table-container">
               <table className="premium-table">
                  <thead>
                    <tr>
                      <th className="tracking-widest">Patient Identity</th>
                      <th className="tracking-widest">Temporal Node (DOB)</th>
                      <th className="tracking-widest">Registry ID</th>
                      <th className="tracking-widest">Clinical Stream</th>
                      <th className="tracking-widest text-right">Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                       [...Array(5)].map((_, i) => (
                         <tr key={i} className="animate-pulse">
                           <td colSpan="5" className="p-8"><div className="h-6 bg-slate-100 rounded-lg w-full"></div></td>
                         </tr>
                       ))
                    ) : filtered.length === 0 ? (
                       <tr><td colSpan="5" className="py-32 text-center text-slate-400 font-bold uppercase tracking-widest">No identity shards found in clinical registry.</td></tr>
                    ) : filtered.map((p, idx) => (
                      <tr
                        key={p.id || idx}
                        className="group hover:bg-slate-50/80 transition-all cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${idx * 20}ms` }}
                        onClick={() => {
                          setActivePatientId?.(p.id);
                          setView?.('emr');
                        }}
                      >
                        <td className="!py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                 {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                              </div>
                              <div>
                                 <div className="text-sm font-black text-slate-900 tracking-tight group-hover:translate-x-1 transition-transform">{p.firstName} {p.lastName}</div>
                                 <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Active Profile
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td><div className="text-xs font-black text-slate-500 tabular-nums">{p.dob ? new Date(p.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div></td>
                        <td><code className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">MRN-{(p.id || 'X').slice(0, 10).toUpperCase()}</code></td>
                        <td>
                           <div className="flex gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shadow-lg shadow-emerald-500/50"></span>
                              <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Monitoring Nominal</div>
                           </div>
                        </td>
                        <td className="text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button className="p-2.5 bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-slate-100 shadow-sm transition-all"><FileText className="w-4 h-4" /></button>
                              <button className="p-2.5 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl shadow-md transition-all"><ChevronRight className="w-4 h-4" /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </section>
      )}

      {/* 3. ADMISSION PROTOCOL (Onboard) */}
      {activeTab === 'onboard' && (
        <section className="grid grid-cols-12 gap-8">
           <article className="col-span-12 lg:col-span-8 clinical-card p-12 animate-slide-up">
              <header className="mb-12 flex justify-between items-end">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Registry Admission Protocol</h3>
                    <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Identity Provisioning Protocol • Central Node</p>
                 </div>
                 <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                    <UserPlus className="w-7 h-7" />
                 </div>
              </header>

              <form className="space-y-12" onSubmit={handleOnboard}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Clinical Identity</h4>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forename</label>
                          <input name="firstName" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Surname</label>
                          <input name="lastName" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temporal Node (DOB)</label>
                          <input name="dob" type="date" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-xs px-6" required />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Contact & Demographics</h4>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Protocol</label>
                          <input name="phone" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" placeholder="+91 00000 00000" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender Shard</label>
                             <select name="gender" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6">
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Guard (Email)</label>
                             <input name="email" type="email" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" placeholder="patient@node.com" />
                          </div>
                       </div>
                       <div className="p-6 bg-emerald-50/40 rounded-3xl border border-emerald-100 flex items-start gap-4">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                          <p className="text-[11px] font-medium text-emerald-800/60 leading-relaxed italic">
                             Automated consent shard will be generated upon commitment to the clinical registry.
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-50 flex justify-end gap-6 items-center">
                    <button type="button" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-rose-500 transition-colors" onClick={() => setActiveTab('registry')}>Abort Procedure</button>
                    <button type="submit" className="clinical-btn bg-slate-900 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all border-none">
                       COMMIT TO CLINICAL REGISTRY
                    </button>
                 </div>
              </form>
           </article>

           <aside className="col-span-12 lg:col-span-4 space-y-8">
              <div className="clinical-card bg-slate-900 text-white relative overflow-hidden group h-full">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform"></div>
                 <header className="relative z-10 mb-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Registry Integrity</h3>
                    <p className="text-[10px] text-white/40 font-black uppercase mt-2">Global Service Status</p>
                 </header>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                       <div className="text-[11px] font-black uppercase tracking-widest">Biometric Shard Sync: Nominal</div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                       <div className="text-[11px] font-black uppercase tracking-widest">Encryption Layer: AES-256 Active</div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                       <div className="text-[11px] font-black uppercase tracking-widest">Network Latency: 12ms</div>
                    </div>
                 </div>

                 <div className="mt-20 p-6 bg-white/5 rounded-2xl border border-white/10 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <Activity className="w-4 h-4 text-emerald-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Security Directive</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                       Do not duplicate clinical identities. If MRN conflict occurs, initiate deep reconciliation via the Admin Console.
                    </p>
                 </div>
              </div>
           </aside>
        </section>
      )}

      {/* 4. FOOTER NOTE */}
      <footer className="mt-12 py-8 border-t border-slate-100 flex justify-between items-center">
         <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> SECURE DEPLOYMENT NODE • v1.0.4-BETA
         </div>
         <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {effectivePatients.length} ACTIVE SHARDS IN REGISTRY
         </div>
      </footer>
    </div>
  );
}
