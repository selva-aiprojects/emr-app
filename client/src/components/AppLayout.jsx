import { useMemo, useRef, useState } from "react";
import { moduleMeta } from "../config/modules.js";
import { BRAND } from "../config/branding.js";
import { helpContent } from "../config/helpContent.js";
import { ModuleGate, useFeatureAccess } from "./FeatureGate.jsx";
import {
  Activity,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Grid2X2,
  HelpCircle,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Pill,
  Receipt,
  Search,
  Settings,
  Settings2,
  ShieldCheck,
  Stethoscope,
  User,
  UserCircle,
  Users,
  X,
  Bed
} from "lucide-react";
import { ActionMenu, NotificationSystem, SmartSearch, StatusIndicator } from "./UXEnhanced.jsx";
import "../styles/critical-care.css";


const navIcons = {
  superadmin: ShieldCheck,
  dashboard: LayoutDashboard,
  users: UserCircle,
  tenants: Grid2X2,
  ticketing: Bell,
  patients: Users,
  appointments: Calendar,
  emr: History,
  inpatient: Bed,
  pharmacy: Pill,
  billing: Receipt,
  insurance: ShieldCheck,
  inventory: Package,
  employees: UserCircle,
  accounts: FileText,
  reports: Activity,
  admin: Settings,
  lab: FlaskConical
};

const moduleDescriptions = {
  dashboard: "Operational overview and care activity",
  users: "Clinical workspace",
  patients: "Registration, search, demographics, and patient context",
  appointments: "Scheduling, walk-ins, and provider calendars",
  emr: "Clinical documentation, history, and treatment notes",
  inpatient: "Bed management and admitted patient flow",
  pharmacy: "Medication orders, dispensing, and stock visibility",
  billing: "Invoices, collections, and payment reconciliation",
  insurance: "Payers, claims, and coverage workflows",
  inventory: "Clinical supplies, reorder levels, and availability",
  employees: "Staff records, shifts, leave, and attendance",
  accounts: "Financial documentation and ledger review",
  reports: "Utilization, revenue, and performance insights",
  admin: "Facility settings, users, and access controls",
  lab: "Orders, samples, and result tracking",
  superadmin: "Platform Hub",
  tenants: "Multi-tenant Governance",
  support: "Support Channels",
  ticketing: "Issue Resolution"
};

function formatRole(role) {
  if (!role) return "Clinical User";
  return role.replace(/_/g, " ");
}

