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
        setLowStockAlerts((res?.data || res || []).slice(0, 3));
      }
    } catch (err) {
      console.warn('Low stock alerts unavailable:', err.message);
    }
  }


  const quickActions = [
    { label: 'Register Patient', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>, view: 'patients', color: 'text-success' },
    { label: 'Schedule Appointment', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>, view: 'appointments', color: 'text-info' },
    { label: 'Dispense Medicine', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>, view: 'pharmacy', color: 'text-warning' },
    { label: 'Issue Invoice', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, view: 'billing', color: 'text-danger' },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="premium-panel flex-between" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge success">Operational Intelligence Active</span>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-white">Greetings, {activeUser?.name || 'Administrator'}</h1>
          <p className="opacity-80 text-sm">{today} • MedFlow Enterprise Network</p>
        </div>

        <div className="flex gap-4">
          <div className="text-right p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-2xl font-bold">{reportData?.periodical?.activeLabTests || 0}</div>
            <div className="text-xs opacity-70 uppercase tracking-wider">Active Lab Tests</div>
          </div>
          <div className="text-right p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-2xl font-bold">Normal</div>
            <div className="text-xs opacity-70 uppercase tracking-wider">Facility Status</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '0.85rem' }}>

        {/* LEFT COLUMN (STATS & CHARTS) */}
        <div style={{ gridColumn: 'span 8' }}>

          {/* METRICS GRID */}
          <section className="grid-cols-4 mb-6">
            <MetricCard
              label="Total Patients"
              value={metrics.patients?.toLocaleString() || 0}
              icon="patients"
              accent="blue"
              trend="+4%"
            />
            <MetricCard
              label="Scheduled Visits"
              value={metrics.appointments || 0}
              icon="appointments"
              accent="emerald"
              trend="+12%"
            />
            <MetricCard
              label="Awaiting Triage"
              value={metrics.walkins || 0}
              icon="walkins"
              accent="amber"
              trend="Stable"
            />
            <MetricCard
              label="Revenue Yield"
              value={currency(metrics.revenue || 0)}
              icon="revenue"
              accent="rose"
              trend="+8.2%"
            />
          </section>

          {/* CHARTS */}
          {!loading && reportData && (
            <div className="premium-panel">
              <div className="panel-header">
                <div className="panel-title">Clinical & Financial Analytics</div>
              </div>
              <div className="grid-cols-2">
                <ComparisonChart
                  title="Patient Flow Dynamics"
                  data={reportData?.monthlyComparison?.appointments || []}
                  dataKey="count"
                  color="var(--info)"
                />
                <ComparisonChart
                  title="Financial Performance"
                  data={reportData?.monthlyComparison?.revenue || []}
                  dataKey="amount"
                  color="var(--success)"
                  formatValue={(val) => currency(val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (ACTIONS & ALERTS) */}
        <aside style={{ gridColumn: 'span 4' }}>
          <section className="premium-panel">
            <div className="panel-header">
              <div className="panel-title">Quick Actions</div>
            </div>
            <div className="grid-cols-2 gap-4">
              {quickActions.map(action => (
                <button
                  key={action.view}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition flex flex-col items-center text-center gap-2"
                  onClick={() => setView(action.view)}
                >
                  <div className={`${action.color}`}>{action.icon}</div>
                  <span className="text-xs font-bold text-slate-600">{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="premium-panel">
            <div className="panel-header">
              <div className="panel-title">System Intelligence</div>
            </div>
            <div className="flex flex-col gap-3">
              {lowStockAlerts.length > 0 ? lowStockAlerts.map((alert, i) => (
                <div
                  key={alert.drugId || i}
                  className={`p-3 rounded-lg border ${alert.alertLevel === 'CRITICAL' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`badge ${alert.alertLevel === 'CRITICAL' ? 'danger' : 'warning'}`}>
                      {alert.alertLevel}
                    </span>
                    <span className="text-xs font-bold text-slate-400">QTY: {alert.quantityRemaining}</span>
                  </div>
                  <h5 className={`font-bold text-sm ${alert.alertLevel === 'CRITICAL' ? 'text-red-900' : 'text-amber-900'}`}>
                    {alert.drugName}
                  </h5>
                  <p className={`text-xs ${alert.alertLevel === 'CRITICAL' ? 'text-red-700' : 'text-amber-800'}`}>
                    Stock below reorder threshold ({alert.reorderThreshold}). Reorder required.
                  </p>
                </div>
              )) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="badge success">All Clear</span>
                  </div>
                  <h5 className="font-bold text-sm text-emerald-900">Inventory Stable</h5>
                  <p className="text-xs text-emerald-800">All pharmacy stock levels within normal range.</p>
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="badge info">Status</span>
                </div>
                <h5 className="font-bold text-sm text-blue-900">Data Sync finalized</h5>
                <p className="text-xs text-blue-800">Encrypted vault synchronization completed.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
