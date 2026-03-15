import { useState, useEffect } from 'react';
import api from '../api.js';
import { currency } from '../utils/format.js';

export default function EmployeesPage({ employees: propEmployees, employeeLeaves = [], onCreateEmployee, onRecordAttendance, onApplyLeave, tenant }) {
  const [employees, setEmployees] = useState(propEmployees || []);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'attendance' | 'leaves' | 'salary' | 'payslips'
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [salarySettings, setSalarySettings] = useState({ taxPercent: 10, pfPercent: 12, bonus: 0 });

  useEffect(() => {
    setEmployees(propEmployees || []);
  }, [propEmployees]);

  useEffect(() => {
    async function loadAttendance() {
      if (!tenant) return;
      try {
        const records = await api.getAttendance(tenant.id, attendanceDate);
        setAttendanceRecords(records || []);
      } catch { setAttendanceRecords([]); }
    }
    loadAttendance();
  }, [tenant, attendanceDate]);

  const refreshAttendance = async () => {
    if (!tenant) return;
    try {
      const records = await api.getAttendance(tenant.id, attendanceDate);
      setAttendanceRecords(records || []);
    } catch { /* ignore */ }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    await onRecordAttendance(e);
    await refreshAttendance();
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Absent': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Half-Day': return 'bg-amber-100/50 text-amber-600 border-amber-200';
      case 'Leave': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="hr-intelligence-workspace slide-up">
      {/* 1. HEADER & ORCHESTRATION */}
      <div className="flex-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Human Capital Intelligence</h1>
          <p className="text-sm text-slate-500">Organizational Oversight & Workforce Logistics</p>
        </div>
        <div className="clinical-tab-bar">
          {['roster', 'attendance', 'leaves', 'salary', 'payslips'].map(tab => (
            <button
              key={tab}
              className={`clinical-tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TAB CONTENT ORCHESTRATION */}
      
      {/* DIRECTORY SECTION */}
      {activeTab === 'roster' && (
        <section className="card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex-between">
            <h3 className="text-lg font-bold">Personnel Directory</h3>
            <span className="text-[10px] font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-full uppercase tracking-widest">{employees.length} Active Personnel</span>
          </div>
          <div className="overflow-x-auto">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>E-Mail Address</th>
                  <th style={{ textAlign: 'right' }}>Administrative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs shadow-lg">
                          {emp.name ? emp.name[0] : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 tracking-tight">{emp.name}</div>
                          <div className="text-[10px] text-teal-500 font-black uppercase tracking-widest">EMP-{emp.id.slice(0, 6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${emp.designation === 'Admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
                        {emp.designation}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">{emp.email || '—'}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-colors">RESET ACCESS</button>
                        <button className="text-[10px] font-black text-teal-600 hover:text-teal-900 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-widest transition-colors">MANAGE</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ATTENDANCE SECTION */}
      {activeTab === 'attendance' && (
        <div className="grid-3 gap-8 items-start">
          <aside className="card border-l-4 border-teal-500">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6">Log Event</h3>
            <form onSubmit={handleAttendanceSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Identity Selection</label>
                <select name="employeeId" className="input-field" required>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Observance Date</label>
                <input name="date" type="date" className="input-field" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 text-emerald-600">IN_LOG</label>
                  <input name="timeIn" type="time" className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 text-amber-600">OUT_LOG</label>
                  <input name="timeOut" type="time" className="input-field" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Fiscal Status</label>
                <select name="status" className="input-field">
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Half-Day</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full py-4 uppercase tracking-widest">Commit Log Entry</button>
            </form>
          </aside>

          <main className="col-span-2 space-y-6" style={{ gridColumn: 'span 2' }}>
            <section className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/20">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Attendance Stream — {new Date(attendanceDate).toDateString()}</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-6 py-3 text-left">Identity</th>
                    <th className="px-6 py-3 text-left">Metrics</th>
                    <th className="px-6 py-3 text-center">Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendanceRecords.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-24 text-center text-slate-400 italic text-sm">No clinical attendance recorded for this shard date.</td></tr>
                  ) : (
                    attendanceRecords.map((r, idx) => (
                      <tr key={r.id} className="slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{r.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">ID: {r.code || 'SYS-X'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4 items-center">
                            <div className="text-xs">
                              <span className="text-[10px] font-black text-emerald-600 mr-2">IN:</span>
                              <span className="text-slate-800 font-bold">{r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-[10px] font-black text-amber-600 mr-2">OUT:</span>
                              <span className="text-slate-800 font-bold">{r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${statusColor(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </main>
        </div>
      )}

      {/* LEAVE SECTION */}
      {activeTab === 'leaves' && (
        <div className="grid-3 gap-8 items-start">
          <aside className="card border-l-4 border-amber-500">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6">Leave Directive</h3>
            <form onSubmit={onApplyLeave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Identity</label>
                <select name="employeeId" className="input-field" required>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">From</label>
                  <input name="from" type="date" className="input-field" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">To</label>
                  <input name="to" type="date" className="input-field" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Rationale</label>
                <select name="type" className="input-field">
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Earned</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full py-4 uppercase tracking-widest bg-amber-600 border-amber-600 hover:bg-amber-700">Submit Objective</button>
            </form>
          </aside>

          <main className="col-span-2 space-y-6" style={{ gridColumn: 'span 2' }}>
            <section className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Leave Ledger</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-6 py-3 text-left">Subject</th>
                    <th className="px-6 py-3 text-left">Span</th>
                    <th className="px-6 py-3 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employeeLeaves.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-24 text-center text-slate-400 italic text-sm">No leave directives found in registry.</td></tr>
                  ) : (
                    employeeLeaves.map((l, idx) => {
                      const empName = employees.find(e => e.id === l.employeeId)?.name || 'Unknown';
                      return (
                        <tr key={l.id} className="slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{empName}</div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${l.type === 'Sick' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>{l.type}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">
                            {new Date(l.from).toLocaleDateString()} <span className="text-slate-300 mx-2">→</span> {new Date(l.to).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : l.status === 'Rejected' ? 'bg-amber-50 text-amber-700' : 'bg-amber-50/50 text-amber-600 border-amber-100'}`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          </main>
        </div>
      )}

      {/* SALARY SECTION */}
      {activeTab === 'salary' && (
        <section className="card p-0 overflow-hidden border-t-4 border-emerald-500">
          <div className="p-8 border-b border-slate-100 flex-between bg-emerald-50/20">
            <div>
              <h3 className="text-xl font-black text-emerald-900">Payroll Orchestration</h3>
              <p className="text-sm text-emerald-700/60 font-medium">Fiscal reconciliation based on clinical observance</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-white rounded-lg border border-emerald-100 shadow-sm">
                <div className="text-[9px] font-black uppercase text-slate-400">Tax Index</div>
                <div className="text-sm font-black text-slate-800">{salarySettings.taxPercent}%</div>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg border border-emerald-100 shadow-sm">
                <div className="text-[9px] font-black uppercase text-slate-400">PF Allocation</div>
                <div className="text-sm font-black text-slate-800">{salarySettings.pfPercent}%</div>
              </div>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-left">Identity</th>
                <th className="px-8 py-4 text-right">Base Logic</th>
                <th className="px-8 py-4 text-right text-emerald-600">Credit</th>
                <th className="px-8 py-4 text-right text-amber-600">Debit</th>
                <th className="px-8 py-4 text-right text-slate-900 border-l border-slate-100 bg-slate-50/50">Fiscal Net</th>
                <th className="px-8 py-4 text-center">Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(e => {
                const base = e.salary || 0;
                const tax = (base * salarySettings.taxPercent) / 100;
                const pf = (base * salarySettings.pfPercent) / 100;
                const net = base - tax - pf;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6 font-bold text-slate-800">{e.name}</td>
                    <td className="px-8 py-6 text-right font-medium text-slate-500">{currency(base)}</td>
                    <td className="px-8 py-6 text-right font-black text-emerald-600">+ {currency(0)}</td>
                    <td className="px-8 py-6 text-right font-black text-amber-600">- {currency(tax + pf)}</td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 text-lg border-l border-slate-50 bg-slate-50/20">{currency(net)}</td>
                    <td className="px-8 py-6 text-center">
                      <button className="btn btn-primary py-1 px-5 text-[10px] bg-emerald-600 border-emerald-600 hover:bg-emerald-700">SETTLE</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* PAYSLIP SECTION */}
      {activeTab === 'payslips' && (
        <section className="space-y-8">
          <div className="grid grid-cols-4 gap-6">
            {employees.map((e, idx) => (
              <div key={e.id} className="card p-6 flex flex-col items-center text-center slide-up hover:border-teal-500 transition-all border-t-4 border-teal-500" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div className="font-bold text-slate-800">{e.name}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-6">EMP-{e.id.slice(0, 6)}</div>
                <button
                  className="w-full btn btn-outline py-2 text-[10px] font-black"
                  onClick={() => alert(`Generating institutional payslip for \${e.name}...`)}
                >
                  DOWNLOAD PDF
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
