import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard.jsx';
import ComparisonChart from '../components/ComparisonChart.jsx';
import { currency } from '../utils/format.js';
import { api } from '../api.js';

export default function DashboardPage({ metrics, activeUser, setView }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    loadReportData();
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

  const quickActions = [
    { label: 'Register Patient', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>, view: 'patients', color: '#10b981' },
    { label: 'Schedule Appointment', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>, view: 'appointments', color: '#3b82f6' },
    { label: 'Dispense Medicine', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>, view: 'pharmacy', color: '#f59e0b' },
    { label: 'Issue Invoice', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, view: 'billing', color: '#ef4444' },
    { label: 'Record Attendance', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, view: 'employees', color: '#8b5cf6' },
    { label: 'View Financials', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>, view: 'accounts', color: '#6366f1' },
  ];

  return (
    <section className="view dashboard-v2">
      {/* Premium Hero Section */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-emerald"></span>
            Operational Intelligence Active
          </div>
          <h1>Greetings, {activeUser?.name || 'Administrator'}</h1>
          <p className="hero-subtitle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {today}
            <span className="dot-divider">•</span>
            <span className="facility-status">MedFlow Enterprise Network</span>
          </p>

          <div className="hero-clinical-stats">
            <div className="c-stat">
              <span className="c-icon color-emerald">💉</span>
              <div className="c-text">
                <strong>98%</strong>
                <span>Vaccination Rate</span>
              </div>
            </div>
            <div className="c-stat">
              <span className="c-icon color-blue">🧪</span>
              <div className="c-text">
                <strong>{reportData?.periodical?.activeLabTests || 0}</strong>
                <span>Active Lab Tests</span>
              </div>
            </div>
            <div className="c-stat">
              <span className="c-icon color-amber">🌡️</span>
              <div className="c-text">
                <strong>Normal</strong>
                <span>Facility Ambience</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual-accent"></div>
      </div>

      <div className="main-dashboard-layout">
        <div className="stats-column">
          {/* Core Metrics */}
          <div className="metrics-grid">
            <div className="metric-item glass-card blue">
              <div className="m-icon color-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="m-data">
                <span className="m-label">Total Patients</span>
                <div className="m-val-row">
                  <span className="m-val">{metrics.patients?.toLocaleString() || 0}</span>
                  <span className="m-trend positive">+4%</span>
                </div>
              </div>
            </div>
            <div className="metric-item glass-card emerald">
              <div className="m-icon color-emerald">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="m-data">
                <span className="m-label">Scheduled Visits</span>
                <div className="m-val-row">
                  <span className="m-val">{metrics.appointments || 0}</span>
                  <span className="m-trend positive">+12%</span>
                </div>
              </div>
            </div>
            <div className="metric-item glass-card amber">
              <div className="m-icon color-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div className="m-data">
                <span className="m-label">Awaiting Triage</span>
                <div className="m-val-row">
                  <span className="m-val">{metrics.walkins || 0}</span>
                  <span className="m-trend neutral">Stable</span>
                </div>
              </div>
            </div>
            <div className="metric-item glass-card rose">
              <div className="m-icon color-rose">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="m-data">
                <span className="m-label">Institutional Revenue</span>
                <div className="m-val-row">
                  <span className="m-val">{currency(metrics.revenue || 0)}</span>
                  <span className="m-trend positive">+8.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {!loading && reportData && (
            <div className="analytics-container premium-glass">
              <div className="section-header">
                <div>
                  <h3>Performance Trends</h3>
                  <p>In-depth analysis of facility throughput and financial health.</p>
                </div>
              </div>
              <div className="charts-flex">
                <ComparisonChart
                  title="Patient Flow"
                  data={reportData.monthlyComparison.appointments}
                  dataKey="count"
                  color="#10b981"
                />
                <ComparisonChart
                  title="Revenue Yield"
                  data={reportData.monthlyComparison.revenue}
                  dataKey="amount"
                  color="#3b82f6"
                  formatValue={(val) => currency(val)}
                />
              </div>
            </div>
          )}
        </div>

        <aside className="actions-column">
          <div className="action-panel premium-glass">
            <h4>Workflow Accelerators</h4>
            <div className="actions-grid">
              {quickActions.map(action => (
                <button
                  key={action.view}
                  className="action-tile"
                  onClick={() => setView(action.view)}
                  style={{ '--tile-accent': action.color }}
                >
                  <div className="tile-icon">{action.icon}</div>
                  <span className="tile-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="alerts-panel premium-glass">
            <h4>System Intelligence</h4>
            <div className="alerts-stack">
              <div className="alert-card warning">
                <div className="alert-marker"></div>
                <div className="alert-body">
                  <h5>Low Inventory Warning</h5>
                  <p>Surgical supplies reaching critical reorder levels.</p>
                </div>
              </div>
              <div className="alert-card info">
                <div className="alert-marker"></div>
                <div className="alert-body">
                  <h5>Data Sync Completed</h5>
                  <p>Encrypted vault synchronization finalized successfully.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .dashboard-v2 { display: flex; flex-direction: column; gap: 1rem; max-width: 1400px; margin: 0 auto; width: 100%; padding-bottom: 2rem; }
        
        .hero-banner { 
          position: relative; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 2rem; padding: 3rem; color: white; overflow: hidden;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.3);
        }
        .hero-visual-accent { 
          position: absolute; top: -50%; right: -10%; width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          filter: blur(40px); pointer-events: none;
        }
        .hero-badge { 
          display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1);
          color: #10b981; padding: 6px 14px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.2);
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem;
        }
        .hero-clinical-stats { display: flex; gap: 2rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .c-stat { display: flex; align-items: center; gap: 12px; }
        .c-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 12px; display: grid; place-items: center; font-size: 1.25rem; }
        .c-text { display: flex; flex-direction: column; }
        .c-text strong { font-size: 1.15rem; color: white; font-weight: 900; line-height: 1; }
        .c-text span { font-size: 0.7rem; color: #94a3b8; font-weight: 600; margin-top: 4px; }
        .color-emerald { color: #10b981; }
        .color-blue { color: #3b82f6; }
        .color-amber { color: #f59e0b; }
        
        .hero-content h1 { font-size: 2.5rem; font-weight: 900; margin: 0; letter-spacing: -0.04em; }
        .hero-subtitle { margin-top: 1rem; color: #94a3b8; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; gap: 10px; }
        .dot-divider { opacity: 0.3; }
        .facility-status { color: #3b82f6; font-weight: 700; }

        .main-dashboard-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        .stats-column { display: flex; flex-direction: column; gap: 2rem; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .metric-item { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; border-radius: 1.5rem; }
        .metric-item.blue { background: #eff6ff; border: 1.5px solid #dbeafe; }
        .metric-item.emerald { background: #ecfdf5; border: 1.5px solid #d1fae5; }
        .metric-item.amber { background: #fffbeb; border: 1.5px solid #fef3c7; }
        .metric-item.rose { background: #fff1f2; border: 1.5px solid #ffe4e6; }
        
        .m-icon { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .blue .m-icon { color: #3b82f6; }
        .emerald .m-icon { color: #10b981; }
        .amber .m-icon { color: #f59e0b; }
        .rose .m-icon { color: #e11d48; }
        
        .m-data { display: flex; flex-direction: column; flex: 1; }
        .m-label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .m-val-row { display: flex; align-items: baseline; justify-content: space-between; margin-top: 2px; }
        .m-val { font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
        .m-trend { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .m-trend.positive { color: #10b981; background: #ecfdf5; }
        .m-trend.neutral { color: #64748b; background: #f1f5f9; }
        .m-trend.negative { color: #ef4444; background: #fef2f2; }
        .color-rose { color: #e11d48; }

        .analytics-container { padding: 2rem; border-radius: 2rem; background: white; border: 1.5px solid #f1f5f9; }
        .section-header h3 { font-size: 1.15rem; font-weight: 900; color: #0f172a; margin: 0; }
        .section-header p { font-size: 0.85rem; color: #64748b; margin-top: 4px; font-weight: 500; }
        .charts-flex { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }

        .action-panel, .alerts-panel { padding: 1.75rem; border-radius: 1.75rem; background: white; border: 1.5px solid #f1f5f9; margin-bottom: 1.5rem; }
        .action-panel h4, .alerts-panel h4 { font-size: 0.85rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem; display: block; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
        
        .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .action-tile { 
          display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 1.25rem 0.5rem;
          background: #f8fafc; border: 1.5px solid transparent; border-radius: 16px; cursor: pointer; transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .action-tile:hover { background: white; border-color: var(--tile-accent); color: var(--tile-accent); transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .tile-icon { opacity: 0.8; }
        .tile-label { font-size: 0.75rem; font-weight: 700; color: #475569; text-align: center; line-height: 1.2; }
        .action-tile:hover .tile-label { color: #1e293b; }

        .alerts-stack { display: flex; flex-direction: column; gap: 1rem; }
        .alert-card { display: flex; gap: 12px; padding: 1rem; border-radius: 14px; position: relative; overflow: hidden; }
        .alert-card.warning { background: #fffbeb; }
        .alert-card.info { background: #f0f9ff; }
        .alert-marker { width: 4px; height: 100%; position: absolute; left: 0; top: 0; }
        .warning .alert-marker { background: #f59e0b; }
        .info .alert-marker { background: #3b82f6; }
        .alert-body h5 { font-size: 0.8rem; font-weight: 800; color: #1e293b; margin: 0; }
        .alert-body p { font-size: 0.7rem; color: #64748b; margin-top: 4px; font-weight: 500; line-height: 1.4; }

        .pulse-emerald { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse-glow-emerald 2s infinite; }
        @keyframes pulse-glow-emerald { 
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } 
        }

        @media (max-width: 1100px) {
          .main-dashboard-layout { grid-template-columns: 1fr; }
          .metrics-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 800px) {
          .metrics-grid { grid-template-columns: 1fr 1fr; }
          .charts-flex { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
