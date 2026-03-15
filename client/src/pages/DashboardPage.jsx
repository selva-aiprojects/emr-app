import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard.jsx';
import ComparisonChart from '../components/ComparisonChart.jsx';
import { currency } from '../utils/format.js';
import { api } from '../api.js';

export default function DashboardPage({ metrics, activeUser, setView }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    loadReportData();
    loadAlerts();
  }, []);

  async function loadReportData() {
    try {
      const session = api.getStoredSession() || {};
      const tenantId = session.tenantId;
      if (tenantId) {
        const data = await api.getReportSummary(tenantId);
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAlerts() {
    try {
      const session = api.getStoredSession() || {};
      const tenantId = session.tenantId;
      if (tenantId) {
        const res = await api.getLowStockAlerts(tenantId);
        setLowStockAlerts((res?.data || res || []).slice(0, 5));
      }
    } catch (err) {
      console.warn('Low stock alerts unavailable:', err.message);
    }
  }

  const quickActions = [
    {
      label: 'Register Patient',
      description: 'Create a new patient profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      ),
      view: 'patients',
      colorClass: 'qa-icon'
    },
    {
      label: 'Schedule Appointment',
      description: 'Book an OPD / follow-up',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      view: 'appointments',
      colorClass: 'qa-icon'
    },
    {
      label: 'Dispense Medicine',
      description: 'Issue drugs from pharmacy',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
          <path d="m8.5 8.5 7 7"></path>
        </svg>
      ),
      view: 'pharmacy',
      colorClass: 'qa-icon'
    },
    {
      label: 'Issue Invoice',
      description: 'Generate billing document',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      view: 'billing',
      colorClass: 'qa-icon'
    }
  ];

  const hasAnyAlerts =
    (reportData?.criticalAlerts && reportData.criticalAlerts.length > 0) ||
    lowStockAlerts.length > 0;

  return (
    <div className="dashboard-shell dashboard-shell--dark">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="header-intro">
            <div className="header-badge">
              <span className="header-badge-dot" />
              <span className="header-badge-label">Operational Intelligence</span>
            </div>
            <div className="header-title-row">
              <h1 className="header-title">Welcome back, {activeUser?.name || 'Administrator'}</h1>
              {activeUser?.role && (
                <span className="header-role-pill">{activeUser.role}</span>
              )}
            </div>
            <p className="header-subtitle">
              {today} - MedFlow Enterprise Network
            </p>
          </div>

          <div className="header-status">
            <div className="header-status-card header-status-card--facility">
              <div className="status-indicator status-indicator--ok" />
              <div className="status-text">
                <span className="status-label">Facility status</span>
                <span className="status-value status-value--ok">Normal</span>
              </div>
            </div>

            <div className="header-status-card header-status-card--metric">
              <div className="status-text">
                <span className="status-label">Active lab tests</span>
                <span className="status-value">
                  {reportData?.periodical?.activeLabTests || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="dashboard-main-layout">
        <section className="dashboard-main-column">
          {/* METRICS GRID */}
          <div className="metric-grid metric-grid--responsive">
            <MetricCard
              label="Total Patients"
              value={metrics.patients?.toLocaleString() || 0}
              icon="patients"
              accent="blue"
              trend="+4%"
              subtitle="Lifetime registered"
            />
            <MetricCard
              label="Scheduled Visits"
              value={metrics.appointments || 0}
              icon="appointments"
              accent="emerald"
              trend="+12%"
              subtitle="Today's calendar"
            />
            <MetricCard
              label="Awaiting Triage"
              value={metrics.walkins || 0}
              icon="walkins"
              accent="amber"
              trend="Stable"
              subtitle="Current queue"
            />
            <MetricCard
              label="Revenue Yield"
              value={currency(metrics.revenue || 0)}
              icon="revenue"
              accent="rose"
              trend="+8.2%"
              subtitle="Last 30 days"
            />
          </div>

          {/* ANALYTICS PANEL */}
          <section className="premium-panel premium-panel--analytics">
            <div className="panel-header panel-header--with-meta">
              <div className="panel-header-main">
                <div className="panel-header-icon panel-header-icon--info" />
                <div className="panel-header-text">
                  <h2 className="panel-title">Clinical & Financial Analytics</h2>
                  <p className="panel-subtitle">
                    Month-on-month performance and patient flow.
                  </p>
                </div>
              </div>
              <div className="panel-legend panel-legend--dual">
                <span className="legend-item legend-item--primary">Appointments</span>
                <span className="legend-item legend-item--success">Revenue</span>
              </div>
            </div>

            <div className="panel-body panel-body--charts">
              {loading ? (
                <div className="chart-grid">
                  <div className="chart-skeleton" />
                  <div className="chart-skeleton" />
                </div>
              ) : reportData ? (
                <div className="chart-grid">
                  <ComparisonChart
                    title="Patient Flow Dynamics"
                    data={reportData?.monthlyComparison?.appointments || []}
                    dataKey="count"
                    color="var(--medflow-accent)"
                  />
                  <ComparisonChart
                    title="Financial Performance"
                    data={reportData?.monthlyComparison?.revenue || []}
                    dataKey="amount"
                    color="var(--medflow-accent)"
                    formatValue={(val) => currency(val)}
                  />
                </div>
              ) : (
                <div className="panel-empty panel-empty--charts">
                  <div className="panel-empty-icon panel-empty-icon--charts">[Chart]</div>
                  <p className="panel-empty-title">No analytics data available</p>
                  <p className="panel-empty-text">
                    Once activity is recorded, trends will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>

        {/* SIDE COLUMN */}
        <aside className="dashboard-side-column">
          {/* QUICK ACTIONS */}
          <section className="premium-panel premium-panel--actions">
            <div className="panel-header">
              <div className="panel-header-text">
                <h2 className="panel-title">Quick Actions</h2>
                <p className="panel-subtitle">
                  Jump into frequent workflows in one click.
                </p>
              </div>
            </div>
            <div className="quick-action-grid">
              {quickActions.map((action) => (
                <button
                  key={action.view}
                  type="button"
                  onClick={() => setView(action.view)}
                  className="quick-action-item"
                >
                  <div className={`quick-action-icon ${action.colorClass}`}>
                    {action.icon}
                  </div>
                  <div className="quick-action-text">
                    <span className="quick-action-label">{action.label}</span>
                    <span className="quick-action-subtitle">{action.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </main>

      {/* ACTIVE ALERTS - FULL WIDTH */}
      <section className="premium-panel system-intel system-intel--full">
        <div className="panel-header">
          <div className="panel-header-main">
            <div className="panel-header-icon panel-header-icon--risk">!</div>
            <div className="panel-header-text">
              <h2 className="panel-title">Active Alerts</h2>
              <p className="panel-subtitle">
                Only items that require immediate attention.
              </p>
            </div>
          </div>
        </div>

        <div className="alert-strip">
          {/* Critical labs */}
          {reportData?.criticalAlerts?.length > 0 &&
            reportData.criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="alert-item alert-item--critical"
              >
                <span className="alert-pill alert-pill--critical">Critical Lab</span>
                <span className="alert-title">{alert.patientName}</span>
                <span className="alert-meta">{alert.testName}: {alert.details?.results}</span>
                <span className="alert-time">
                  {new Date(alert.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}

          {/* Low stock */}
          {lowStockAlerts.length > 0 &&
            lowStockAlerts.map((alert, i) => {
              const isCritical = alert.alertLevel === 'CRITICAL';
              return (
                <div
                  key={alert.drugId || i}
                  className={'alert-item ' + (isCritical ? 'alert-item--critical' : 'alert-item--warning')}
                >
                  <span className={'alert-pill ' + (isCritical ? 'alert-pill--critical' : 'alert-pill--warning')}>
                    Stock Alert
                  </span>
                  <div className="alert-content">
                    <span className="alert-title">{alert.drugName}</span>
                    <span className="alert-meta">
                      Stock: <span className="font-bold">{alert.quantityRemaining}</span> units remaining
                    </span>
                  </div>
                  <span className="alert-time">Action Required</span>
                </div>
              );
            })}

          {/* Empty state */}
          {!hasAnyAlerts && (
            <div className="alert-empty">
              <span className="alert-empty-title">All systems nominal</span>
              <span className="alert-empty-text">
                No critical lab events or low stock warnings detected across the network.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
