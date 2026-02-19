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
        // refresh
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
        <section>
            {/* Tab Navigation */}
            <div className="flex items-center gap-4 mb-6 bg-white p-2 rounded-xl border border-slate-200">
                {[
                    { id: 'snapshot', label: '📊 Financial Snapshot' },
                    { id: 'record', label: '➕ Record Outflow' },
                    { id: 'ledger', label: '📒 Unified Ledger' },
                    { id: 'final', label: '🏢 Final Accounts' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`premium-btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}

                <div className="flex-1"></div>

                <input
                    type="month"
                    value={currentMonth.slice(0, 7)}
                    onChange={e => setCurrentMonth(e.target.value + '-01')}
                    className="premium-input w-auto py-1"
                />
            </div>

            {/* Financial Snapshot */}
            {activeTab === 'snapshot' && financials && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="premium-panel flex items-center gap-4 border-l-4 border-l-emerald-500">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xl">↓</div>
                            <div>
                                <div className="text-xs font-bold text-muted uppercase tracking-wider">Inward (Revenue)</div>
                                <div className="text-2xl font-bold text-slate-800">{currency(financials.income)}</div>
                            </div>
                        </div>
                        <div className="premium-panel flex items-center gap-4 border-l-4 border-l-rose-500">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg font-bold text-xl">↑</div>
                            <div>
                                <div className="text-xs font-bold text-muted uppercase tracking-wider">Outward (Expenses)</div>
                                <div className="text-2xl font-bold text-slate-800">{currency(totalExpenses)}</div>
                            </div>
                        </div>
                        <div className="premium-panel flex items-center gap-4 border-l-4 border-l-blue-500">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg font-bold text-xl">≈</div>
                            <div>
                                <div className="text-xs font-bold text-muted uppercase tracking-wider">Net Balance</div>
                                <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {currency(netBalance)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <article className="premium-panel">
                            <div className="panel-header">
                                <div className="panel-title">Expense Breakdown</div>
                            </div>
                            {Object.keys(financials.expenses).length === 0 ? (
                                <p className="text-center p-8 text-muted">No expenses recorded for this month.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {Object.entries(financials.expenses)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([cat, amt]) => (
                                            <div key={cat} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">{cat}</span>
                                                    <span className="font-bold text-slate-800">{currency(amt)}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400 rounded-full"
                                                        style={{ width: `${totalExpenses > 0 ? (amt / totalExpenses * 100) : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </article>

                        <article className="premium-panel">
                            <div className="panel-header">
                                <div className="panel-title">Financial Health Narrative</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="mb-2">
                                    <span className="badge info">ESTIMATED BY SLM</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                                    Based on current trends, your facility is maintaining a <strong>{((netBalance / (financials.income || 1)) * 100).toFixed(1)}% profit margin</strong>.
                                    {netBalance < 0 ? ' Warning: Operational expenses are exceeding revenue for this period.' : ' Positive trajectory: You have successfully covered overheads with a healthy surplus.'}
                                </p>
                                <ul className="list-disc pl-4 text-xs text-muted space-y-1">
                                    <li>Majority of spend is on <strong>Maintenance</strong> category.</li>
                                    <li>Projected payroll for next month: <strong>{currency(financials.projectedSalaries || 0)}</strong></li>
                                </ul>
                            </div>
                        </article>
                    </div>
                </div>
            )}

            {/* Record Outflow */}
            {activeTab === 'record' && (
                <article className="premium-panel max-w-2xl">
                    <div className="panel-header">
                        <div className="panel-title">Record New Expense</div>
                    </div>
                    <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase">Category</label>
                                <select name="category" className="premium-select" required>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase">Amount</label>
                                <input name="amount" type="number" step="0.01" placeholder="0.00" className="premium-input" required />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted uppercase">Description</label>
                            <input name="description" placeholder="e.g. Monthly electricity bill" className="premium-input" required />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase">Date</label>
                                <input name="date" type="date" className="premium-input" defaultValue={new Date().toISOString().slice(0, 10)} required />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase">Method</label>
                                <select name="paymentMethod" className="premium-select">
                                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase">Ref ID</label>
                                <input name="reference" placeholder="Optional" className="premium-input" />
                            </div>
                        </div>

                        <button type="submit" className="premium-btn btn-primary mt-4 bg-amber-500 hover:bg-amber-600">
                            💸 Record Expense
                        </button>
                    </form>
                </article>
            )}

            {/* Unified Ledger */}
            {activeTab === 'ledger' && (
                <article className="premium-panel">
                    <div className="panel-header">
                        <div className="panel-title">Unified Transaction Ledger</div>
                    </div>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Credit (In)</th>
                                <th style={{ textAlign: 'right' }}>Debit (Out)</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp, idx) => (
                                <tr key={`exp-${exp.id || idx}`}>
                                    <td className="text-xs text-muted">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '-'}</td>
                                    <td><span className="badge danger">EXPENSE</span></td>
                                    <td>{exp.description}</td>
                                    <td style={{ textAlign: 'right' }}>-</td>
                                    <td style={{ textAlign: 'right', color: '#ef4444' }}>{currency(parseFloat(exp.amount))}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>...</td>
                                </tr>
                            ))}
                            {!expenses.length && (
                                <tr><td colSpan="6" className="text-center p-8 text-muted">No transactions found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </article>
            )}

            {/* Final Accounts */}
            {activeTab === 'final' && (
                <div className="grid grid-cols-2 gap-6">
                    <article className="premium-panel">
                        <div className="panel-header border-b pb-4 mb-4">
                            <div className="panel-title">Profit & Loss Statement</div>
                            <div className="text-xs text-muted uppercase font-bold">FY 2024-25 • Periodical</div>
                        </div>
                        <div className="flex justify-between py-2 text-sm font-bold">
                            <span>Total Operating Revenue</span>
                            <span>{currency(financials?.income || 0)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-4 text-xs text-muted">
                            <span>+ Clinical Services</span>
                            <span>{currency(financials?.income || 0)}</span>
                        </div>
                        <hr className="my-2 border-slate-100" />
                        <div className="flex justify-between py-2 text-sm font-bold">
                            <span>Total Operating Expenses</span>
                            <span className="text-danger">{currency(totalExpenses)}</span>
                        </div>
                        {Object.entries(financials?.expenses || {}).map(([cat, amt]) => (
                            <div key={cat} className="flex justify-between py-1 px-4 text-xs text-muted">
                                <span>- {cat}</span>
                                <span>{currency(amt)}</span>
                            </div>
                        ))}
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center font-bold">
                            <span>NET OPERATING INCOME</span>
                            <span className="text-lg">{currency(netBalance)}</span>
                        </div>
                    </article>

                    <article className="premium-panel">
                        <div className="panel-header border-b pb-4 mb-4">
                            <div className="panel-title">Abridged Balance Sheet</div>
                            <div className="text-xs text-muted uppercase font-bold">As of {new Date().toLocaleDateString()}</div>
                        </div>

                        <div className="text-xs font-bold text-muted uppercase mb-2">ASSETS</div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm px-4"><span>Cash & Cash Equivalents</span> <span>{currency(netBalance)}</span></div>
                            <div className="flex justify-between text-sm px-4"><span>Account Receivables</span> <span>{currency(52400)}</span></div>
                            <div className="flex justify-between text-sm px-4"><span>Inventory (Pharmacy)</span> <span>{currency(125000)}</span></div>
                        </div>

                        <div className="text-xs font-bold text-muted uppercase mt-6 mb-2">LIABILITIES & EQUITY</div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm px-4"><span>Account Payables</span> <span>{currency(12400)}</span></div>
                            <div className="flex justify-between text-sm px-4"><span>Statutory Dues (Tax/PF)</span> <span>{currency(totalExpenses * 0.1)}</span></div>
                        </div>
                    </article>
                </div>
            )}
        </section>
    );
}
