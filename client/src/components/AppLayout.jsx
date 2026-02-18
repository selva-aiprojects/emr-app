import { useState } from 'react';
import { moduleMeta } from '../config/modules.js';
import { helpContent } from '../config/helpContent.js';
import { ModuleGate, useFeatureAccess } from './FeatureGate.jsx';

const navIcons = {
  superadmin: <svg className="nav-icon color-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  dashboard: <svg className="nav-icon color-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  patients: <svg className="nav-icon color-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  appointments: <svg className="nav-icon color-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  emr: <svg className="nav-icon color-rose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  inpatient: <svg className="nav-icon color-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13h20" /><path d="M22 13v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7" /><path d="M12 2a5 5 0 0 1 5 5v6H7V7a5 5 0 0 1 5-5z" /></svg>,
  pharmacy: <svg className="nav-icon color-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>,
  billing: <svg className="nav-icon color-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><path d="M16 14h2M8 14h2" /></svg>,
  inventory: <svg className="nav-icon color-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>,
  employees: <svg className="nav-icon color-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  accounts: <svg className="nav-icon color-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>,
  reports: <svg className="nav-icon color-ruby" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  admin: <svg className="nav-icon color-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

const getTierBadgeColor = (tier) => {
  switch (tier?.toLowerCase()) {
    case 'enterprise': return '#f59e0b';
    case 'professional': return '#3b82f6';
    case 'basic': return '#10b981';
    default: return '#64748b';
  }
};

export default function AppLayout({ tenant, activeUser, allowedViews, view, setView, onLogout, children, error }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { getAccessibleModules } = useFeatureAccess(tenant?.id);

  // Filter allowed views based on feature flags
  const accessibleModules = getAccessibleModules(allowedViews);

  // Dynamic colors from tenant settings
  const primaryColor = tenant?.theme?.primary || 'var(--medical-primary)';
  const accentColor = tenant?.theme?.accent || 'var(--medical-secondary)';

  return (
    <div id="app" style={{ '--tenant-primary': primaryColor, '--tenant-accent': accentColor }}>
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Help Modal */}
      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal premium-glass" onClick={e => e.stopPropagation()}>
            <div className="help-header">
              <h3>Role Guide: {activeUser.role}</h3>
              <button onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div
              className="help-content"
              dangerouslySetInnerHTML={{ __html: helpContent[activeUser.role] || helpContent.default }}
            />
          </div>
        </div>
      )}

      <aside className={`sidebar premium-sidebar ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
        <div className="brand-block">
          <div className="tenant-logo-wrapper">
            <div className="tenant-logo-icon">
              <img
                src="/Medflow-logo.jpg"
                alt="MedFlow EMR"
                className="tenant-logo-img"
                onError={(e) => {
                  // Fallback to SVG if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <svg className="tenant-logo-fallback" style={{ display: 'none' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                <polyline points="9 22 9 12"></polyline>
              </svg>
            </div>
            <div className="tenant-logo-text">
              <h1>{tenant?.name || 'MedFlow'}</h1>
              <p className="tenant-subtitle">Enterprise EMR</p>
            </div>
          </div>
          <div className="brand-info">
            <p className="role-tag">{activeUser.role}</p>
            {tenant?.subscription_tier && (
              <p className="tier-indicator">{tenant.subscription_tier} Tier</p>
            )}
          </div>
        </div>

        <nav className="module-nav">
          {accessibleModules.map((item) => {
            if (!moduleMeta[item]) return null;
            return (
              <ModuleGate key={item} module={item} tenantId={tenant?.id}>
                <button
                  className={view === item ? 'active' : ''}
                  onClick={() => {
                    setView(item);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="icon-box">{navIcons[item]}</div>
                  <span>{moduleMeta[item].title}</span>
                  {view === item && <div className="active-indicator"></div>}
                </button>
              </ModuleGate>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn premium-logout" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Exit Workspace</span>
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="main-header glass-header">
          <div className="header-context">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <div className="title-group">
                <h2 className="header-title">{moduleMeta[view]?.title}</h2>
                <div className="live-badge premium-badge">
                  <span className="pulse"></span>
                  LIVE SYSTEM
                </div>
                {tenant?.subscription_tier && (
                  <div className="subscription-badge" style={{ backgroundColor: getTierBadgeColor(tenant.subscription_tier) }}>
                    {tenant.subscription_tier} TIER
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="header-right-actions">
            <button className="help-action-card" onClick={() => setShowHelp(true)} title="Operating Manual">
              <div className="help-icon-pulsar">?</div>
              <div className="help-label-block">
                <span>Role Guide</span>
                <small>Documentation</small>
              </div>
            </button>
            <div className="user-profile-widget premium-glass">
              <div className="avatar-shield">{(activeUser?.name || 'U')[0]}</div>
              <div className="user-text-details">
                <span className="user-display-name">{activeUser?.name || 'User'}</span>
                <span className="user-display-email">{activeUser?.email || ''}</span>
              </div>
            </div>
          </div>
        </header>

        {error && <div className="error-box premium-error">{error}</div>}
        <div className="view-content" style={{ animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {children}
        </div>
      </main>

      <style>{`
        :root {
          --tenant-primary: ${primaryColor};
          --tenant-accent: ${accentColor};
          --slate-900: #0f172a;
          --slate-800: #1e293b;
          --slate-100: #f1f5f9;
        }

        .premium-sidebar {
          background: linear-gradient(195deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .brand-block { padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.25rem; flex-shrink: 0; }
        .tenant-logo-wrapper { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: fit-content; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 12px; }
        .tenant-logo-icon { 
          width: 40px; height: 40px; background: var(--tenant-primary, #10b981); 
          border-radius: 10px; display: grid; place-items: center; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .tenant-logo-icon svg { 
          color: white; stroke-width: 1.5; 
        }
        .tenant-logo-text { text-align: center; }
        .tenant-logo-text h1 { color: white; font-size: 1.1rem; font-weight: 800; margin: 0; line-height: 1.2; }
        .tenant-logo-text p { color: rgba(255,255,255,0.8); font-size: 0.65rem; font-weight: 600; margin: 0; margin-top: 2px; }
        .brand-text { display: none; }
        .tenant-logo-img { display: none; }
        .brand-info { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .role-tag { color: var(--tenant-primary, #10b981); font-size: 0.55rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; padding: 2px 6px; background: rgba(16, 185, 129, 0.1); border-radius: 4px; }
        .tier-indicator { 
          color: white; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; 
          padding: 2px 6px; border-radius: 4px; background: var(--tenant-accent, #3b82f6);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .module-nav { 
          padding: 0.5rem 0.75rem; 
          flex: 1; 
          overflow-y: auto; 
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .module-nav::-webkit-scrollbar { width: 4px; }
        .module-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .module-nav button { 
          position: relative; border-radius: 12px; margin-bottom: 4px; color: #94a3b8; width: 100%;
          font-weight: 600; padding: 0.65rem 1rem; transition: all 0.2s; display: flex; align-items: center; gap: 12px;
          border: none; background: transparent; cursor: pointer; min-height: 40px;
        }
        .module-nav button:hover { background: rgba(255,255,255,0.05); color: white; }
        .module-nav button.active { 
          background: rgba(255,255,255,0.1); color: white; font-weight: 800;
          box-shadow: inset 0 0 12px rgba(255,255,255,0.02);
        }
        .icon-box { color: #64748b; transition: color 0.2s; display: flex; align-items: center; }
        .active .icon-box { color: var(--tenant-primary); }
        .active-indicator { 
          position: absolute; left: 0; top: 15%; bottom: 15%; width: 4px; 
          background: var(--tenant-primary); border-radius: 0 4px 4px 0; 
          box-shadow: 0 0 15px var(--tenant-primary);
        }

        .sidebar-footer { padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; background: rgba(15, 23, 42, 0.5); }
        .premium-logout { 
          width: 100%; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
          color: #94a3b8; border-radius: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 10px; cursor: pointer; transition: 0.2s; font-size: 0.75rem;
        }
        .premium-logout:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }

        .glass-header { 
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); 
          position: sticky; top: 0; z-index: 40; border-bottom: 1.5px solid #f1f5f9;
          margin: -1rem -1.5rem 0.5rem; padding: 0.65rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
          gap: 20px;
        }
        
        .header-context { flex: 1; min-width: 0; }
        .header-title { font-size: 1.15rem; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .premium-badge { 
          display: flex; align-items: center; gap: 8px; background: #f0fdf4; 
          color: #15803d; padding: 4px 12px; border-radius: 2rem; font-size: 0.6rem; 
          font-weight: 900; border: 1.5px solid #dcfce7; white-space: nowrap;
        }
        .subscription-badge { 
          color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.6rem; 
          font-weight: 700; text-transform: uppercase; margin-left: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header-right-actions { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
        
        /* Prominent Help Card */
        .help-action-card {
          display: flex; align-items: center; gap: 12px; padding: 6px 14px; 
          background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
          cursor: pointer; transition: 0.2s; text-align: left;
        }
        .help-action-card:hover { border-color: #3b82f6; background: white; box-shadow: 0 4px 12px rgba(59,130,246,0.1); }
        .help-icon-pulsar {
          width: 28px; height: 28px; background: #3b82f6; color: white; border-radius: 8px;
          display: grid; place-items: center; font-weight: 900; font-size: 0.9rem;
        }
        .help-label-block { display: flex; flex-direction: column; line-height: 1; }
        .help-label-block span { font-size: 0.75rem; font-weight: 800; color: #1e293b; }
        .help-label-block small { font-size: 0.6rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }

        .user-profile-widget { 
          display: flex; align-items: center; gap: 12px; padding: 6px 14px 6px 8px; border-radius: 1rem; 
          background: white; border: 1.5px solid #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.02); min-width: fit-content;
        }
        .avatar-shield { 
          width: 32px; height: 32px; background: var(--tenant-primary); color: white; 
          border-radius: 8px; display: grid; place-items: center; font-weight: 900; font-size: 1rem;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); flex-shrink: 0;
        }
        .user-text-details { display: flex; flex-direction: column; line-height: 1.1; min-width: 0; }
        .user-display-name { font-weight: 800; color: #1e293b; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        .user-display-email { font-size: 0.65rem; color: #94a3b8; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        
        /* Help Modal Refined */
        .help-modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); 
          backdrop-filter: blur(8px); z-index: 1000; display: grid; place-items: center; padding: 2rem;
          animation: fade-in 0.3s ease-out;
        }
        .help-modal {
          width: 100%; max-width: 500px; background: white; border-radius: 1.5rem; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #f1f5f9;
          overflow: hidden; animation: modal-appeaer 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modal-appeaer { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        .help-header { 
          padding: 1.5rem; background: #f8fafc; border-bottom: 1.5px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: center;
        }
        .help-header h3 { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0; }
        .help-header button { 
          background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%;
          display: grid; place-items: center; color: #64748b; cursor: pointer; font-size: 1.25rem; font-weight: 700;
        }
        .help-content { padding: 1.75rem; color: #334155; line-height: 1.6; font-size: 0.95rem; }
        .help-content ul { padding-left: 1.25rem; margin-top: 1rem; display: flex; flex-direction: column; gap: 8px; }
        .help-content li { font-weight: 500; }
        
        /* Logo Styling for Consistent Theming */
        .tenant-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .tenant-logo-img:hover {
          transform: scale(1.05);
        }

        .tenant-logo-fallback {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--tenant-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .tenant-logo-fallback:hover {
          transform: scale(1.05);
        }
        .help-content li strong { color: var(--tenant-primary); font-weight: 700; }

        @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
