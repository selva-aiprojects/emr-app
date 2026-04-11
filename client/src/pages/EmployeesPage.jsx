import React, { useState, useMemo } from 'react';
import { Plus, Search, UserCircle, Briefcase, Activity, Calendar, ShieldCheck, Mail, MapPin, Wallet, Filter, CheckCircle, Clock } from 'lucide-react';

export default function EmployeesPage({ tenant, employees = [], onCreateEmployee }) {
  const [showRegModal, setShowRegModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Filtered list with stability checks
  const filteredEmployees = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.filter(emp => {
      const name = (emp.name || '').toLowerCase();
      const code = (emp.code || '').toLowerCase();
      const role = (emp.designation || emp.role || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || code.includes(search) || role.includes(search);
      const matchesRole = roleFilter === 'All' || (emp.designation || emp.role) === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [employees, searchTerm, roleFilter]);

  const roles = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return ['All', ...new Set(list.map(emp => emp.designation || emp.role).filter(Boolean))];
  }, [employees]);

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Institutional Personnel Hub
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Workforce Shard</span>
           </h1>
           <p className="dim-label">Workforce deployment, clinical credentialing, and payroll shard management for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Administrative Integrity Validated • Real-time Attendance Active
           </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowRegModal(true)}
             className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-slate-50 flex items-center gap-2"
           >
              <Plus className="w-4 h-4" />
              Enroll Workforce
           </button>
        </div>
      </header>

      {/* STRATEGIC METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
         <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-blue-600">
            <div>
               <p className="stat-label">Headcount Shards</p>
               <p className="stat-value mt-2">{employees.length}</p>
               <p className="stat-sub text-blue-600 mt-1">Active Personnel</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
               <UserCircle className="w-6 h-6" />
            </div>
         </div>
         <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-emerald-600">
            <div>
               <p className="stat-label">Shift Compliance</p>
               <p className="stat-value mt-2">94%</p>
               <p className="stat-sub text-emerald-600 mt-1">SLA Maintained</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <Clock className="w-6 h-6" />
            </div>
         </div>
         <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-indigo-600">
            <div>
               <p className="stat-label">Clinical Ratio</p>
               <p className="stat-value mt-2">1:4</p>
               <p className="stat-sub text-indigo-600 mt-1">Practitioner Load</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
               <Activity className="w-6 h-6" />
            </div>
         </div>
         <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-slate-900">
            <div>
               <p className="stat-label">Payroll Health</p>
               <p className="stat-value mt-2">Optimal</p>
               <p className="stat-sub text-slate-500 mt-1">Fiscal Efficiency</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center">
               <Wallet className="w-6 h-6" />
            </div>
         </div>
      </section>

      {/* ACTION BAR */}
      <div className="action-bar-premium mb-8">
         <div className="flex-1 max-w-lg relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Filter personnel by name, role or ID..." 
              className="input-field pl-6 pr-12 py-4 text-sm font-bold bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="input-field py-4 px-6 bg-white w-48 text-xs font-black uppercase tracking-widest"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
               {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
         </div>
      </div>

      <main className="space-y-10">
         <article className="glass-panel p-0 overflow-hidden shadow-sm">
            <header className="px-8 py-6 border-b border-slate-100 bg-slate-50/20">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Personnel Roster Shard</h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Workforce registry for active institutional clinical nodes</p>
            </header>
            
            <div className="premium-table-container">
               <table className="premium-table">
                  <thead>
                     <tr>
                        <th>Workforce Identity</th>
                        <th>Deployment (Days)</th>
                        <th>Base Compensation</th>
                        <th>Fiscal Stability</th>
                        <th style={{ textAlign: 'right' }}>Security Access</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredEmployees.length === 0 ? (
                       <tr>
                          <td colSpan="5" className="text-center py-20 text-slate-400">
                             <div className="flex flex-col items-center gap-4">
                                <UserCircle size={40} className="opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">No matching personnel records found in shard</span>
                             </div>
                          </td>
                       </tr>
                     ) : (
                       filteredEmployees.map((emp, idx) => (
                         <tr key={emp.id || idx} className="hover:bg-slate-50/50 transition-colors">
                            <td>
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs">
                                     {emp.name?.[0] || 'P'}
                                  </div>
                                  <div>
                                     <div className="text-sm font-black text-slate-800">{emp.name}</div>
                                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Briefcase className="w-2.5 h-2.5" /> {emp.designation || emp.role}
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td>
                               <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                                     <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                                  </div>
                                  <span className="text-xs font-black tabular-nums text-slate-700">24/26</span>
                               </div>
                            </td>
                            <td>
                               <div className="text-sm font-black text-slate-900 tabular-nums">₹{(Number(emp.salary) || 45000).toLocaleString()}</div>
                               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fixed Monthly Shard</div>
                            </td>
                            <td>
                               <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-100">Optimal</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                               <button className="px-4 py-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Audit Credentials</button>
                            </td>
                         </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </div>
         </article>
      </main>

      {showRegModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md bg-slate-900/40">
          <div className="relative glass-panel w-full max-w-3xl p-10 shadow-3xl overflow-y-auto max-h-[90vh]">
             <header className="mb-10 flex justify-between items-start">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Workforce Provisioning</h3>
                   <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Authorized Institutional Personnel Enrollment</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200" onClick={() => setShowRegModal(false)}>
                   <Plus className="w-6 h-6 rotate-45" />
                </button>
             </header>

              <form className="space-y-10" onSubmit={async (e) => {
                 await onCreateEmployee(e);
                 setShowRegModal(false);
              }}>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Full Name</label>
                       <div className="relative">
                          <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="name" className="input-field pl-12 h-14 bg-slate-50 border-none font-bold" placeholder="E.g. Dr. Alexander Pierce" required />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional E-Mail</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="email" type="email" className="input-field pl-12 h-14 bg-slate-50 border-none font-bold" placeholder="alex.p@facility.com" required />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Designation</label>
                       <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <select name="designation" className="input-field pl-12 h-14 bg-slate-50 border-none font-black uppercase tracking-widest text-[10px]" required>
                             <option value="Doctor">Clinical Practitioner (Doctor)</option>
                             <option value="Nurse">Medical Associate (Nurse)</option>
                             <option value="Lab">Lab Specialist</option>
                             <option value="Pharmacy">Pharma Consultant</option>
                             <option value="Administrator">Executive Admin</option>
                             <option value="Support Staff">Deployment Support</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deployment Code</label>
                       <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="code" className="input-field pl-12 h-14 bg-slate-50 border-none font-black uppercase tracking-widest placeholder:opacity-50" placeholder="E.g. NHG-EMP-902" required />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-50">
                    <div className="space-y-2 text-center md:text-left">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollment Date</label>
                       <input name="joinDate" type="date" className="input-field h-14 bg-slate-50 border-none font-bold" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Shift</label>
                       <select name="shift" className="input-field h-14 bg-slate-50 border-none font-black uppercase tracking-widest text-[10px]">
                          <option>Morning (08:00 - 16:00)</option>
                          <option>Evening (16:00 - 00:00)</option>
                          <option>Night (00:00 - 08:00)</option>
                          <option>Rotation (Variable)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fixed Compensation</label>
                       <div className="relative">
                          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="salary" type="number" className="input-field pl-12 h-14 bg-slate-50 border-none font-black tabular-nums" placeholder="75000" required />
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-indigo-500 shadow-sm flex items-center justify-center shrink-0">
                       <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Authorization Protocol</h4>
                       <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                          Provisioning a 'Doctor' node will automatically synchronize clinical identity across the appointment shard and practitioners registry. Security clearance must be validated.
                       </p>
                    </div>
                 </div>

                 <div className="pt-10 flex gap-4">
                    <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Abort Enrollment</button>
                    <button type="submit" className="flex-[2] clinical-btn bg-slate-900 text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20">Commit Personnel Provisioning</button>
                 </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
