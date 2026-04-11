
import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Calendar, 
  ChevronDown, 
  Download, 
  Wallet, 
  TrendingUp, 
  UserCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Printer,
  FileText
} from 'lucide-react';

export default function PayrollServicePage({ tenant, employees = [], attendance = [] }) {
  const [fiscalYear, setFiscalYear] = useState('2024-2025');
  const [activeTab, setActiveTab] = useState('ledger');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const fiscalYears = ['2023-2024', '2024-2025', '2025-2026'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Derived fiscal metrics
  const totalPaidFiscal = useMemo(() => {
    return employees.reduce((acc, emp) => acc + (Number(emp.salary || 0) * (selectedMonth + 1)), 0);
  }, [employees, selectedMonth]);

  const stats = [
    { label: 'Fiscal Payout', value: `₹${totalPaidFiscal.toLocaleString()}`, sub: `So far in ${fiscalYear}`, icon: Wallet, color: 'blue' },
    { label: 'Monthly Liability', value: `₹${employees.reduce((a, b) => a + Number(b.salary || 0), 0).toLocaleString()}`, sub: '100% Payroll Health', icon: TrendingUp, color: 'emerald' },
    { label: 'Statutory Dues', value: '₹124,500', sub: 'Retirement & Benefits', icon: ShieldCheck, color: 'indigo' },
    { label: 'Net Disbursed', value: `₹${(totalPaidFiscal * 0.92).toLocaleString()}`, sub: 'Post-Deduction Net', icon: Receipt, color: 'slate' },
  ];

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
             <Receipt className="w-8 h-8 text-white/80" />
             <h1 className="text-3xl font-black text-white uppercase tracking-tight">Payroll & Statutory Hub</h1>
          </div>
          <p className="dim-label text-white/70">Institutional financial engine for {tenant?.name}. Manage fiscal year payouts, statutory benefits, and employee disbursements.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Selected Fiscal Shard</span>
            <div className="relative group">
              <select 
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="appearance-none bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 pr-10 rounded-2xl text-sm font-black transition-all cursor-pointer outline-none"
              >
                {fiscalYears.map(yr => <option key={yr} value={yr} className="text-slate-900">{yr}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* STRATEGIC FISCAL TILES */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 border-none shadow-premium relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-${stat.color}-500/10 transition-all`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest text-${stat.color}-600/60`}>Live Shard</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3 text-emerald-500" /> {stat.sub}
            </p>
          </div>
        ))}
      </section>

      {/* TABBED INTERFACE */}
      <nav className="premium-tab-bar mb-8">
        {[
          { id: 'ledger', label: 'Payroll Ledger', icon: Receipt },
          { id: 'payslips', label: 'Payslip Portal', icon: FileText },
          { id: 'attendance', label: 'Attendance & Shifts', icon: Clock },
          { id: 'statutory', label: 'Statutory Dues', icon: ShieldCheck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`premium-tab-item flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="space-y-8">
        {activeTab === 'ledger' && (
          <article className="glass-panel p-0 overflow-hidden">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Monthly Disbursement Registry</h3>
                <div className="flex items-center gap-2 mt-1">
                   {months.map((m, i) => (
                      <button 
                        key={m} 
                        onClick={() => setSelectedMonth(i)}
                        className={`text-[9px] font-black px-2 py-1 rounded transition-all ${selectedMonth === i ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
                      >
                        {m.substring(0,3).toUpperCase()}
                      </button>
                   ))}
                </div>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-slate-600">
                <Download size={14} /> Export Register
              </button>
            </header>

            <div className="premium-table-container !mt-0 !border-0 rounded-none">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Workforce Detail</th>
                    <th>Base Shard</th>
                    <th>Adjustments</th>
                    <th>Net Payout</th>
                    <th style={{ textAlign: 'right' }}>Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map((emp, idx) => {
                    const gross = Number(emp.salary || 45000);
                    const deduction = Math.round(gross * 0.08); // Fixed 8% statutory deduction
                    const net = gross - deduction;
                    
                    return (
                      <tr key={emp.id || idx}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                              {emp.name?.[0]}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900">{emp.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase">{emp.designation || emp.role} • {emp.code}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-xs font-black text-slate-900 tabular-nums">₹{gross.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Basic</div>
                        </td>
                        <td>
                          <div className="text-xs font-black text-rose-500 tabular-nums">-₹{deduction.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Statutory/Tax</div>
                        </td>
                        <td>
                          <div className="text-xs font-black text-emerald-600 tabular-nums">₹{net.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Post-Deduction Net</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                            Release Funds
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {activeTab === 'payslips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp, idx) => (
              <div key={idx} className="glass-panel p-8 border hover:border-slate-300 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                    <UserCircle size={32} />
                  </div>
                  <Printer size={20} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{emp.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{emp.designation} • {months[selectedMonth]} {fiscalYear.split('-')[1]}</p>
                
                <div className="space-y-4 pt-6 border-t border-slate-50">
                   <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-slate-400 uppercase">Gross Salary</span>
                      <span className="font-black text-slate-900">₹{(Number(emp.salary) || 0).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-slate-400 uppercase">Net Disbursed</span>
                      <span className="font-black text-emerald-600">₹{(Number(emp.salary) * 0.92).toLocaleString()}</span>
                   </div>
                </div>
                
                <button className="w-full mt-8 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                   Download Document
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attendance' && (
           <div className="glass-panel p-10 text-center flex flex-col items-center gap-6">
              <Clock size={48} className="text-slate-200" />
              <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Attendance Payout Sync</h3>
                 <p className="max-w-md mx-auto text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                   Monthly payroll is automatically synchronized with the 'Daily Attendance' shard. 
                   Variable shift allowances and half-day deductions are calculated based on deployment logs.
                 </p>
              </div>
              <div className="flex gap-4">
                 <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Verify Daily Logs</button>
                 <button className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Overtime Metrics</button>
              </div>
           </div>
        )}

        {activeTab === 'statutory' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-10 bg-indigo-900 text-white border-none relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                 <ShieldCheck size={48} className="text-indigo-400/50 mb-8" />
                 <h4 className="text-lg font-black uppercase tracking-tight mb-4">Gratuity & Retirement Fund</h4>
                 <p className="text-xs text-indigo-100/70 leading-relaxed font-bold uppercase tracking-tighter mb-8">
                   Total institutional liability accumulated for employee long-term benefits and gratuity reserves.
                 </p>
                 <div className="text-3xl font-black tabular-nums">₹1,245,600.00</div>
                 <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-2">Current Liability Shard</div>
              </div>
              
              <div className="glass-panel p-10 border-2 border-slate-50">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Tax & Statutory Compliance</h4>
                 <div className="space-y-6">
                    {[
                      { label: 'PF Contributions', value: '₹45,200', status: 'In-Sync' },
                      { label: 'Professional Tax', value: '₹12,800', status: 'Pending' },
                      { label: 'Insurance Premiums', value: '₹66,500', status: 'In-Sync' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.label}</p>
                            <p className="text-xs font-black text-slate-500 tabular-nums mt-1">{item.value}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'In-Sync' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {item.status}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
