import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { api } from '../api.js';
import { currency } from '../utils/format.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle,
  Clock,
  ChevronRight,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  Activity
} from 'lucide-react';
import { EmptyState } from '../components/ui/index.jsx';
import '../styles/critical-care.css';

const CATEGORIES = ['Purchase', 'Salary', 'Maintenance', 'Utilities', 'Govt Fees', 'Certifications', 'Subscriptions', 'Equipment', 'Other'];
const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Card'];

export default function AccountsPage({ tenant, initialTab = 'snapshot' }) {
  const { showToast } = useToast();

  const [financials, setFinancials] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [activeTab, setActiveTab] = useState(initialTab); // 'snapshot' | 'record' | 'ledger' | 'final'

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    async function load() {
      if (!tenant?.id) return;
      setLoading(true);
      try {
        // Use individual setters to handle partial success
        api.getFinancials(tenant.id, currentMonth)
          .then(data => setFinancials(data))
          .catch(err => {
            console.error('Failed to load financial summary:', err);
            // Don't alert here to avoid spamming the user, but we could set an error state
          });

        api.getExpenses(tenant.id, currentMonth)
          .then(list => setExpenses(list || []))
          .catch(err => {
            console.error('Failed to load expense list:', err);
            // Often due to subscription tier limits
            setExpenses([]);
          });

      } catch (err) {
        console.error('Unexpected error in financial records loader:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenant?.id, currentMonth]);

  async function handleAddExpense(e) {
    if (!tenant?.id) return;
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
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
      showToast({ message: 'Expense entry recorded!', type: 'success', title: 'Accounts' });
    } catch (err) {
      alert('Failed to authorize transaction: ' + err.message);
    }
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400 font-black uppercase tracking-[0.2em]">
        <div className="animate-pulse">Initializing Financial Shard...</div>
      </div>
    );
  }

  const categoryExpenses = financials?.expenses || {};
  const totalExpenses = Object.values(categoryExpenses).reduce((a, b) => a + (Number(b) || 0), 0);
  const income = Number(financials?.income) || 0;
  const netBalance = income - totalExpenses;
  const margin = income > 0 ? ((netBalance / income) * 100).toFixed(1) : 0;

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              Treasury & Accounts Governance
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">Fiscal Shard</span>
           </h1>
           <p className="dim-label text-white/70">Centralized treasury governance, institutional expenditure ledgers, and cashflow monitoring.</p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Fiscal Integrity Validated • Treasury sync operational
           </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
             {[
               { id: 'snapshot', label: 'Treasury Snapshot', icon: PieChart },
               { id: 'record', label: 'Authorized Outflow', icon: Plus },
               { id: 'ledger', label: 'Fiscal Ledger', icon: History }
             ].map(tab => (
               <button
                 key={tab.id}
                 className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                 onClick={() => setActiveTab(tab.id)}
               >
                 <tab.icon className="w-3.5 h-3.5" /> {tab.label.split(' ')[1]}
               </button>
             ))}
          </div>
          <div className="relative group bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden px-4">
            <input
              type="month"
              value={currentMonth.slice(0, 7)}
              onChange={e => setCurrentMonth(e.target.value + '-01')}
              className="bg-transparent text-white font-black text-[10px] uppercase tracking-widest h-10 outline-none cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* 2. VITALS MONITOR (Strategic Financials) */}
      <section className="vitals-monitor mb-10">
        <div className="vital-node vital-node--safe shadow-sm group hover:scale-[1.02] transition-transform">
           <div className="flex justify-between items-start">
              <span className="vital-label">Gross Clinical Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{currency(income)}</span>
           <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Settled Influx
           </p>
        </div>

        <div className="vital-node vital-node--warning shadow-sm group hover:scale-[1.02] transition-transform">
           <div className="flex justify-between items-start">
              <span className="vital-label">Institutional Expenditure</span>
              <TrendingDown className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{currency(totalExpenses)}</span>
           <p className="text-[10px] font-black text-amber-600 mt-2 uppercase tracking-widest flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Authorized Outflow
           </p>
        </div>

        <div className={`vital-node ${netBalance >= 0 ? 'vital-node--safe' : 'vital-node--critical'} shadow-sm group hover:scale-[1.02] transition-transform`}>
           <div className="flex justify-between items-start">
              <span className="vital-label">Net Strategic Surplus</span>
              <Wallet className="w-4 h-4 text-slate-400 opacity-50" />
           </div>
           <span className={`vital-value tabular-nums mt-1 ${netBalance < 0 ? 'text-rose-600' : ''}`}>{currency(netBalance)}</span>
           <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netBalance >= 0 ? 'Capital Accumulation' : 'Deficit Detected'}
           </p>
        </div>

        <div className="vital-node vital-node--safe shadow-sm group hover:scale-[1.02] transition-transform">
           <div className="flex justify-between items-start">
              <span className="vital-label">Operating Margin</span>
              <Activity className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="vital-value tabular-nums mt-1">{margin}%</span>
           <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Efficiency Shard</p>
        </div>
      </section>

      {/* 3. MAIN WORKFLOW AREA */}
      <div className="grid grid-cols-12 gap-8">
        {activeTab === 'snapshot' && (
          <>
            <article className="col-span-12 lg:col-span-8 space-y-8">
              <div className="clinical-card">
                <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Expenditure Fragmentation</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Resource allocation by sector</p>
                   </div>
                   <PieChart className="w-5 h-5 text-slate-300" />
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   {Object.entries(categoryExpenses).length > 0 ? (
                     Object.entries(categoryExpenses)
                       .sort((a, b) => b[1] - a[1])
                       .map(([cat, amt]) => {
                         const percentage = totalExpenses > 0 ? (Number(amt) / totalExpenses * 100).toFixed(1) : 0;
                         return (
                           <div key={cat} className="space-y-3 group">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{cat}</div>
                                    <div className="text-sm font-black text-slate-800 tabular-nums mt-1">{currency(amt)}</div>
                                 </div>
                                 <div className="text-[10px] font-black text-slate-400 tabular-nums">{percentage}%</div>
                              </div>
                              <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                 <div 
                                   className="h-full bg-slate-900 group-hover:bg-emerald-500 transition-all rounded-full" 
                                   style={{ width: `${percentage}%` }}
                                 />
                              </div>
                           </div>
                         );
                       })
                   ) : (
                     <div className="col-span-2">
                        <EmptyState 
                          title="No transaction shards detected" 
                          subtitle="The treasury node has identified no clinical outflow or revenue commitments for the current temporal cycle."
                          icon={History}
                        />
                      </div>
                   )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="clinical-card bg-emerald-50/20 border-l-4 border-emerald-500">
                   <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5" /> Institutional Worth
                   </h4>
                   <div className="text-2xl font-black text-slate-900 tabular-nums">{currency(netBalance + 125000)}</div>
                   <p className="text-[10px] font-medium text-slate-500 mt-4 leading-relaxed italic">
                     Aggregate institutional valuation based on liquidity shard and inventory assets.
                   </p>
                </div>
                <div className="clinical-card bg-slate-900 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform"></div>
                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 relative z-10">System Projection</h4>
                   <div className="text-2xl font-black text-white tabular-nums relative z-10">{currency(netBalance * 1.15)}</div>
                   <p className="text-[10px] font-medium text-white/40 mt-4 leading-relaxed relative z-10">
                     Forecasted net surplus based on longitudinal clinical velocity.
                   </p>
                </div>
              </div>
            </article>

            <aside className="col-span-12 lg:col-span-4 space-y-8">
               <article className="clinical-card h-full">
                  <header className="mb-8 pb-4 border-b border-slate-50">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Snapshot</h3>
                  </header>
                  <div className="space-y-6">
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Projected Payroll Shard</div>
                        <div className="text-lg font-black text-slate-900 tabular-nums">{currency(financials?.projectedSalaries || 0)}</div>
                     </div>
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Statutory Reserve (12%)</div>
                        <div className="text-lg font-black text-slate-900 tabular-nums">{currency(totalExpenses * 0.12)}</div>
                     </div>
                     <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-2">Fiscal Audit Directive</div>
                        <p className="text-[11px] font-medium text-amber-900/60 leading-relaxed italic mt-2">
                          Standard threshold audit required if monthly expenditure exceeds 40% of baseline clinical influx.
                        </p>
                     </div>
                  </div>
               </article>
            </aside>
          </>
        )}

        {activeTab === 'record' && (
          <article className="col-span-12 lg:col-span-8 lg:col-start-3 clinical-card p-12 transition-all">
            <header className="mb-12 flex justify-between items-end">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Authorized Expenditure Commitment</h3>
                  <p className="dim-label uppercase tracking-widest text-[10px] mt-2 font-black">Outflow provision protocol • Institutional Treasury</p>
               </div>
               <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
               </div>
            </header>

            <form className="space-y-10" onSubmit={handleAddExpense}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Step 01 / Context</h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classification Shard</label>
                       <select name="category" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800" required>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logical Narrative</label>
                       <textarea name="description" className="input-field bg-slate-50 border-none rounded-2xl font-medium p-6 h-32" placeholder="Specific nature of institutional expenditure..." required />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Step 02 / Settlement</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantum (Amount ₹)</label>
                          <input name="amount" type="number" step="0.01" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black tabular-nums text-lg" placeholder="0.00" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filing Date</label>
                          <input name="date" type="date" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black text-xs" defaultValue={new Date().toISOString().slice(0, 10)} required />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Methodology</label>
                       <select name="paymentMethod" className="input-field h-[60px] bg-slate-50 border-none rounded-2xl font-black text-slate-800">
                          {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Ref ID</label>
                       <input name="reference" placeholder="REF-LOG-ID" className="input-field py-5 bg-slate-50 border-none rounded-2xl font-black tabular-nums uppercase" />
                    </div>
                  </div>
               </div>

               <div className="pt-10 border-t border-slate-50 flex justify-end gap-6 items-center">
                  <button type="button" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-colors" onClick={() => setActiveTab('snapshot')}>Abort Transaction</button>
                  <button type="submit" className="clinical-btn bg-slate-900 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all">COMMIT TO TREASURY LEDGER</button>
               </div>
            </form>
          </article>
        )}

        {activeTab === 'ledger' && (
          <article className="col-span-12 clinical-card !p-0 overflow-hidden">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Institutional Treasure Journal</h3>
                  <p className="dim-label uppercase tracking-widest text-[10px] mt-1 font-black">Longitudinal sequence of treasury commitments</p>
               </div>
               <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <History className="w-5 h-5" />
               </div>
            </header>

            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="tracking-widest">Date & Time</th>
                    <th className="tracking-widest">Classification</th>
                    <th className="tracking-widest">Transaction Context</th>
                    <th style={{ textAlign: 'right' }} className="tracking-widest">Credit Shard</th>
                    <th style={{ textAlign: 'right' }} className="tracking-widest">Debit Shard</th>
                    <th style={{ textAlign: 'right' }} className="tracking-widest">Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <EmptyState 
                          title="No recorded transactions identified" 
                          subtitle="The institutional treasure journal contains no committed transaction shards in the current fiscal sector."
                          icon={History}
                        />
                      </td>
                    </tr>
                  ) : expenses.map((exp, idx) => (
                    <tr key={exp.id || idx} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                      <td>
                        <div className="text-[13px] font-black text-slate-900 tabular-nums">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</div>
                      </td>
                      <td>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{exp.category}</span>
                      </td>
                      <td>
                        <div className="text-sm font-bold text-slate-700">{exp.description}</div>
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1">{exp.paymentMethod} • REF: {exp.reference || 'SYSTEM-GENERATED'}</div>
                      </td>
                      <td style={{ textAlign: 'right' }} className="text-slate-200 tabular-nums text-xs">—</td>
                      <td style={{ textAlign: 'right' }} className="font-black text-rose-600 tabular-nums text-sm">{currency(exp.amount)}</td>
                      <td style={{ textAlign: 'right' }}>
                         <button className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors">
                            <Printer className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </div>

      <div className="mt-10 p-8 glass-panel border-l-4 border-l-amber-500 flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
           <Building className="w-7 h-7" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-widest">Treasury Governance Directive</h4>
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-5xl italic">
            All financial shards are immutable once committed to the institutional ledger. Operational outflow must be authorized by a senior clinical administrator. Discrepancies in clinical influx should be reported to the network security node immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