export default function AppLayout({ tenant, activeUser, allowedViews, view, setView, onLogout, children, error }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null);
  const [showMoreModules, setShowMoreModules] = useState(false);
  const { getAccessibleModules } = useFeatureAccess(tenant?.id);
  const accessibleModules = getAccessibleModules(allowedViews);
  const searchInputRef = useRef(null);

  const facilityName = tenant?.name || `${BRAND.name} Care Platform`;
  const currentModule = moduleMeta[view]?.title || "Clinical Workspace";
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
    []
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="premium-card max-w-lg w-full p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--danger)]">Application Notice</p>
                <h2 className="text-2xl font-extrabold text-[var(--text-strong)]">Unable to load the workspace shell</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Refresh workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSearchResult = (result) => {
    const targetViewByType = {
      patient: "patients",
      appointment: "appointments",
      medication: allowedViews.includes("pharmacy") ? "pharmacy" : "emr"
    };

    const targetView = targetViewByType[result?.type];
    if (targetView && allowedViews.includes(targetView)) {
      setView(targetView);
    }
  };

  const focusGlobalSearch = () => {
    searchInputRef.current?.focus();
  };

  const openSettings = () => {
    const target = allowedViews.includes("admin")
      ? "admin"
      : allowedViews.includes("employees")
        ? "employees"
        : allowedViews.includes("dashboard")
          ? "dashboard"
          : allowedViews[0];

    if (target) {
      setView(target);
    }
  };

  const roleHelp = helpContent[activeUser?.role] || helpContent.default;

  const handleLogout = () => {
    onLogout();
  };

  const navContent = (
    <>
      {/* Sidebar Header / Brand */}
      <div className={`sidebar-header ${isCollapsed ? 'is-collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img src="/medflow-icon.svg" alt="" className="brand-icon" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <h1 className="brand-name">{BRAND.name}</h1>
              <div className="brand-subtitle">{facilityName}</div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight className={`sidebar-collapse-icon ${isCollapsed ? '' : 'rotated'}`} size={16} />
        </button>
      </div>

      {/* Tenant Context Chip (kept minimal; brand already shows facility) */}
      <div className={`tenant-chip ${isCollapsed ? 'is-collapsed' : ''}`}>
        {!isCollapsed ? (
          <span className="tenant-chip-text">{currentModule}</span>
        ) : (
          <span className="tenant-chip-dot" aria-hidden="true" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {/* Main Navigation Group */}
        <div className="nav-group">
          <div className="menu-divider">
            <span>{!isCollapsed && "Main"}</span>
          </div>
          {accessibleModules.slice(0, 5).map((moduleName) => {
            const Icon = navIcons[moduleName] || LayoutDashboard;
            const moduleInfo = moduleMeta[moduleName];
            return (
              <button
                key={moduleName}
                onClick={() => {
                  setView(moduleName);
                  setMobileOpen(false);
                }}
                className={`menu-item ${view === moduleName ? 'active' : ''}`}
                title={isCollapsed ? moduleInfo?.title || moduleName : ''}
              >
                <Icon size={19} />
                {!isCollapsed && (
                  <span className="nav-label">{moduleInfo?.title || moduleName}</span>
                )}
                {view === moduleName && !isCollapsed && (
                  <div
                    className="active-dot"
                    style={{
                      marginLeft: 'auto',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--clinical-blue)',
                      boxShadow: '0 0 8px var(--clinical-blue)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* More Navigation Group */}
        {accessibleModules.length > 5 && (
          <div className="nav-group">
            <div className="menu-divider">
              <span>{!isCollapsed && "More"}</span>
            </div>
            {accessibleModules.slice(5).map((moduleName) => {
              const Icon = navIcons[moduleName] || LayoutDashboard;
              const moduleInfo = moduleMeta[moduleName];
              return (
                <button
                  key={moduleName}
                  onClick={() => {
                    setView(moduleName);
                    setMobileOpen(false);
                  }}
                  className={`menu-item ${view === moduleName ? 'active' : ''}`}
                  title={isCollapsed ? moduleInfo?.title || moduleName : ''}
                >
                  <Icon size={19} />
                  {!isCollapsed && (
                    <span className="nav-label">{moduleInfo?.title || moduleName}</span>
                  )}
                  {view === moduleName && !isCollapsed && (
                    <div
                      className="active-dot"
                      style={{
                        marginLeft: 'auto',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                      background: 'var(--clinical-blue)',
                      boxShadow: '0 0 8px var(--clinical-blue)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div style={{
        padding: '24px 16px',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar" style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
               background: 'linear-gradient(135deg, var(--medical-navy), var(--clinical-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {(activeUser?.name || 'U').charAt(0).toUpperCase()}
            </div>

            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{activeUser?.name || 'User'}</span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formatRole(activeUser?.role)}</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              marginTop: '16px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="app-root">
      {/* Dark Sidebar */}
      <aside className={`premium-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        {navContent}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="top-header">
          <div>
            <h1 className="header-title">{currentModule}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
              <span className="hidden sm:inline">{facilityName}</span>
              <span className="hidden sm:inline">•</span>
              <span>{today}</span>
              {activeUser?.role && (
                <>
                  <span>•</span>
                  <StatusIndicator label={formatRole(activeUser.role)} tone="default" />
                </>
              )}
            </div>
          </div>
          <div className="header-actions">
            <SmartSearch
              placeholder="Search patients, visits, medications"
              onSearch={handleSearchResult}
              inputRef={searchInputRef}
            />
            <NotificationSystem />
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {error ? (
            <div className="flex items-start gap-4 p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-red-600">Application Notice</p>
                  <h2 className="text-2xl font-extrabold text-gray-900">Unable to load workspace shell</h2>
                </div>
                <p className="text-sm text-gray-600">{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                  Refresh workspace
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden fixed top-3 left-4 z-[110] p-2.5 bg-white rounded-xl shadow-xl border border-gray-100 transition-all hover:bg-gray-50 active:scale-95"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
              </button>

              {/* Sidebar Backdrop */}
              {mobileOpen && (
                <div 
                  className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-[2px] lg:hidden animate-fade-in"
                  onClick={() => setMobileOpen(false)}
                />
              )}

              {/* Page Content */}
              {children}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
