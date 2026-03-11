import { useState, useEffect } from "react";
import { moduleMeta } from "../config/modules.js";
import { helpContent } from "../config/helpContent.js";
import { ModuleGate, useFeatureAccess } from "./FeatureGate.jsx";
import { applyMedflowTheme, THEMES } from "../theme/medflowTheme.js";

const navIcons = {
  superadmin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  patients: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  appointments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  emr: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  inpatient: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13h20" /><path d="M22 13v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7" /><path d="M12 2a5 5 0 0 1 5 5v6H7V7a5 5 0 0 1 5-5z" /></svg>,
  pharmacy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>,
  billing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><path d="M16 14h2M8 14h2" /></svg>,
  insurance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>,
  employees: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  accounts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  admin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  lab: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>,
};

export default function AppLayout({ tenant, activeUser, allowedViews, view, setView, onLogout, children, error }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('medflow-theme');
    return Object.values(THEMES).includes(stored) ? stored : THEMES.HEALING_TEAL;
  });

  const { getAccessibleModules } = useFeatureAccess(tenant?.id);
  const accessibleModules = getAccessibleModules(allowedViews);

  useEffect(() => {
    applyMedflowTheme(theme);
    localStorage.setItem('medflow-theme', theme);
  }, [theme]);

  return (
    <div className="app-root transition-colors duration-500" style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex' }}>
      {/* MOBILE BACKDROP & DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <nav className="relative w-72 max-w-[85vw] h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-white/20 dark:border-slate-800 shadow-2xl overflow-hidden shadow-teal-900/20">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg flex items-center justify-center border border-white/20">
                  <img src="/medflow-icon-white.svg" alt="MedFlow" width="20" height="20" />
                </div>
                <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-tight">{tenant?.name || "MedFlow EMR"}</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {accessibleModules.map((module) => {
                if (!moduleMeta[module]) return null;
                return (
                  <ModuleGate key={module} module={module} tenantId={tenant?.id}>
                    <button
                      className={`flex items-center gap-4 w-full p-3.5 rounded-2xl font-semibold text-sm transition-all ${view === module ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 Pshadow-sm ring-1 ring-teal-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      onClick={() => {
                        setView(module);
                        setMobileOpen(false);
                      }}
                    >
                      <span className={`w-5 h-5 ${view === module ? 'text-teal-600 dark:text-teal-400' : 'opacity-70'}`}>{navIcons[module]}</span>
                      {moduleMeta[module].title}
                    </button>
                  </ModuleGate>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="premium-sidebar">
        <div className="sidebar-header border-b border-white/5 bg-black/10">
          <div className="brand-logo flex items-center gap-3 text-white">
            <div className="brand-icon w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 shadow-lg shadow-teal-900/30 border border-white/20 flex items-center justify-center">
              <img src="/medflow-icon-white.svg" alt="MedFlow" width="22" height="22" />
            </div>
            <span className="font-extrabold tracking-tight text-[1.15rem] leading-none text-white drop-shadow-sm">{tenant?.name || "MedFlow"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {accessibleModules.map((module) => {
            if (!moduleMeta[module]) return null;
            return (
              <ModuleGate key={module} module={module} tenantId={tenant?.id}>
                <button
                  className={`nav-item ${view === module ? 'active' : ''}`}
                  onClick={() => {
                    setView(module);
                    setMobileOpen(false);
                  }}
                >
                  <span className="nav-icon">{navIcons[module]}</span>
                  {moduleMeta[module].title}
                </button>
              </ModuleGate>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-section">
            <div className="user-avatar">{activeUser?.name?.[0] || "U"}</div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate text-[var(--text-main)]">{activeUser?.name}</div>
              <div className="text-xs text-muted truncate">{activeUser?.role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn sidebar-signout">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

          {/* MAIN CONTENT */}
      <div className="main-content" style={{ backgroundColor: 'var(--bg-app)' }}>
        <header className="premium-header backdrop-blur-md sticky top-0 z-40 border-b border-[rgba(255,255,255,0.1)] shadow-sm"
                style={{ backgroundColor: `rgba(var(--bg-header-rgb, 15, 23, 42), 0.85)` }}>
          <div className="header-shell h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 -ml-2 premium-header-icon-btn rounded-lg" onClick={() => setMobileOpen(true)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="header-title">
                <h1 className="text-xl premium-header-title">{moduleMeta[view]?.title || 'Dashboard'}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* THEME SWITCHER - Refined grouped buttons */}
              <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setTheme(THEMES.HEALING_TEAL)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${theme === THEMES.HEALING_TEAL ? 'theme-btn theme-teal' : 'text-white/60 hover:text-white/90'}`}
                  title="Healing Teal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12h6l3-6 3 12 3-6h3" /></svg>
                </button>
                <button 
                  onClick={() => setTheme(THEMES.TRUST_BLUE)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${theme === THEMES.TRUST_BLUE ? 'theme-btn theme-blue' : 'text-white/60 hover:text-white/90'}`}
                  title="Trust Blue"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3l8 4v6c0 4.4-3.2 7.8-8 9-4.8-1.2-8-4.6-8-9V7l8-4z" /></svg>
                </button>
                <button 
                  onClick={() => setTheme(THEMES.MEDICAL_SLATE)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${theme === THEMES.MEDICAL_SLATE ? 'theme-btn theme-slate' : 'text-white/60 hover:text-white/90'}`}
                  title="Medical Slate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7h16M4 12h16M4 17h16" /></svg>
                </button>
              </div>

              <button onClick={() => setShowHelp(true)} className="px-3 py-2 rounded-xl text-xs uppercase tracking-wider premium-header-help-btn transition-all">Help Center</button>
              <div className="px-3 py-1.5 rounded-pill text-[10px] uppercase tracking-tighter premium-header-live-badge flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full"></span>
                System Live
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="content-shell">
            <div className="m-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          </div>
        )}

        <div className="view-container">
          <div className="content-shell">{children}</div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="premium-modal rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 premium-modal-header flex justify-between items-center">
              <h3 className="font-bold text-lg">Help Guide</h3>
              <button onClick={() => setShowHelp(false)} className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto prose prose-slate premium-modal-body">
              <div dangerouslySetInnerHTML={{ __html: helpContent[activeUser?.role] || helpContent.default }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
