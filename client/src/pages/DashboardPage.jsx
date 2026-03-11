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
    { label: 'Register Patient', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>, view: 'patients', color: 'text-emerald-500' },
    { label: 'Schedule Appointment', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>, view: 'appointments', color: 'text-blue-500' },
    { label: 'Dispense Medicine', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>, view: 'pharmacy', color: 'text-amber-500' },
    { label: 'Issue Invoice', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, view: 'billing', color: 'text-rose-500' },
  ];

  return (
    <div>
      {/* Welcome Banner - Refined to 'World Class' */}
      <div className="relative overflow-hidden rounded-[20px] p-10 mb-10 shadow-float border border-white/10 text-white" 
           style={{ background: 'linear-gradient(165deg, var(--medflow-primary) 0%, #1e4d78 40%, var(--medflow-accent) 100%)' }}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute animate-pulse -bottom-12 -left-12 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-pill text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Operational Intelligence
              </span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight drop-shadow-sm text-[#ffffff]">Greetings, {activeUser?.name || 'Administrator'}</h1>
            <p className="opacity-90 text-base font-medium text-[#f8fafc]">{today} • MedFlow Enterprise Network</p>
          </div>

          <div className="flex gap-6">
            <div className="text-right p-5 bg-white/10 border border-white/10 rounded-xl backdrop-blur-md shadow-lg min-w-[140px]">
              <div className="text-4xl font-extrabold drop-shadow-sm tracking-tight">{reportData?.periodical?.activeLabTests || 0}</div>
              <div className="text-[11px] opacity-80 uppercase tracking-wider font-bold mt-1">Active Lab Tests</div>
            </div>
            <div className="text-right p-5 bg-white/10 border border-white/10 rounded-xl backdrop-blur-md shadow-lg min-w-[140px] text-[#ffffff]">
              <div className="text-4xl font-extrabold text-[#bfdbfe] drop-shadow-sm tracking-tight">Normal</div>
              <div className="text-[11px] opacity-80 uppercase tracking-wider font-bold mt-1 text-[#ffffff]">Facility Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* LEFT COLUMN (METRICS & CHARTS) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
          </div>

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
        <aside className="lg:col-span-4 space-y-8">
          {/* Quick Actions */}
          <section className="glass-panel rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-lg">Quick Actions</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {quickActions.map(action => (
                <button
                  key={action.view}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 group"
                  onClick={() => setView(action.view)}
                >
                  <div className={`p-3 rounded-lg bg-white dark:bg-slate-700 shadow-sm transition-all ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* System Intelligence */}
          <section className="glass-panel rounded-xl flex flex-col relative h-[420px] shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 z-10 relative">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-[15px] flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                System Intelligence
              </h3>
            </div>
            
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 relative z-0">
              {reportData?.criticalAlerts?.length > 0 && reportData.criticalAlerts.map(alert => (
                <div key={alert.id} className="p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg relative overflow-hidden group hover:shadow-sm transition-shadow">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md">⚠️</span>
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest leading-none">Critical Lab</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="mt-3 font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">{alert.patientName}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 bg-white/50 dark:bg-slate-900/50 p-2 rounded border border-red-50 dark:border-transparent">{alert.testName}: <span className="font-bold text-slate-800 dark:text-slate-300">{alert.details?.results}</span></div>
                </div>
              ))}

              {lowStockAlerts.length > 0 ? lowStockAlerts.map((alert, i) => (
                <div
                  key={alert.drugId || i}
                  className={`p-4 rounded-lg border relative overflow-hidden group hover:shadow-sm transition-shadow ${alert.alertLevel === 'CRITICAL' ? 'bg-red-50/80 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'}`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${alert.alertLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-md ${alert.alertLevel === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>📦</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest leading-none ${alert.alertLevel === 'CRITICAL' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>Stock Alert</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">QTY: {alert.quantityRemaining}</span>
                  </div>
                  <h5 className={`font-semibold text-sm mt-2 ${alert.alertLevel === 'CRITICAL' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {alert.drugName}
                  </h5>
                  <p className={`text-[11px] mt-1 font-medium ${alert.alertLevel === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    Stock below threshold.
                  </p>
                </div>
              )) : (
                !reportData?.criticalAlerts?.length && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl m-2">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All Systems Nominal</p>
                    <p className="text-xs text-slate-500 mt-1">No critical alerts or low stock warnings detected.</p>
                  </div>
                )
              )}
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none z-20"></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
