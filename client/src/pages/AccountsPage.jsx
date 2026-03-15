import { useState, useEffect } from 'react';
import api from '../api.js';
import { currency } from '../utils/format.js';

const CATEGORIES = ['Purchase', 'Salary', 'Maintenance', 'Utilities', 'Govt Fees', 'Certifications', 'Subscriptions', 'Equipment', 'Other'];
const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Card'];

export default function AccountsPage({ tenant }) {
    const [financials, setFinancials] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7) + '-01');
    const [activeTab, setActiveTab] = useState('snapshot'); // 'snapshot' | 'record' | 'ledger' | 'final'

    useEffect(() => {
        async function load() {
            if (!tenant) return;
            const [data, expenseList] = await Promise.all([
                api.getFinancials(tenant.id, currentMonth),
                api.getExpenses(tenant.id, currentMonth)
            ]);
            setFinancials(data);
            setExpenses(expenseList || []);
        }
        load();
    }, [tenant, currentMonth]);

    async function handleAddExpense(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        await api.addExpense({
            tenantId: tenant.id,
            category: fd.get('category'),
            description: fd.get('description'),
            amount: Number(fd.get('amount')),
            date: fd.get('date'),
            paymentMethod: fd.get('paymentMethod'),
            reference: fd.get('reference')
        });
        const [data, expenseList] = await Promise.all([
            api.getFinancials(tenant.id, currentMonth),
            api.getExpenses(tenant.id, currentMonth)
        ]);
        setFinancials(data);
        setExpenses(expenseList || []);
        e.target.reset();
        setActiveTab('ledger');
    }

    const totalExpenses = financials ? Object.values(financials.expenses).reduce((a, b) => a + b, 0) : 0;
    const netBalance = financials ? financials.income - totalExpenses : 0;

    return (
    <div className="page-shell-premium animate-fade-in">
      <div className="page-header-premium mb-6">
        <div>
          <h1>Financial Logistics</h1>
          <p>Accounts Payable & Institutional Treasury Oversight</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="premium-tab-bar">
            {[
              { id: 'snapshot', label: 'Snapshot' },
              { id: 'record', label: 'Outflow' },
              { id: 'ledger', label: 'Ledger' },
              { id: 'final', label: 'Final' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`premium-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="month"
            value={currentMonth.slice(0, 7)}
            onChange={e => setCurrentMonth(e.target.value + '-01')}
            className="input-field py-2 px-4 bg-white/50 w-40 font-bold"
          />
        </div>
      </div>

            {/* 2. FINANCIAL STATISTICS RIBBON (HIGH DENSITY) */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="clinical-stat-item border-emerald-500">
                    <div className="clinical-stat-icon bg-emerald-50 text-emerald-600">IN</div>
                    <div>
                        <div className="metric-label">Revenue</div>
                        <div className="text-xl font-black text-slate-800 font-display">{currency(financials?.income || 0)}</div>
                    </div>
                </div>
                <div className="clinical-stat-item border-amber-600">
                    <div className="clinical-stat-icon bg-amber-50 text-amber-600">OUT</div>
                    <div>
                        <div className="metric-label">Expenses</div>
                        <div className="text-xl font-black text-slate-800 font-display">{currency(totalExpenses)}</div>
                    </div>
                </div>
                <div className="clinical-stat-item border-teal-500">
                    <div className="clinical-stat-icon bg-teal-50 text-teal-600">NET</div>
                    <div>
                        <div className="metric-label">Surplus</div>
                        <div className={`text-xl font-black font-display ${netBalance >= 0 ? 'text-teal-600' : 'text-amber-600'}`}>{currency(netBalance)}</div>
                    </div>
                </div>
                <div className="clinical-stat-item border-amber-500">
                    <div className="clinical-stat-icon bg-amber-50 text-amber-600">MAR</div>
                    <div>
                        <div className="metric-label">Margin</div>
                        <div className="text-xl font-black text-slate-800 font-display">{financials?.income ? ((netBalance / financials.income) * 100).toFixed(1) : 0}%</div>
                    </div>
                </div>
            </div>

            {/* 3. CORE ANALYTICS OR DATA INPUT */}
            {activeTab === 'snapshot' && financials && (
                <div className="grid grid-cols-2 gap-8">
                    <article className="card p-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex-between">
                            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Expense Decomposition</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            {Object.entries(financials.expenses).length === 0 ? (
                                <p className="text-center p-8 text-slate-400 italic text-sm">Awaiting clinical expenditure metrics...</p>
                            ) : (
                                Object.entries(financials.expenses)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cat, amt]) => (
                                        <div key={cat} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                                <span className="text-slate-500">{cat}</span>
                                                <span className="text-slate-800">{currency(amt)}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-teal-500 rounded-full"
                                                    style={{ width: `\${totalExpenses > 0 ? (amt / totalExpenses * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </article>

                    <article className="card border-teal-100 bg-teal-50/10">
                        <div className="panel-header mb-4">
                            <h3 className="text-sm font-black uppercase text-teal-600 tracking-widest">Financial Foresight</h3>
                        </div>
                        <div className="prose prose-sm text-slate-600 leading-relaxed">
                            <p className="mb-4 text-sm font-medium">
                                Cross-period analysis indicates a <strong>{((netBalance / (financials.income || 1)) * 100).toFixed(1)}% institutional surplus</strong>. 
                                {netBalance < 0 
                                    ? ' Critical: High operational drag detected. Immediate overhead reconciliation recommended.' 
                                    : ' Strategic health is optimal. Treasury status allows for facility expansion or asset acquisition.'}
                            </p>
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <div className="p-3 bg-white rounded-xl border border-teal-100">
                                    <div className="text-xs font-black text-slate-400 uppercase">Projected Payroll</div>
                                    <div className="text-sm font-black text-teal-600">{currency(financials.projectedSalaries || 0)}</div>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-teal-100">
                                    <div className="text-xs font-black text-slate-400 uppercase">SLA Liability</div>
                                    <div className="text-sm font-black text-emerald-600">{currency(totalExpenses * 0.12)}</div>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            )}

            {activeTab === 'record' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <article className="glass-panel col-span-2 p-8">
                        <div className="mb-8">
                          <h3 className="text-lg font-bold text-slate-900">Record Institutional Outflow</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Authorize clinical expenditure & resource acquisition</p>
                        </div>
                        <form onSubmit={handleAddExpense} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</label>
                                    <select name="category" className="input-field h-[54px] bg-white font-bold text-slate-800" required>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantum (Amount ₹)</label>
                                    <input name="amount" type="number" step="0.01" className="input-field py-4 bg-white font-mono" placeholder="0.00" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logical Description</label>
                                <input name="description" className="input-field py-4 bg-white" placeholder="Specific nature of expenditure..." required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filing Date</label>
                                    <input name="date" type="date" className="input-field py-4 bg-white" defaultValue={new Date().toISOString().slice(0, 10)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Methodology</label>
                                    <select name="paymentMethod" className="input-field h-[54px] bg-white font-bold text-slate-800">
                                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Ref</label>
                                    <input name="reference" placeholder="REF-ID" className="input-field py-4 bg-white" />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full py-5 text-[10px] uppercase tracking-[0.2em] shadow-xl mt-4">
                                Commit to Treasury Ledger
                            </button>
                        </form>
                    </article>
                    <aside className="glass-panel bg-slate-50/50 border-dashed border-2 flex flex-col items-center justify-center text-center p-8 border-slate-200">
                      {/* ... existing upload ui ... */}
                        <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 mb-4 flex items-center justify-center text-slate-400 shadow-sm">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-2">Digital Reciept Upload</h4>
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed">Attach fiscal proof to normalize this transaction in global institutional ledger.</p>
                    </aside>
                </div>
            )}

            {activeTab === 'ledger' && (
                <article className="card p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex-between">
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Unified Transaction Ledger</h3>
                        <button className="text-xs font-black text-teal-600 uppercase tracking-widest border border-teal-200 px-3 py-1 rounded-full hover:bg-teal-50">Export Report</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="clinical-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Classification</th>
                                    <th>Context</th>
                                    <th style={{ textAlign: 'right' }}>Credit (In)</th>
                                    <th style={{ textAlign: 'right' }}>Debit (Out)</th>
                                    <th style={{ textAlign: 'right' }}>Shadow Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp, idx) => (
                                    <tr key={exp.id || idx}>
                                        <td className="text-xs font-bold text-slate-500">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '-'}</td>
                                        <td><span className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-tighter bg-rose-50 text-rose-600 border border-rose-100">{exp.category}</span></td>
                                        <td className="text-sm font-medium text-slate-700">{exp.description}</td>
                                        <td className="text-right text-slate-300 font-bold">—</td>
                                        <td className="text-right text-rose-600 font-bold">{currency(parseFloat(exp.amount))}</td>
                                        <td className="text-right text-slate-800 font-black">...</td>
                                    </tr>
                                ))}
                                {!expenses.length && (
                                    <tr><td colSpan="6" className="text-center py-20 text-slate-400 italic text-sm">No ledger entries detected in this clinical shard.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>
            )}

            {activeTab === 'final' && (
                <div className="grid grid-cols-2 gap-8">
                    <article className="card">
                        <div className="panel-header border-b border-slate-100 pb-4 mb-6 flex-between">
                            <h3 className="text-sm font-black uppercase text-slate-400">Profit & Loss Statement</h3>
                            <span className="text-xs font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded uppercase">FY24-25 Q4</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 text-sm font-black text-slate-800 border-b border-slate-50">
                                <span>Gross Operating Revenue</span>
                                <span className="text-teal-600">{currency(financials?.income || 0)}</span>
                            </div>
                            <div className="space-y-2 pl-4">
                                <div className="flex justify-between text-xs text-slate-400 font-bold">
                                    <span> Clinical Services</span>
                                    <span>{currency(financials?.income || 0)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-black text-slate-800 border-b border-slate-50 mt-6">
                                <span>Gross Operating Expenses</span>
                                <span className="text-rose-600">{currency(totalExpenses)}</span>
                            </div>
                            <div className="space-y-1.5 pl-4 max-h-[120px] overflow-y-auto">
                                {Object.entries(financials?.expenses || {}).map(([cat, amt]) => (
                                    <div key={cat} className="flex justify-between text-xs text-slate-400 font-bold">
                                        <span> {cat}</span>
                                        <span>{currency(amt)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-5 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                                <div>
                                    <div className="text-xs font-black uppercase text-teal-400">Net Operating Surplus</div>
                                    <div className="text-xl font-bold font-display">{currency(netBalance)}</div>
                                </div>
                                <div className="text-xs font-black text-teal-400">OPTIMAL</div>
                            </div>
                        </div>
                    </article>

                    <article className="card">
                        <div className="panel-header border-b border-slate-100 pb-4 mb-6 flex-between">
                            <h3 className="text-sm font-black uppercase text-slate-400">Institutional Balance Sheet</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ASSETS & LIQUIDITY</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-600 px-3"><span>Cash & Equivalents</span> <span className="text-slate-900">{currency(netBalance)}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 px-3"><span>Patient Receivables</span> <span className="text-slate-900">{currency(52400)}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 px-3 border-b border-slate-50 pb-2"><span>Pharmacy Inventory</span> <span className="text-slate-900">{currency(125000)}</span></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">LIABILITIES & EQUITY</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-600 px-3"><span>Vendor Payables</span> <span className="text-slate-900">{currency(12400)}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 px-3 border-b border-slate-50 pb-2"><span>Statutory Dues (Tax/PF)</span> <span className="text-slate-900">{currency(totalExpenses * 0.1)}</span></div>
                                </div>
                            </div>
                            <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-center">
                                <div className="text-xs font-black text-teal-600 uppercase">Institutional Worth</div>
                                <div className="text-lg font-black text-slate-800">{currency(netBalance + 52400 + 125000 - 12400)}</div>
                            </div>
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}
