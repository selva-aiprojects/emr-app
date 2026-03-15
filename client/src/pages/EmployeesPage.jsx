import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  Wallet, 
  FileText, 
  Search, 
  MoreHorizontal, 
  ArrowUpRight, 
  Plus,
  ShieldAlert,
  Settings2,
  CheckCircle2,
  XCircle,
  Briefcase
} from 'lucide-react';
import { currency } from '../utils/format.js';

export default function EmployeesPage({ 
  employees = [], 
  employeeLeaves = [], 
  onCreateEmployee, 
  onRecordAttendance, 
  onApplyLeave, 
  tenant 
}) {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'attendance' | 'leaves' | 'payroll'
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: employees.length,
      present: Math.floor(employees.length * 0.85), // Simulated for UI
      onLeave: employeeLeaves.filter(l => l.status === 'Approved').length,
      roles: new Set(employees.map(e => e.designation)).size
    };
  }, [employees, employeeLeaves]);

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* Premium Header */}
      <div className="page-header-premium mb-8">
        <div>
          <h1 className="flex items-center gap-3">
            Human Capital Intelligence
            <span className="text-[10px] font-black bg-teal-100 text-teal-700 px-3 py-1 rounded-full uppercase tracking-tighter border border-teal-200 shadow-sm">Workforce Active</span>
          </h1>
          <p>Institutional roster management, clinical attendance, and organizational logistics.</p>
        </div>
        <button 
          className="btn-primary py-4 px-10 text-[10px] uppercase tracking-[0.2em] shadow-xl group"
          onClick={() => setShowRegisterModal(true)}
        >
          <UserPlus className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
          Provision New Personnel
        </button>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-6 border-l-4 border-l-teal-500 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Roster</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2">{stats.total}</h4>
                <p className="text-[9px] font-black text-teal-600 mt-3 uppercase tracking-widest">Total Personnel</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
             </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2">{stats.present}</h4>
                <p className="text-[9px] font-black text-emerald-600 mt-3 uppercase tracking-widest flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> Present On-Site
                </p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Clock className="w-6 h-6" />
             </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Absence</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2">{stats.onLeave}</h4>
                <p className="text-[9px] font-black text-amber-600 mt-3 uppercase tracking-widest">Authorized Leaves</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
             </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department Scope</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2">{stats.roles}</h4>
                <p className="text-[9px] font-black text-indigo-600 mt-3 uppercase tracking-widest">Unique Designations</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
             </div>
          </div>
        </div>
      </div>

      {/* Workflow Selection */}
      <div className="premium-tab-bar mb-8">
        {[
          { id: 'roster', label: 'Personnel Directory', icon: Users },
          { id: 'attendance', label: 'Attendance Stream', icon: Clock },
          { id: 'leaves', label: 'Authorized Absence', icon: Calendar },
          { id: 'payroll', label: 'Fiscal Settlement', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`premium-tab-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4 mr-2 inline-block opacity-70" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Surface */}
      <div className="min-h-[500px]">
        {activeTab === 'roster' && (
          <article className="glass-panel p-0 overflow-hidden shadow-sm border border-slate-100 animate-fade-in">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <h3 className="text-lg font-black text-slate-900">Facility Personnel Ledger</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Institutional registry of clinical and administrative staff</p>
               </div>
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    placeholder="Search by identity, role or MRN..." 
                    className="input-field pl-12 pr-6 py-4 w-full md:w-80 text-sm font-bold bg-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel Identity</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Governance Role</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Endpoint</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Connectivity</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Administrative Logic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.length === 0 ? (
                      <tr><td colSpan="5" className="px-8 py-32 text-center text-slate-400 italic">No personnel detected in current clinical shard.</td></tr>
                    ) : filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                                {emp.name?.[0] || 'U'}
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 leading-tight">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">CODE-ID: {emp.id?.slice(0, 8).toUpperCase()}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm ${
                             emp.designation?.toLowerCase().includes('admin') ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                           }`}>
                             {emp.designation || 'Specialist'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500">
                           {emp.email || '—'}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-3">
                              <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1.5">
                                 <ShieldAlert className="w-3 h-3" /> Reset Access
                              </button>
                              <button className="px-4 py-2 bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5">
                                 <Settings2 className="w-3 h-3" /> Manage
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

        {/* Attendance Tab Placeholder (Workable for UI consistency) */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-12 gap-8 animate-fade-in">
             <aside className="col-span-12 lg:col-span-4">
                <article className="glass-panel p-8">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500" /> Dispatch Log Entry
                   </h3>
                   <form className="space-y-6" onSubmit={(e) => { onRecordAttendance(e); e.target.reset(); }}>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Personnel Selection</label>
                         <select name="employeeId" className="input-field h-[56px] bg-white font-bold" required>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observance Date</label>
                         <input name="date" type="date" className="input-field py-4 bg-white font-bold" defaultValue={new Date().toISOString().slice(0, 10)} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Log-In Time</label>
                            <input name="timeIn" type="time" className="input-field py-4 bg-white font-bold" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 ml-1">Log-Out Time</label>
                            <input name="timeOut" type="time" className="input-field py-4 bg-white font-bold" />
                         </div>
                      </div>
                      <button type="submit" className="btn-primary w-full py-5 text-[10px] uppercase tracking-[0.2em] shadow-xl mt-4">
                         Commit Attendance Log
                      </button>
                   </form>
                </article>
             </aside>
             <main className="col-span-12 lg:col-span-8">
                <article className="glass-panel p-0 overflow-hidden shadow-sm">
                   <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/10">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Attendance Stream</h3>
                   </div>
                   <div className="p-20 text-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                          <Activity className="w-8 h-8" />
                       </div>
                       <p className="text-sm font-bold text-slate-400">Stream synchronization in progress. Loading historical logs...</p>
                   </div>
                </article>
             </main>
          </div>
        )}

        {/* Leave Tab Placeholder */}
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
             {employeeLeaves.length === 0 ? (
                <div className="col-span-full glass-panel p-24 text-center">
                   <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-sm">
                      <Calendar className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Clinical Absence Registry Empty</h3>
                   <p className="text-slate-400 text-sm mt-2">All facility personnel are currently authorized for on-site operations.</p>
                </div>
             ) : employeeLeaves.map(leave => (
                <article key={leave.id} className="glass-panel p-6 hover:shadow-lg transition-all border-b-4 border-b-amber-500">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                         <FileText className="w-5 h-5" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {leave.status}
                      </span>
                   </div>
                   <h4 className="font-black text-slate-900 leading-tight">Leave Authorization</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref: {leave.id?.slice(0, 8).toUpperCase()}</p>
                   
                   <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 font-bold uppercase text-[9px]">Period</span>
                         <span className="font-black text-slate-700">{new Date(leave.from).toLocaleDateString()} — {new Date(leave.to).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 font-bold uppercase text-[9px]">Type</span>
                         <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">{leave.type || 'Clinical'}</span>
                      </div>
                   </div>
                </article>
             ))}
          </div>
        )}

        {/* Payroll Tab Placeholder */}
        {activeTab === 'payroll' && (
          <article className="glass-panel p-0 overflow-hidden shadow-sm animate-fade-in border-t-4 border-t-indigo-500">
             <div className="px-8 py-8 flex justify-between items-center bg-indigo-50/20 border-b border-indigo-100">
                <div>
                   <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">Institutional Fiscal Center</h3>
                   <p className="text-sm font-medium text-indigo-700/60 mt-1">Authorized payroll settlement and liability registry</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center bg-white px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Outflow</p>
                       <p className="text-lg font-black text-slate-900">{currency(employees.reduce((s, e) => s + (e.salary || 0), 0))}</p>
                    </div>
                </div>
             </div>
             <div className="p-32 text-center text-slate-300">
                <Wallet className="w-16 h-16 mx-auto mb-6 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">Fiscal Logic Locking... Synchronizing with Ledger</p>
             </div>
          </article>
        )}
      </div>

      {/* Provisioning Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="glass-panel w-full max-w-2xl p-10 animate-fade-in shadow-2xl relative">
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>

              <div className="mb-10">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provision Personnel Node</h3>
                 <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Initialize organizational endpoint & access authorization</p>
              </div>

              <form className="space-y-8" onSubmit={(e) => { onCreateEmployee(e); setShowRegisterModal(false); }}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Identity</label>
                       <input name="name" className="input-field py-4 font-bold" required placeholder="Personnel Name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Governance Designation</label>
                       <select name="designation" className="input-field h-[56px] font-bold" required>
                          <option value="Admin">Clinical Administrator</option>
                          <option value="Doctor">Medical Practitioner</option>
                          <option value="Nurse">Nursing Lead</option>
                          <option value="Support">Support Operations</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Liability Code (Salary)</label>
                       <input name="salary" type="number" className="input-field py-4 font-mono font-bold" defaultValue="45000" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institutional Communication Hub (Email)</label>
                       <input name="email" type="email" className="input-field py-4" required placeholder="personnel@facility-endpoint.com" />
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-100 flex gap-4">
                    <button type="button" className="flex-1 py-4 text-[11px] font-black uppercase tracking-[.2em] text-slate-400" onClick={() => setShowRegisterModal(false)}>Discard</button>
                    <button type="submit" className="flex-2 btn-primary py-4 px-12 text-[11px] uppercase tracking-[.2em] shadow-xl">Activate Personnel Shard</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
