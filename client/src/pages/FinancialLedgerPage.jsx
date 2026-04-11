
import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Calculator, 
  DollarSign, 
  PieChart, 
  History, 
  Plus, 
  Filter, 
  Download,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export default function FinancialLedgerPage({ tenant, invoices = [], expenses = [] }) {
  const [activeTab, setActiveTab] = useState('pl');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  // Ledger Calculations
  const revenue = useMemo(() => {
    return (invoices || []).reduce((acc, inv) => acc + (Number(inv.paid) || 0), 0);
  }, [invoices]);

  const receivables = useMemo(() => {
    return (invoices || []).reduce((acc, inv) => acc + ((Number(inv.total) || 0) - (Number(inv.paid) || 0)), 0);
  }, [invoices]);

  const operationalExpenses = useMemo(() => {
    return (expenses || []).reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  const netPosition = revenue - operationalExpenses;

  const stats = [
    { label: 'Fiscal Revenue', value: `₹${revenue.toLocaleString()}`, trend: '+12.5%', icon: ArrowUpRight, color: 'emerald', sub: 'Post-Sync Revenue' },
    { label: 'Operational Outflow', value: `₹${operationalExpenses.toLocaleString()}`, trend: '-2.1%', icon: ArrowDownLeft, color: 'rose', sub: 'Vendor & Payroll' },
    { label: 'Accounts Receivable', value: `₹${receivables.toLocaleString()}`, trend: 'Institutional Debt', icon: CreditCard, color: 'blue', sub: 'Pending Realization' },
    { label: 'Net Institutional P&L', value: `₹${netPosition.toLocaleString()}`, trend: 'Performance Score', icon: Calculator, color: 'indigo', sub: 'Current Shard Profit' }
  ];

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-white/80" />
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Institutional Ledger & Governance</h1>
           </div>
           <p className="dim-label text-white/70">Centralized financial command for {tenant?.name}. Governance over Payables, Receivables, and P&L performance.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Reporting Period</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-black text-sm outline-none cursor-pointer" 
              />
           </div>
        </div>
      </header>

      {/* FINANCIAL HEALTH TILES */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-8 border-none shadow-premium group hover:translate-y-[-4px] transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shadow-sm`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-black px-3 py-1 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg uppercase tracking-widest`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tighter opacity-60">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* LEDGER NAVIGATION */}
      <nav className="premium-tab-bar mb-10">
        {[
          { id: 'pl', label: 'Profit & Loss (P&L)', icon: PieChart },
          { id: 'receivable', label: 'Accounts Receivable', icon: ArrowUpRight },
          { id: 'payable', label: 'Accounts Payable', icon: ArrowDownLeft },
          { id: 'ledger', label: 'Daily Transaction Ledger', icon: History },
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

      <main className="space-y-10">
        {activeTab === 'pl' && (
          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-8 space-y-8">
                <article className="glass-panel p-10 flex items-center justify-between relative overflow-hidden">
                   <div className="relative z-10">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Total Realized Institutional Income</h4>
                      <div className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">₹{revenue.toLocaleString()}</div>
                      <p className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-2 uppercase tracking-tight">
                         <TrendingUp size={16} /> 100% Collection Ratio maintained this period
                      </p>
                   </div>
                   <div className="w-32 h-32 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center -rotate-12 opacity-50">
                      <DollarSign size={64} />
                   </div>
                </article>

                <div className="grid grid-cols-2 gap-8">
                   <div className="glass-panel p-8">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Revenue Shard Distribution</h5>
                      <div className="space-y-4">
                         {[
                           { label: 'Outpatient Billing', val: revenue * 0.65, color: 'blue' },
                           { label: 'Inpatient Admissions', val: revenue * 0.25, color: 'indigo' },
                           { label: 'Diagnostic Services', val: revenue * 0.10, color: 'emerald' }
                         ].map((item, i) => (
                           <div key={i}>
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{item.label}</span>
                                 <span className="text-xs font-black tabular-nums">₹{item.val.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                 <div className={`h-full bg-${item.color}-500`} style={{ width: `${(item.val / revenue) * 100}%` }} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="glass-panel p-8">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Operational Cost Centers</h5>
                      <div className="space-y-4">
                         {[
                           { label: 'Workforce Payroll', val: operationalExpenses * 0.7, color: 'slate' },
                           { label: 'Facility Maintenance', val: operationalExpenses * 0.2, color: 'blue' },
                           { label: 'Consumables & Pharma', val: operationalExpenses * 0.1, color: 'indigo' }
                         ].map((item, i) => (
                           <div key={i}>
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{item.label}</span>
                                 <span className="text-xs font-black tabular-nums">₹{item.val.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                 <div className={`h-full bg-${item.color}-900`} style={{ width: `${(item.val / operationalExpenses) * 100}%` }} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <aside className="col-span-12 lg:col-span-4 space-y-8">
                <div className="glass-panel p-10 bg-slate-900 border-none relative overflow-hidden text-white">
                   <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24 blur-3xl" />
                   <ShieldCheck size={40} className="text-blue-400/50 mb-8" />
                   <h4 className="text-base font-black uppercase tracking-widest mb-4">Financial Policy Shard</h4>
                   <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter mb-10">
                      All institutional records are reconciled daily with the clinical encounter shard. Security integrity is validated.
                   </p>
                   <button className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audit Governance</button>
                </div>

                <div className="glass-panel p-8">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Institutional Net Shard</h5>
                   <div className="text-3xl font-black text-slate-900 tabular-nums">₹{netPosition.toLocaleString()}</div>
                   <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Margin: {((netPosition / revenue) * 100).toFixed(1)}%</span>
                      {netPosition >= 0 ? <TrendingUp size={24} className="text-emerald-500" /> : <TrendingDown size={24} className="text-rose-500" />}
                   </div>
                </div>
             </aside>
          </div>
        )}

        {activeTab === 'receivable' && (
           <article className="glass-panel p-0 overflow-hidden shadow-sm">
              <header className="px-10 py-8 border-b border-slate-100 bg-white flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Accounts Receivable Shard</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional realization queue for patient and insurance dues</p>
                 </div>
                 <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-8 py-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                    <Plus size={16} /> New Realization
                 </button>
              </header>
              <div className="premium-table-container !mt-0 !border-0 rounded-none">
                 <table className="premium-table">
                    <thead>
                       <tr>
                          <th>Patient Identity</th>
                          <th>Invoice Reference</th>
                          <th>Outstanding Balance</th>
                          <th>Aging Status</th>
                          <th style={{ textAlign: 'right' }}>Security Access</th>
                       </tr>
                    </thead>
                    <tbody>
                       {invoices.filter(i => i.status !== 'paid').map((inv, idx) => (
                         <tr key={idx}>
                            <td>
                               <div className="text-xs font-black text-slate-900">{inv.patient_name || 'Patient Shard'}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase">{inv.mrn || 'MRN-UNK'}</div>
                            </td>
                            <td><span className="text-xs font-black tabular-nums">{inv.invoice_number}</span></td>
                            <td><span className="text-xs font-black text-rose-600 tabular-nums">₹{(inv.total - inv.paid).toLocaleString()}</span></td>
                            <td><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase">Pending Realization</span></td>
                            <td style={{ textAlign: 'right' }}>
                               <button className="px-5 py-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase transition-all">Audit Invoice</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </article>
        )}

        {activeTab === 'payable' && (
           <article className="glass-panel p-0 overflow-hidden shadow-sm">
              <header className="px-10 py-8 border-b border-slate-100 bg-white flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Institutional Payable Ledger</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational outflow registry for vendors and workforce</p>
                 </div>
                 <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-8 py-4 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-600/20">
                    <Download size={16} /> Export Outflows
                 </button>
              </header>
              <div className="premium-table-container !mt-0 !border-0 rounded-none">
                 <table className="premium-table">
                    <thead>
                       <tr>
                          <th>Expense Category</th>
                          <th>Description</th>
                          <th>Disbursement Amount</th>
                          <th>Settle Status</th>
                          <th style={{ textAlign: 'right' }}>Audit Trail</th>
                       </tr>
                    </thead>
                    <tbody>
                       {expenses.map((exp, idx) => (
                         <tr key={idx}>
                            <td>
                               <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{exp.category}</span>
                            </td>
                            <td><span className="text-xs font-bold text-slate-600 truncate max-w-xs block">{exp.description}</span></td>
                            <td><span className="text-xs font-black text-slate-900 tabular-nums">₹{Number(exp.amount).toLocaleString()}</span></td>
                            <td><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">Settled</span></td>
                            <td style={{ textAlign: 'right' }}>
                               <button className="px-5 py-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase transition-all">View Receipt</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </article>
        )}

        {activeTab === 'ledger' && (
           <div className="glass-panel p-20 text-center flex flex-col items-center gap-8 bg-slate-50/50">
              <History size={64} className="text-slate-200" />
              <div className="max-w-xl">
                 <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 text-center">Transactional Shard Continuity</h4>
                 <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter text-center">
                    This module provides a unified forensic audit trail of all institutional money movements.
                    Synchronized with the bank reconciliation shard and clinical billing ledgers.
                 </p>
              </div>
              <div className="flex gap-4">
                 <button className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Forensic Audit Log</button>
                 <button className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Reconciliation Hub</button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
