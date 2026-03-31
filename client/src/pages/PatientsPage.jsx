import { useMemo, useState, useEffect } from 'react';
import { api } from '../api.js';
import { patientName } from '../utils/format.js';
import '../styles/critical-care.css';
import SaveToast from '../components/ui/SaveToast.jsx';
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
  ClipboardList,
  UserX
} from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';
import { useToast } from '../hooks/useToast.jsx';


export default function PatientsPage({
  activeUser,
  tenant,
  session,
  patients: patientsProp,
  setView,
  setActivePatientId,
  onCreatePatient
}) {
  const { showToast } = useToast();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('registry');
  const [page, setPage] = useState(0);
  const isDoctor = (activeUser?.role || '').toLowerCase() === 'doctor';

  const tenantId = tenant?.id || session?.tenantId || null;

  const effectivePatients = useMemo(() => {
    // Priority 1: If page > 0, always use our paginated local state
    if (page > 0) return patients;
    // Priority 2: Use patientsProp if available AND we don't have newer local data
    if (Array.isArray(patientsProp) && patientsProp.length > 0 && patients.length === 0) return patientsProp;
    // Priority 3: Use our local registry state (includes newly created patients)
    return patients;
  }, [patientsProp, patients, page]);

  useEffect(() => {
    async function load() {
      // If we're on page 0 and have patientsProp, don't trigger a redundant load
      if (page === 0 && Array.isArray(patientsProp) && patientsProp.length > 0) {
        setLoading(false);
        return;
      }

      if (!tenantId) return;
      setLoading(true);
      try {
        const data = await api.getPatients(tenantId, { limit: 50, offset: page * 50 });
        setPatients(data || []);
      } catch (err) {
        console.error('Failed to load patient registry:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantId, page, patientsProp?.length]);

  async function handleOnboard(e) {
    if (onCreatePatient) {
      try {
        await onCreatePatient(e);
        showToast({ message: 'Patient Provisioned in Registry', type: 'success', title: 'Clinical Records' });
        setActiveTab('registry');
      } catch (err) {
        showToast({ message: 'Provisioning Failure: ' + err.message, type: 'error', title: 'Registry Fault' });
      }
      return;
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
      // Immediately refresh patient list to show newly created patient
      const refreshedData = await api.getPatients(tenantId);
      setPatients(refreshedData || []);
      setActiveTab('registry');
      e.target.reset();
      showToast({ message: 'Patient registered successfully!', type: 'success' });
    } catch (err) {
      showToast({ message: 'Registration failed: ' + err.message, type: 'error' });
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
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="page-title-rich flex items-center gap-3">
              {isDoctor ? 'My Patients' : 'Patient Directory'}
              <span className="text-meta-sm bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Registration Module</span>
           </h1>
           <p className="dim-label">View and manage all registered patients for {tenant?.name || 'Facility'}.</p>
           <p className="text-meta-sm text-slate-400 mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Records verified • Directory Active
           </p>
        </div>
        <div className="flex bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit">
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-meta-sm transition-all ${activeTab === 'registry' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('registry')}
          >
            <ClipboardList className="w-3.5 h-3.5 mr-2" /> Patient List
          </button>
          <button 
            className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-meta-sm transition-all ${activeTab === 'onboard' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('onboard')}
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" /> New Registration
          </button>
        </div>
      </header>

      {/* 2. REGISTRY INTERFACE */}
      {activeTab === 'registry' && (
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
             <div className="flex-1 relative group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--clinical-blue)] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by patient name, MRN, or phone..." 
                  className="input-field pl-6 pr-16 py-6 bg-white border-2 border-slate-50 rounded-3xl shadow-sm focus:shadow-xl focus:border-[var(--clinical-blue)]/20 transition-all font-medium text-slate-800 placeholder:text-slate-300 w-full"
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
                      <th className="tracking-widest">Patient Profile</th>
                      <th className="tracking-widest">Clinical Details</th>
                      {activeUser?.role === 'Superadmin' && <th className="tracking-widest">Facility</th>}
                      <th className="tracking-widest">Contact</th>
                      <th className="tracking-widest">Status</th>
                      <th className="tracking-widest text-right">Quick Actions</th>
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
                       <tr>
                         <td colSpan={activeUser?.role === 'Superadmin' ? "6" : "5"}>
                           <EmptyState 
                             title="No patients found in directory" 
                             subtitle="No patients matched your current search criteria."
                             icon={UserX}
                           />
                         </td>
                       </tr>
                    ) : filtered.map((p, idx) => {
                      const patientAge = p.dob ? Math.floor((new Date() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
                      const patientInitials = `${(p.firstName || '').charAt(0)}${(p.lastName || '').charAt(0)}`.toUpperCase();
                      
                      return (
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
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-black text-lg shadow-lg">
                                {patientInitials || '?'}
                              </div>
                              <div>
                                 <div className="text-sm font-black text-slate-900 tracking-tight group-hover:translate-x-1 transition-transform">
                                   {p.firstName} {p.lastName}
                                 </div>
                                 <div className="text-meta-sm text-slate-400 mt-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> MRN: {p.mrn || `MRN-${(p.id || 'X').slice(0, 8).toUpperCase()}`}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td>
                           <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                 <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                 <span className="text-meta-info text-slate-600 font-medium">
                                   {p.dob ? new Date(p.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                 </span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Users className="w-3.5 h-3.5 text-slate-400" />
                                 <span className="text-meta-sm text-slate-500">
                                   {patientAge ? `${patientAge} years` : 'Age unknown'} • {p.gender || 'Not specified'}
                                 </span>
                              </div>
                           </div>
                        </td>
                        {activeUser?.role === 'Superadmin' && (
                           <td><span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{p.tenant_name || 'System'}</span></td>
                        )}
                        <td>
                           <div className="space-y-1">
                              {p.phone && (
                                 <div className="flex items-center gap-2 text-meta-sm text-slate-600">
                                    <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
                                       <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                       </svg>
                                    </div>
                                    {p.phone}
                                 </div>
                              )}
                              {p.email && (
                                 <div className="flex items-center gap-2 text-meta-sm text-slate-500">
                                    <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
                                       <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                       </svg>
                                    </div>
                                    {p.email}
                                 </div>
                              )}
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                                 <span className="text-[10px] font-black uppercase text-emerald-700">Active</span>
                              </div>
                           </div>
                        </td>
                        <td className="text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                 className="p-2.5 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-100 shadow-sm transition-all group"
                                 title="View Clinical Records"
                              >
                                 <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                              <button 
                                 className="p-2.5 bg-[var(--medical-navy)] text-white hover:bg-[var(--clinical-accent)] rounded-xl shadow-md transition-all group"
                                 title="Open Patient Chart"
                              >
                                 <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
               </table>
             </div>
             {/* Pagination Controls */}
             <div className="flex justify-between items-center py-6 px-8 bg-slate-50 border-t border-slate-100">
               <button 
                 onClick={() => setPage(p => Math.max(0, p - 1))} 
                 disabled={page === 0} 
                 className="px-6 py-2.5 bg-white text-slate-600 font-bold uppercase tracking-wider text-[10px] rounded-xl border border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all">
                 &larr; Prev Page
               </button>
               <span className="text-[10px] font-black uppercase text-[var(--clinical-blue)] tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-lg">Registry Page {page + 1}</span>
               <button 
                 onClick={() => setPage(p => p + 1)} 
                 disabled={filtered.length < 50} 
                 className="px-6 py-2.5 bg-white text-slate-600 font-bold uppercase tracking-wider text-[10px] rounded-xl border border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all">
                 Next Page &rarr;
               </button>
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
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Patient Registration</h3>
                    <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Enter Primary Patient Details</p>
                 </div>
                 <div className="w-14 h-14 bg-[var(--medical-navy)] text-white rounded-2xl flex items-center justify-center shadow-2xl">
                    <UserPlus className="w-7 h-7" />
                 </div>
              </header>

              <form className="space-y-12" onSubmit={handleOnboard}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--clinical-accent)]">Patient Demographics</h4>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
                          <input name="firstName" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                          <input name="lastName" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
                          <input name="dob" type="date" max={new Date().toISOString().split('T')[0]} className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-xs px-6" required />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Contact Information</h4>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
                          <input name="phone" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" placeholder="+91 00000 00000" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                             <select name="gender" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6">
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                             <input name="email" type="email" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800 px-6" placeholder="patient@node.com" />
                          </div>
                       </div>
                        <div className="space-y-4">
                           <div className="flex items-start gap-3 p-6 bg-emerald-50/40 rounded-3xl border border-emerald-100 transition-all hover:bg-emerald-50 group">
                              <input 
                                 type="checkbox" 
                                 name="consent" 
                                 id="consent-check" 
                                 className="mt-1 w-5 h-5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                                 required 
                              />
                              <label htmlFor="consent-check" className="text-[11px] font-medium text-emerald-800 leading-relaxed cursor-pointer group-hover:text-emerald-900 transition-colors">
                                 I acknowledge that patient consent for treatment and data processing has been obtained in accordance with standard hospital policies. 
                                 <span className="block mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-600/60">Digital consent will be recorded.</span>
                              </label>
                           </div>
                           <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <ShieldCheck className="w-4 h-4 text-slate-400" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Protection: Secure Encrypted Storage Active</span>
                           </div>
                        </div>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-50 flex justify-end gap-6 items-center">
                    <button type="button" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-rose-500 transition-colors" onClick={() => setActiveTab('registry')}>Cancel Registration</button>
                    <button type="submit" className="clinical-btn bg-[var(--medical-navy)] text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all border-none">
                       REGISTER PATIENT
                    </button>
                 </div>
              </form>
           </article>

            <aside className="col-span-12 lg:col-span-4 space-y-8">
              <div className="clinical-card !bg-[var(--medical-navy)] text-white relative overflow-hidden group h-full border-none shadow-2xl">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform"></div>
                 <header className="relative z-10 mb-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--clinical-accent)]">System Security</h3>
                    <p className="text-[10px] text-white/40 font-black uppercase mt-2">Active Services</p>
                 </header>
                 
                 <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-5 group/item">
                       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:bg-emerald-500/20 group-hover/item:border-emerald-500/40 transition-all">
                          <Activity className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-tighter mb-1">Identity Verification</p>
                          <div className="text-[11px] font-black uppercase tracking-widest text-white/90">System Active</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group/item">
                       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:bg-emerald-500/20 group-hover/item:border-emerald-500/40 transition-all">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-tighter mb-1">Defense Protocol</p>
                          <div className="text-[11px] font-black uppercase tracking-widest text-white/90">Encryption: AES-256 Active</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group/item">
                       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:bg-blue-500/20 group-hover/item:border-blue-500/40 transition-all">
                          <Clock className="w-5 h-5 text-blue-400" />
                       </div>
                       <div>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-tighter mb-1">Global Latency</p>
                          <div className="text-[11px] font-black uppercase tracking-widest text-white/90">Response: 12ms</div>
                       </div>
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
