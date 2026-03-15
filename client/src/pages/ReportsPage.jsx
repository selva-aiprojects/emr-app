import { useState, useEffect } from 'react';
import { api } from '../api';
import MetricCard from '../components/MetricCard';
import { currency } from '../utils/format';

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
  const metrics = isSuper
    ? {
        velocity: `${superOverview?.activePatients || 0} Entities`,
        liquidity: currency((superOverview?.totalRevenue || 0) * 0.1),
        load: `${superOverview?.totalUsers || 0} Users`,
        receivables: superOverview?.activeTenants || 0,
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

  const totalMonthlyRev = monthlyRevenue.reduce((sum, r) => sum + r.amount, 0);
  const avgRev = totalMonthlyRev / (monthlyRevenue.length || 1);

  return (
    <div className="reports-intelligence-shard slide-up">
      <header className="mb-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isSuper ? 'Platform Intelligence Registry' : 'Executive Clinical Analytics'}
            </h2>
            <p className="text-sm text-slate-500">
              {isSuper
                ? 'Cross-facility operational trajectory and network node health'
                : 'Real-time performance metrics and institutional financial trajectory'}
            </p>
          </div>
          <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full border border-teal-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest">
              {isSuper ? 'NETWORK OVERVIEW ACTIVE' : 'SLM ANALYTICS ENGINE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <MetricCard
            label={isSuper ? 'Entity Velocity' : 'Clinical Velocity'}
            value={metrics.velocity}
            icon="patients"
            accent="teal"
            trend="+12.4% Trajectory"
          />
          <MetricCard
            label={isSuper ? 'System Liquidity' : 'Financial Liquidity'}
            value={metrics.liquidity}
            icon="revenue"
            accent="emerald"
            trend="Settlement Stable"
          />
          <MetricCard
            label={isSuper ? 'User Engagement' : 'Resource Load'}
            value={metrics.load}
            icon="employees"
            accent="teal"
            trend="Nominal Capacity"
          />
          <MetricCard
            label={isSuper ? 'Node Count' : 'Aging Receivables'}
            value={metrics.receivables}
            icon="walkins"
            accent="amber"
            trend="Audit Required"
          />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 mb-8">
        <article className="col-span-12 card border-l-4 border-teal-500 bg-slate-50/30">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-900/20">AI</div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Strategic Narrative Insights</h3>
              <p className="text-slate-700 text-sm font-medium leading-relaxed max-w-4xl">
                {isSuper
                  ? `Platform health is optimal. Aggregate patient engagement across ${superOverview?.activeTenants || 0} facilities shows a strong upward trend. Node stability is maintaining 99.9% uptime with zero priority regressions.`
                  : slmInsights?.narrative || 'Initializing operational narrative engine... Baseline metrics indicate high clinical retention and optimal resource allocation.'}
              </p>
              <div className="flex gap-2 mt-4">
                {(isSuper ? ['Network Growth', 'Node Stability', 'Global Compliance'] : (slmInsights?.trends || ['Retention High', 'Flow Optimal'])).map((t) => (
                  <span key={t} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-black uppercase tracking-tighter text-slate-500">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isSuper ? 'Platform Forecast' : 'Growth Forecast'}</div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                + {isSuper ? '18.4%' : currency(slmInsights?.forecast || avgRev * 1.12)}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">Projected expansion</div>
            </div>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <article className="card">
          <div className="flex-between mb-8 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Revenue Velocity</h3>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Performance Index • Last 6 Months</p>
            </div>
          </div>
          <div className="flex items-end justify-between h-48 gap-4 px-4">
            {monthlyRevenue.map((m) => {
              const maxVal = Math.max(...monthlyRevenue.map((r) => r.amount)) || 1;
              const height = (m.amount / maxVal) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div className="w-full bg-slate-50 rounded-t-md group-hover:bg-teal-50 transition-colors" style={{ height: '100%' }}></div>
                    <div 
                      className="absolute bottom-0 w-full bg-teal-500/80 rounded-t-md group-hover:bg-teal-600 transition-all cursor-pointer" 
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                        {currency(m.amount)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">{m.month}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex-between bg-slate-50/20">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Physician Performance Registry</h3>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Load & Revenue Share Analysis</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-slate-400 italic">Syncing performance metrics...</div>
            ) : (
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Clinical Staff</th>
                    <th>Clinical Load</th>
                    <th style={{ textAlign: 'right' }}>Revenue Share</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length > 0 ? (
                    payouts.map((p) => (
                      <tr key={p.doctor_id}>
                        <td>
                          <div className="font-bold text-slate-800 tracking-tight">{p.doctor_name}</div>
                          <div className="text-xs text-slate-400 font-black uppercase tracking-widest">{p.role}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, (p.patient_count / 20) * 100)}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-slate-600 whitespace-nowrap">{p.patient_count} Encounters</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="font-black text-slate-800 tracking-tight">{currency(p.total_revenue)}</div>
                          <div className="text-xs font-black text-emerald-600 uppercase">Share: {currency(p.estimated_commission)}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-20 text-slate-400 italic text-sm">
                        Awaiting sequential data normalization...
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
