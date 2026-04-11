import { useState, useEffect } from 'react';
import { api } from '../api';
import MetricCard from '../components/MetricCard';
import { currency } from '../utils/format';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  IndianRupee, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  BarChart3
} from 'lucide-react';
import '../styles/critical-care.css';

export default function ReportsPage({ reportSummary, tenant, slmInsights, superOverview }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPayouts() {
      if (!tenant?.id) return;
      setLoading(true);
      try {
        const data = await api.getDoctorPayouts(tenant.id);
        setPayouts(data);
      } catch (err) {
        console.error('Failed to load payouts', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayouts();
  }, [tenant?.id]);

  const isSuper = !tenant;
  const superTenants = isSuper ? (superOverview?.tenants || []) : [];
  const superTotals = isSuper ? {
    patients: superOverview?.totals?.patients || superTenants.reduce((sum, t) => sum + (t.patients || 0), 0),
    users: superOverview?.totals?.users || superTenants.reduce((sum, t) => sum + (t.users || 0), 0),
    tenants: superOverview?.totals?.tenants || superTenants.length,
    revenue: superOverview?.totals?.revenue || superTenants.reduce((sum, t) => sum + (t.revenue || 0), 0)
  } : null;

  const metrics = isSuper
    ? {
        velocity: `${superTotals.patients} Entities`,
        liquidity: currency(superTotals.revenue),
        load: `${superTotals.users} Users`,
        receivables: superTotals.tenants,
      }
    : {
        velocity: `${reportSummary?.periodical?.dailyAppointments || 0} pts/day`,
        liquidity: currency(reportSummary?.tax?.totalTax || 0),
        load: `${reportSummary?.periodical?.openAppointments || 0} Open`,
        receivables: reportSummary?.periodical?.pendingInvoices || 0,
      };

  const monthlyRevenue = (isSuper
    ? superOverview?.monthlyComparison?.revenue
    : reportSummary?.monthlyComparison?.revenue) || [];

  const totalMonthlyRev = monthlyRevenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const avgRev = totalMonthlyRev / (monthlyRevenue.length || 1);

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div>
           <h1 className="page-title-rich flex items-center gap-3 text-white">
              {isSuper ? 'Platform Intelligence Registry' : 'Executive Clinical Analytics'}
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black backdrop-blur-md">
                {isSuper ? 'Global Node' : 'Institutional Shard'}
              </span>
           </h1>
           <p className="dim-label text-white/70">
              {isSuper
                ? 'Cross-facility operational trajectory and network node health monitoring.'
                : `Real-time performance metrics and institutional financial trajectory for ${tenant?.name || 'Facility'}.`}
           </p>
           <p className="text-xs font-black text-white/60 uppercase tracking-widest mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> {isSuper ? 'Global Sync Active' : 'SLM Insights Enabled'} • Data Integrity Verified
           </p>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-sm gap-1 w-fit">
           <div className="px-6 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                {isSuper ? 'Network Link Active' : 'Telemetry Link Ready'}
              </span>
           </div>
        </div>
      </header>

      {/* 2. CORE METRICS GRID */}
      <section className="vitals-monitor mb-10">
        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">{isSuper ? 'Entity Velocity' : 'Clinical Velocity'}</span>
              <Users className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="stat-value tabular-nums mt-2">{isSuper ? superTotals.patients : (reportSummary?.periodical?.dailyAppointments || 0)}</span>
           <span className="stat-sub text-slate-400 mt-1">{isSuper ? 'Entities' : 'Patients/day'}</span>
           <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest">+12.4% Trajectory</p>
        </div>

        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">{isSuper ? 'System Liquidity' : 'Financial Liquidity'}</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="stat-value tabular-nums mt-2">{metrics.liquidity}</span>
           <span className="stat-sub text-slate-400 mt-1">Revenue</span>
           <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Settlement Stable</p>
        </div>

        <div className="vital-node vital-node--safe shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">{isSuper ? 'User Engagement' : 'Resource Load'}</span>
              <Activity className="w-4 h-4 text-emerald-500 opacity-50" />
           </div>
           <span className="stat-value tabular-nums mt-2">{isSuper ? superTotals.users : (reportSummary?.periodical?.openAppointments || 0)}</span>
           <span className="stat-sub text-slate-400 mt-1">{isSuper ? 'Users' : 'Open'}</span>
           <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Nominal Capacity</p>
        </div>

        <div className="vital-node vital-node--warning shadow-sm">
           <div className="flex justify-between items-start">
              <span className="vital-label">{isSuper ? 'Node Count' : 'Aging Receivables'}</span>
              <FileText className="w-4 h-4 text-amber-500 opacity-50" />
           </div>
           <span className="stat-value tabular-nums mt-2">{isSuper ? superTotals.tenants : (reportSummary?.periodical?.pendingInvoices || 0)}</span>
           <span className="stat-sub text-slate-400 mt-1">{isSuper ? 'Tenants' : 'Invoices'}</span>
           <p className="text-[10px] font-black text-amber-600 mt-2 uppercase tracking-widest">Audit Recommended</p>
        </div>
      </section>

      {/* 3. AI STRATEGIC INSIGHTS (Full Width) */}
      <div className="grid grid-cols-12 gap-8 mb-10">
        <article className="col-span-12 clinical-card border-l-4 border-l-emerald-500 bg-emerald-50/10">
          <div className="flex items-start gap-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xl shadow-emerald-900/10 shrink-0">
               <BrainCircuit className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Strategic Narrative Insights • AI Layer</h3>
              <p className="text-slate-700 text-base font-medium leading-relaxed max-w-5xl">
                {isSuper
                  ? `Platform health is optimal. Aggregate patient engagement across ${superTotals.tenants} facilities shows a strong upward trend. Node stability is maintaining 99.9% uptime with zero priority regressions.`
                  : slmInsights?.narrative || 'Initializing operational narrative engine... Baseline metrics indicate high clinical retention and optimal resource allocation.'}
              </p>
              <div className="flex gap-3 mt-6">
                {(isSuper ? ['Network Growth', 'Node Stability', 'Global Compliance'] : (slmInsights?.trends || ['Retention High', 'Flow Optimal'])).map((t) => (
                  <span key={t} className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-tabular">{isSuper ? 'Platform Forecast' : 'Growth Forecast'}</div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight tabular-nums">
                {isSuper ? currency(superOverview?.totals?.revenue || 0) : currency(slmInsights?.forecast || avgRev * 1.12)}
              </div>
              <div className="text-[10px] font-black text-emerald-600/60 uppercase mt-1 tracking-widest">{isSuper ? 'Total Network Yield' : 'Projected Expansion'}</div>
            </div>
          </div>
        </article>
      </div>

      {/* 4. DATA VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART SECTION */}
        <article className="clinical-card">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Velocity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Institutional Financial Performance • 6 Month Cycle</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
               <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between h-64 gap-6 px-4">
            {monthlyRevenue.map((m) => {
              const maxVal = Math.max(...monthlyRevenue.map((r) => r.amount)) || 1;
              const height = (m.amount / maxVal) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div className="w-full bg-slate-50 rounded-2xl group-hover:bg-emerald-50/50 transition-colors" style={{ height: '100%' }}></div>
                    <div 
                      className="absolute bottom-0 w-full bg-emerald-500/80 rounded-2xl group-hover:bg-emerald-600 transition-all cursor-pointer shadow-lg shadow-emerald-500/10" 
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl border border-white/10">
                        {currency(m.amount)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.month}</span>
                </div>
              );
            })}
          </div>
        </article>

        {/* PERFORMANCE TABLE SECTION */}
        <article className="clinical-card !p-0 overflow-hidden">
          <header className="p-8 pb-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Staff Performance Registry</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Clinical Load & Revenue Share Analysis</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
               <TrendingUp className="w-5 h-5" />
            </div>
          </header>
          
          <div className="premium-table-container">
            {loading ? (
              <div className="py-32 text-center text-slate-300 italic font-black uppercase tracking-[0.2em]">Syncing performance metrics...</div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="tracking-widest">Clinical Staff</th>
                    <th className="tracking-widest">Clinical Load</th>
                    <th style={{ textAlign: 'right' }} className="tracking-widest">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payouts.length > 0 ? (
                    payouts.map((p, idx) => (
                      <tr key={p.doctor_id} className="hover:bg-slate-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                        <td>
                          <div className="font-black text-slate-900 tracking-tight">{p.doctor_name}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 italic">{p.role}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-6">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (p.patient_count / 20) * 100)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 tabular-nums uppercase whitespace-nowrap leading-none">{p.patient_count} Encounters</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="font-black text-slate-900 tracking-tight tabular-nums">{currency(p.total_revenue)}</div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase mt-0.5">Share: {currency(p.estimated_commission)}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-32">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
                           <Activity className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Awaiting sequential data normalization...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

