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
    <section className="view-content intelligence-center">
      <header className="intel-header">
        <div className="title-stack">
          <h2>{isSuper ? 'Platform Intelligence Registry' : 'Executive Intelligence Center'}</h2>
          <p>
            {isSuper
              ? 'Cross-facility operational trajectory and network health'
              : 'Real-time clinical performance and financial trajectory analysis'}
          </p>
        </div>
        <div className="intel-badge premium-glass">
          <span className="pulse-dot"></span>
          {isSuper ? 'NETWORK OVERVIEW' : 'SLM LIVE ANALYTICS'}
        </div>
      </header>

      <div className="intel-grid-top">
        <article className="panel slm-insight-board">
          <div className="insight-head">
            <span className="insight-icon" aria-hidden="true">
              AI
            </span>
            <h3>Strategic Narrative</h3>
          </div>
          <p className="insight-copy">
            {isSuper
              ? `Platform health is optimal. Aggregate patient engagement across ${superOverview?.activeTenants || 0} facilities shows a ${superOverview?.growth || '+12%'} upward trend.`
              : slmInsights?.narrative || 'Initializing operational narrative engine...'}
          </p>
          <div className="insight-tags">
            {isSuper
              ? ['Network Growth', 'Node Stability', 'Global Compliance'].map((t) => (
                  <span key={t} className="i-tag">
                    {t}
                  </span>
                ))
              : slmInsights?.trends?.map((t) => (
                  <span key={t} className="i-tag">
                    {t}
                  </span>
                )) || <span className="i-tag">Normalizing...</span>}
          </div>
          <div className="predictive-footer">
            <strong>{isSuper ? 'Platform Load Forecast:' : 'Next Month Forecast:'}</strong>
            <span className="forecast-value">
              + {isSuper ? '18.4%' : currency(slmInsights?.forecast || avgRev * 1.12)}
            </span>
            <span>{isSuper ? '(Estimated Expansion)' : '(Projected Growth)'}</span>
          </div>
        </article>

        <div className="metrics-cluster">
          <MetricCard
            label={isSuper ? 'Entity Velocity' : 'Clinical Velocity'}
            value={metrics.velocity}
            icon="patients"
            accent="blue"
          />
          <MetricCard
            label={isSuper ? 'System Liquidity' : 'Financial Liquidity'}
            value={metrics.liquidity}
            icon="revenue"
            accent="rose"
          />
          <MetricCard
            label={isSuper ? 'User Engagement' : 'Resource Load'}
            value={metrics.load}
            icon="employees"
            accent="emerald"
          />
          <MetricCard
            label={isSuper ? 'Node Count' : 'Aging Receivables'}
            value={metrics.receivables}
            icon="walkins"
            accent="amber"
          />
        </div>
      </div>

      <div className="grid-2-equal">
        <article className="panel">
          <div className="panel-header-flex">
            <h3>Revenue Velocity</h3>
            <span className="context-label">Last 6 Months</span>
          </div>
          <div className="revenue-viz">
            {monthlyRevenue.map((m) => {
              const maxVal = Math.max(...monthlyRevenue.map((r) => r.amount)) || 1;
              const height = (m.amount / maxVal) * 100;
              return (
                <div key={m.month} className="rev-bar-group">
                  <div className="rev-bar">
                    <div className="rev-fill" style={{ height: `${height}%` }}>
                      <span className="rev-val">{currency(m.amount).split('.')[0]}</span>
                    </div>
                  </div>
                  <span className="rev-label">{m.month}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <h3>Physician Performance Registry</h3>
          {loading ? (
            <p>Syncing performance metrics...</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Clinical Load</th>
                  <th style={{ textAlign: 'right' }}>Revenue Share</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length > 0 ? (
                  payouts.map((p) => (
                    <tr key={p.doctor_id}>
                      <td>
                        <div className="provider-name">{p.doctor_name}</div>
                        <div className="provider-role">{p.role}</div>
                      </td>
                      <td>
                        <div className="provider-load">{p.patient_count} Encounters</div>
                        <div className="mini-track">
                          <div className="mini-fill" style={{ width: `${(p.patient_count / 20) * 100}%` }}></div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="provider-revenue">{currency(p.total_revenue)}</div>
                        <div className="provider-commission">+ {currency(p.estimated_commission)}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      Awaiting data normalization...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </article>
      </div>
    </section>
  );
}