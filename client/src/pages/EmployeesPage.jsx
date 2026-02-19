import { useState, useEffect } from 'react';
import api from '../api.js';
import { currency } from '../utils/format.js';

export default function EmployeesPage({ employees: propEmployees, employeeLeaves = [], onCreateEmployee, onRecordAttendance, onApplyLeave, tenant }) {
  const [employees, setEmployees] = useState(propEmployees || []);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'attendance' | 'leaves' | 'salary' | 'payslips'
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [salarySettings, setSalarySettings] = useState({
    taxPercent: 10,
    pfPercent: 12,
    bonus: 0
  });

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
      case 'Present': return 'success';
      case 'Absent': return 'danger';
      case 'Half-Day': return 'warning';
      case 'Leave': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <section>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'roster', params: { icon: '👥', label: 'Employee Roster' } },
          { id: 'attendance', params: { icon: '📋', label: 'Daily Attendance' } },
          { id: 'leaves', params: { icon: '🏖️', label: 'Leave Management' } },
          { id: 'salary', params: { icon: '💰', label: 'Salary Processing' } },
          { id: 'payslips', params: { icon: '🧾', label: 'Payslip Generator' } }
        ].map(tab => (
          <button
            key={tab.id}
            className={`premium-btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.params.icon}</span>
            {tab.params.label}
          </button>
        ))}
      </div>

      {/* Employee Roster */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-12 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1.5rem' }}>
          <article className="premium-panel" style={{ gridColumn: 'span 4' }}>
            <div className="panel-header">
              <div className="panel-title">Add New Employee</div>
            </div>
            <form onSubmit={onCreateEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <input className="premium-input" name="name" placeholder="Full Name" required />
                <input className="premium-input" name="code" placeholder="Employee Code (e.g. EMP-001)" required />
                <input className="premium-input" name="department" placeholder="Department" required />
                <input className="premium-input" name="designation" placeholder="Designation" required />
                <div className="grid-cols-2">
                  <input className="premium-input" name="joinDate" type="date" required />
                  <select className="premium-select" name="shift"><option>Morning</option><option>Evening</option><option>Night</option></select>
                </div>
                <input className="premium-input" name="salary" type="number" placeholder="Monthly Salary (₹)" required />

                <button type="submit" className="premium-btn btn-primary mt-2">
                  + Create Employee
                </button>
              </div>
            </form>
          </article>

          <article className="premium-panel" style={{ gridColumn: 'span 8' }}>
            <div className="panel-header">
              <div className="panel-title">Staff Directory ({employees.length})</div>
            </div>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Dept & Role</th>
                    <th>Shift</th>
                    <th style={{ textAlign: 'right' }}>Salary</th>
                    <th style={{ textAlign: 'center' }}>Leaves</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 && (
                    <tr><td colSpan="6" className="text-center p-8 text-muted">No employees registered yet.</td></tr>
                  )}
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td><span className="badge secondary">{e.code}</span></td>
                      <td className="font-bold">{e.name}</td>
                      <td>
                        <div className="text-sm">{e.department || '-'}</div>
                        <div className="text-xs text-muted">{e.designation}</div>
                      </td>
                      <td>
                        <span className="badge info">{e.shift || 'Morning'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{currency(e.salary)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${e.leaveBalance > 0 ? 'success' : 'danger'}`}>
                          {e.leaveBalance ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}

      {/* Daily Attendance */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-12 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1.5rem' }}>
          <article className="premium-panel" style={{ gridColumn: 'span 4' }}>
            <div className="panel-header">
              <div className="panel-title">Mark Attendance</div>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-muted uppercase">Employee</label>
                <select name="employeeId" className="premium-select" required>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.code} - {e.name}</option>)}
                </select>

                <label className="text-xs font-bold text-muted uppercase">Date</label>
                <input name="date" type="date" className="premium-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required />

                <div className="grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase">In</label>
                    <input name="timeIn" type="time" className="premium-input" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted uppercase">Out</label>
                    <input name="timeOut" type="time" className="premium-input" />
                  </div>
                </div>

                <label className="text-xs font-bold text-muted uppercase">Status</label>
                <select name="status" className="premium-select">
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Half-Day</option>
                </select>

                <button type="submit" className="premium-btn btn-primary mt-2">✓ Mark Attendance</button>
              </div>
            </form>
          </article>

          <article className="premium-panel" style={{ gridColumn: 'span 8' }}>
            <div className="panel-header">
              <div className="panel-title">
                Attendance — {new Date(attendanceDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 && (
                  <tr><td colSpan="5" className="text-center p-8 text-muted">No attendance records for this date.</td></tr>
                )}
                {attendanceRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-bold">{r.name}</div>
                      <div className="text-xs text-muted">{r.code}</div>
                    </td>
                    <td className="text-sm text-muted">{r.shift || '-'}</td>
                    <td className="text-sm">{r.check_in ? new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="text-sm">{r.check_out ? new Date(r.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {/* Leave Management */}
      {activeTab === 'leaves' && (
        <div className="grid grid-cols-12 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1.5rem' }}>
          <article className="premium-panel" style={{ gridColumn: 'span 4' }}>
            <div className="panel-header"><div className="panel-title">Apply for Leave</div></div>
            <form onSubmit={onApplyLeave} className="flex flex-col gap-4">
              <select name="employeeId" className="premium-select" required>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.code} - {e.name}</option>)}
              </select>
              <div className="grid-cols-2">
                <input name="from" type="date" className="premium-input" required />
                <input name="to" type="date" className="premium-input" required />
              </div>
              <select name="type" className="premium-select"><option>Casual</option><option>Sick</option><option>Earned</option></select>
              <button type="submit" className="premium-btn btn-primary">Submit Request</button>
            </form>
          </article>

          <article className="premium-panel" style={{ gridColumn: 'span 8' }}>
            <div className="panel-header"><div className="panel-title">Leave Requests</div></div>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {employeeLeaves.length === 0 && (
                  <tr><td colSpan="4" className="text-center p-8 text-muted">No leave requests found.</td></tr>
                )}
                {employeeLeaves.map((l) => {
                  const empName = employees.find(e => e.id === l.employeeId)?.name || l.employeeId?.slice(0, 8);
                  return (
                    <tr key={l.id}>
                      <td className="font-bold">{empName}</td>
                      <td className="text-sm">
                        {l.from ? new Date(l.from).toLocaleDateString('en-IN') : '-'}
                        <span className="mx-1">→</span>
                        {l.to ? new Date(l.to).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td>
                        <span className={`badge ${l.type === 'Sick' ? 'danger' : 'info'}`}>{l.type}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {/* Salary Processing */}
      {activeTab === 'salary' && (
        <article className="premium-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Payroll Intelligence</div>
              <p className="text-sm text-muted mt-1">Calculate net payables based on clinical attendance.</p>
            </div>
            <div className="flex gap-4">
              <div className="badge secondary">Tax: {salarySettings.taxPercent}%</div>
              <div className="badge secondary">PF: {salarySettings.pfPercent}%</div>
            </div>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base Pay</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Payable</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => {
                const base = e.salary || 0;
                const tax = (base * salarySettings.taxPercent) / 100;
                const pf = (base * salarySettings.pfPercent) / 100;
                const net = base - tax - pf;
                return (
                  <tr key={e.id}>
                    <td className="font-bold">{e.name}</td>
                    <td>{currency(base)}</td>
                    <td className="text-success">+ {currency(0)}</td>
                    <td className="text-danger">- {currency(tax + pf)}</td>
                    <td className="font-bold">{currency(net)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="premium-btn btn-primary py-1 px-3 text-xs">Process</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}

      {/* Payslip Generator */}
      {activeTab === 'payslips' && (
        <article className="premium-panel">
          <div className="panel-header">
            <div className="panel-title">Staff Payslip Archive</div>
          </div>
          <div className="grid-cols-4">
            {employees.map(e => (
              <div key={e.id} className="p-4 border rounded-xl hover:shadow-md transition bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm">{e.name}</div>
                  <div className="text-xs text-muted">ID: {e.code}</div>
                </div>
                <button
                  className="premium-btn btn-ghost text-xs border"
                  onClick={() => alert(`Generating institutional payslip for ${e.name}...`)}
                >
                  PDF
                </button>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
