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
      <div className="page-header-premium mb-4">
        <div>
          <h1>Operational Intelligence</h1>
          <p>{today} • Institutional Oversight</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
            <div className="px-4 py-2 border-r border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Census</span>
              <span className="text-xs font-bold text-slate-800">{reportData?.periodical?.activeAdmissions || 0} In-patient</span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Diagnostics</span>
              <span className="text-xs font-bold text-slate-800">{reportData?.periodical?.activeLabTests || 0} Tests Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <MetricCard label="Total Patients" value={metrics.patients?.toLocaleString() || 0} icon="patients" accent="blue" trend="+4%" />
        <MetricCard label="Visits" value={metrics.appointments || 0} icon="appointments" accent="emerald" trend="+12%" />
        <MetricCard label="Triage" value={metrics.walkins || 0} icon="walkins" accent="amber" trend="Stable" />
        <MetricCard label="Revenue" value={currency(metrics.revenue || 0)} icon="revenue" accent="rose" trend="+8.2%" />
      </div>

      {/* MAIN */}
      <main className="dashboard-main-layout">
        {/* COLUMN 1: ANALYTICS */}
        <section className="dashboard-column dashboard-column--analytics">
          <section className="premium-panel premium-panel--analytics">
            <div className="panel-header-standard">
              <div className="panel-title-group">
                <h3 className="panel-title-text font-bold">Clinical & Financial Analytics</h3>
                <p className="panel-subtitle-text font-medium mt-1">Institutional Node Performance</p>
              </div>
            </div>

            <div className="panel-body panel-body--charts">
              {loading ? (
                <div className="chart-grid chart-grid--compact">
                  <div className="chart-skeleton" />
                  <div className="chart-skeleton" />
                </div>
              ) : reportData ? (
                <div className="chart-grid chart-grid--compact">
                  <ComparisonChart
                    title="Patient Volume (14d)"
                    data={reportData?.dailyActivity || []}
                    dataKey="appointments"
                    color="var(--medflow-accent)"
                    type="bar"
                  />
                  <ComparisonChart
                    title="Revenue Stream (14d)"
                    data={reportData?.dailyActivity || []}
                    dataKey="revenue"
                    color="var(--medflow-accent)"
                    formatValue={(val) => currency(val)}
                  />
                </div>
              ) : (
                <div className="panel-empty panel-empty--charts">
                  <p className="panel-empty-title">No data</p>
                </div>
              )}
            </div>
          </section>
        </section>

        {/* COLUMN 2: ACTIVE ALERTS */}
        <section className="dashboard-column dashboard-column--alerts">
          <section className="premium-panel system-intel">
            <div className="panel-header">
              <div className="panel-header-main">
                <div className="panel-header-text">
                  <h2 className="panel-title">Active Alerts</h2>
                  <p className="panel-subtitle">Immediate attention</p>
                </div>
              </div>
            </div>

            <div className="alert-strip">
              {/* Critical labs */}
              {reportData?.criticalAlerts?.length > 0 &&
                reportData.criticalAlerts.map((alert) => (
                  <div key={alert.id} className="alert-item alert-item--critical">
                    <div className="alert-icon-shell">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    <div className="alert-content-enhanced">
                      <div className="alert-top">
                        <span className="alert-title">{alert.patientName}</span>
                      </div>
                      <div className="alert-bottom">
                        <span className="alert-meta">{alert.testName}</span>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Low stock */}
              {lowStockAlerts.length > 0 &&
                lowStockAlerts.map((alert, i) => {
                  const isCritical = alert.alertLevel === 'CRITICAL';
                  return (
                    <div key={alert.drugId || i} className={'alert-item ' + (isCritical ? 'alert-item--critical' : 'alert-item--warning')}>
                      <div className="alert-icon-shell alert-icon-shell--warning">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7.5 4.27 9 5.15" />
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="m3.3 7 8.7 5 8.7-5" />
                          <path d="M12 22V12" />
                        </svg>
                      </div>
                      <div className="alert-content-enhanced">
                        <div className="alert-top">
                          <span className="alert-title">{alert.drugName}</span>
                        </div>
                        <div className="alert-bottom">
                          <span className="alert-meta">{alert.quantityRemaining} left</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {!hasAnyAlerts && (
                <div className="alert-empty">
                  <span className="alert-empty-title">Clear</span>
                </div>
              )}
            </div>
          </section>
        </section>

        {/* COLUMN 3: QUICK ACTIONS */}
        <section className="dashboard-column dashboard-column--actions">
          <section className="premium-panel premium-panel--actions">
            <div className="panel-header">
              <div className="panel-header-text">
                <h2 className="panel-title">Quick Actions</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {quickActions.map((action) => (
                <button
                  key={action.view}
                  type="button"
                  onClick={() => setView(action.view)}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className={`p-2 rounded-lg bg-white text-[var(--primary)] shadow-sm group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800 tracking-tight">{action.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
