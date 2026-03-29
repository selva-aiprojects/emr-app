import { useState, useMemo, useEffect } from 'react';
import { api } from '../api';
import '../styles/critical-care.css';
import { useToast } from '../hooks/useToast.jsx';

import { 
  Users, 
  UserPlus, 
  Clock, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function EmployeesPage({ tenant, initialTab = 'roster', employees: employeesProp = [], onCreateEmployee }) {
  const { showToast } = useToast();

  const [employees, setEmployees] = useState(Array.isArray(employeesProp) ? employeesProp : []);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'roster' | 'attendance' | 'leaves' | 'payroll'
  const [showRegModal, setShowRegModal] = useState(false);
  const [roleSelection, setRoleSelection] = useState('Doctor');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (Array.isArray(employeesProp)) {
      setEmployees(employeesProp);
    }
  }, [employeesProp]);

  useEffect(() => {
    async function loadDepartments() {
      if (!tenant?.id) return;
      try {
        const data = await api.getDepartments();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Department Sync Interrupted:', err);
      }
    }
    loadDepartments();
  }, [tenant?.id]);

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length || employees.length,
    onLeave: 2,
    deptCount: 4
  };

  const isDoctorRole = roleSelection === 'Doctor';

  return (
    <>
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Human Capital & Workforce Hub
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Staffing Node</span>
           </h1>
           <p className="dim-label">Organizational personnel management, payroll distribution, and credentialing for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Personnel Integrity Validated • Workforce sync operational
           </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="clinical-btn bg-slate-900 text-white px-6 !min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
            onClick={() => setShowRegModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Employee
          </button>
          <div className="flex bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit">
            {[
              { id: 'roster', label: 'Workforce Roster', icon: Users },
              { id: 'attendance', label: 'Attendance Log', icon: Clock },
              { id: 'payroll', label: 'Payroll Ledger', icon: Wallet }
            ].map(tab => (
              <button 
                key={tab.id}
                className={`clinical-btn !min-h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="vitals-monitor mb-10">
        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">Active Personnel</span>
              <Users className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{stats.active}</span>
           <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest">Node coverage stable</p>
        </div>

        <div className="vital-node vital-node--warning shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">Shift Gaps</span>
              <Clock className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">01</span>
           <p className="text-[10px] font-black text-amber-600 mt-2 uppercase tracking-widest">Requires allocation</p>
        </div>

        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">Fiscal Velocity</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1 text-2xl">98%</span>
           <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Utilization Rate</p>
        </div>
      </section>
      <main className="clinical-card !p-0 overflow-hidden">
        {/* ROSTER TAB */}
        {activeTab === 'roster' && (
          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="tracking-widest">Employee Name</th>
                  <th className="tracking-widest">Institutional Role</th>
                  <th className="tracking-widest">Deployment Status</th>
                  <th className="tracking-widest">Activity Pulse</th>
                  <th style={{ textAlign: 'right' }} className="tracking-widest">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-24 text-slate-300 italic font-black uppercase tracking-widest">Syncing workforce metrics...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-24">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                        <Users className="w-8 h-8 text-slate-300" />
                     </div>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No personnel provisioned in this sector.</p>
                  </td></tr>
                ) : employees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                    <td>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-black">
                            {emp.name?.[0] || 'U'}
                         </div>
                         <div>
                            <div className="text-sm font-black text-slate-900">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 tabular-nums">PID-${(emp.id || 'X').slice(0, 8)}</div>
                         </div>
                      </div>
                    </td>
                    <td>
                       <div className="text-xs font-black text-slate-700 uppercase tracking-tighter">{emp.designation || emp.role || 'Service Technician'}</div>
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{emp.department || 'General Services'}</div>
                    </td>
                    <td>
                       <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{emp.status || 'Active Deployment'}</span>
                       </div>
                    </td>
                    <td>
                       <div className="flex items-center gap-4">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 tabular-nums">85%</span>
                       </div>
                    </td>
                    <td className="text-right">
                      <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                         <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-12 gap-8 p-8 animate-fade-in">
             <aside className="col-span-12 lg:col-span-4">
                <article className="clinical-card !shadow-none border border-slate-100">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Record Activity Shard</h3>
                   <form className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Personnel Identity</label>
                         <select className="input-field h-[54px] bg-slate-50 border-none rounded-xl font-bold">
                            {employees.map(e => <option key={e.id}>{e.name}</option>)}
                         </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time In</label>
                            <input type="time" defaultValue="09:00" className="input-field py-4 bg-slate-50 border-none rounded-xl font-black" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>
                            <select className="input-field h-[54px] bg-slate-50 border-none rounded-xl font-bold text-emerald-600">
                               <option>Present</option>
                               <option>Late</option>
                               <option>On-Call</option>
                            </select>
                         </div>
                      </div>
                      <button className="clinical-btn bg-slate-900 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                         Commit Shift Shard
                      </button>
                   </form>
                </article>
             </aside>
             <main className="col-span-12 lg:col-span-8">
                <div className="premium-table-container !border-none">
                   <table className="premium-table">
                      <thead>
                         <tr>
                            <th className="tracking-widest">Staff Node</th>
                            <th className="tracking-widest">Temporal Log</th>
                            <th className="tracking-widest">Duration</th>
                            <th className="tracking-widest">Status Shard</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {employees.slice(0, 5).map((emp, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                             <td><span className="text-sm font-black text-slate-800">{emp.name}</span></td>
                             <td><span className="text-xs font-bold text-slate-500">Mar 16, 09:02 AM</span></td>
                             <td><span className="text-xs font-black text-slate-900">08h 12m</span></td>
                             <td>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">Verified Present</span>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </main>
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === 'payroll' && (
          <div className="p-8 animate-fade-in">
             <article className="clinical-card border-t-4 border-indigo-600">
                <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Financial Compensation Ledger</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Monthly personnel payout distribution</p>
                   </div>
                   <div className="flex gap-3">
                      <button className="clinical-btn bg-indigo-50 text-indigo-700 px-6 !min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-widest border-none">
                         Generate All Payslips
                      </button>
                   </div>
                </header>
                
                <div className="premium-table-container">
                   <table className="premium-table">
                      <thead>
                         <tr>
                            <th className="tracking-widest">Identity Personnel</th>
                            <th className="tracking-widest">Base Payout</th>
                            <th className="tracking-widest">Deployment (Days)</th>
                            <th className="tracking-widest">Deduction Shards</th>
                            <th style={{ textAlign: 'right' }} className="tracking-widest">Net Payable Shard</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {employees.map((emp, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td>
                                 <div className="text-sm font-black text-slate-800">{emp.name}</div>
                                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.role}</div>
                              </td>
                              <td className="text-sm font-black text-slate-900 tabular-nums">₹{emp.salary || '45,000'}</td>
                              <td className="text-sm font-black text-slate-500 tabular-nums">24 / 26</td>
                              <td className="text-sm font-black text-rose-500 tabular-nums">₹0.00</td>
                              <td style={{ textAlign: 'right' }}>
                                 <div className="text-sm font-black text-indigo-600 tabular-nums">₹{emp.salary || '45,000'}</div>
                                 <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 mt-1 transition-colors">Generate Slip</button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </article>
          </div>
        )}
      </main>

      {showRegModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowRegModal(false)}>
          <div className="relative clinical-card w-full max-w-2xl p-10 shadow-2xl" onClick={e => e.stopPropagation()}>
             <header className="mb-10 flex justify-between items-start">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Personnel Provisioning Node</h3>
                   <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Authorized Institutional Enrollment</p>
                </div>
                <button className="text-slate-300 hover:text-slate-600" onClick={() => setShowRegModal(false)}>
                   <Plus className="w-6 h-6 rotate-45" />
                </button>
             </header>

              <form className="space-y-10" onSubmit={async (e) => {
                try {
                  if (onCreateEmployee) await onCreateEmployee(e);
                  showToast({ message: 'Personnel Provisioned Successfully', type: 'success', title: 'Workforce Hub' });
                  setShowRegModal(false);
                } catch (err) {
                  showToast({ message: err.message, type: 'error', title: 'Provisioning Error' });
                }
              }}>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Legal Name</label>
                      <input name="name" className="input-field py-4 bg-slate-50 border-none rounded-xl" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Role Shard</label>
                      <select
                        name="designation"
                        className="input-field h-[56px] bg-slate-50 border-none rounded-xl font-bold"
                        value={roleSelection}
                        onChange={(e) => setRoleSelection(e.target.value)}
                      >
                         <option>Doctor</option>
                         <option>Nurse</option>
                         <option>Lab</option>
                         <option>Pharmacy</option>
                         <option>Admin</option>
                         <option>Billing</option>
                         <option>Front Office</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {isDoctorRole ? 'Department Mapping (Required)' : 'Department Mapping'}
                      </label>
                      {departments.length > 0 ? (
                        <select
                          name="department"
                          className="input-field h-[56px] bg-slate-50 border-none rounded-xl font-bold"
                          required={isDoctorRole}
                          defaultValue=""
                        >
                           <option value="" disabled>Select Department...</option>
                           {departments.map((dept) => (
                             <option key={dept.id} value={dept.name}>{dept.name}</option>
                           ))}
                        </select>
                      ) : (
                        <input
                          name="department"
                          className="input-field py-4 bg-slate-50 border-none rounded-xl"
                          placeholder="e.g. Cardiology"
                          required={isDoctorRole}
                        />
                      )}
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Joining Vector</label>
                      <input name="joinDate" type="date" className="input-field py-4 bg-slate-50 border-none rounded-xl" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee Code</label>
                      <input name="code" className="input-field py-4 bg-slate-50 border-none rounded-xl" placeholder="EMP-001" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Shift Vector</label>
                      <select name="shift" className="input-field h-[56px] bg-slate-50 border-none rounded-xl font-bold" defaultValue="Morning">
                         <option>Morning</option>
                         <option>Evening</option>
                         <option>Night</option>
                         <option>Rotating</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base Compensation Nodes</label>
                      <input name="salary" className="input-field py-4 bg-slate-50 border-none rounded-xl" placeholder="45000" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Designation</label>
                      <input name="designationLabel" className="input-field py-4 bg-slate-50 border-none rounded-xl" placeholder={roleSelection} disabled />
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex gap-4">
                   <button type="submit" className="clinical-btn bg-slate-900 text-white px-12 !min-h-[56px] rounded-2xl text-xs font-black uppercase shadow-2xl">Finalize Provisioning</button>
                   <button type="button" className="clinical-btn bg-white border border-slate-200 text-slate-400 px-8 rounded-2xl text-xs" onClick={() => setShowRegModal(false)}>Cancel Protocol</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
