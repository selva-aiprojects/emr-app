import { useMemo, useRef, useState } from "react";
import { moduleMeta } from "../config/modules.js";
import { helpContent } from "../config/helpContent.js";
import { ModuleGate, useFeatureAccess } from "./FeatureGate.jsx";
import {
  Activity,
  Bell,
  Calendar,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Grid2X2,
  HelpCircle,
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

const navIcons = {
  superadmin: <ShieldCheck className="w-5 h-5" />,
  dashboard: <LayoutDashboard className="w-5 h-5" />,
  users: <UserCircle className="w-5 h-5" />,
  patients: <Users className="w-5 h-5" />,
  appointments: <Calendar className="w-5 h-5" />,
  emr: <History className="w-5 h-5" />,
  inpatient: <Bed className="w-5 h-5" />,
  pharmacy: <Pill className="w-5 h-5" />,
  billing: <Receipt className="w-5 h-5" />,
  insurance: <ShieldCheck className="w-5 h-5" />,
  inventory: <Package className="w-5 h-5" />,
  employees: <UserCircle className="w-5 h-5" />,
  accounts: <FileText className="w-5 h-5" />,
  reports: <Activity className="w-5 h-5" />,
  admin: <Settings className="w-5 h-5" />,
  lab: <FlaskConical className="w-5 h-5" />
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
  superadmin: "Platform governance and multi-tenant administration",
  support: "Operational support and issue management"
};

function formatRole(role) {
  if (!role) return "Clinical User";
  return role.replace(/_/g, " ");
}

export default function AppLayout({ tenant, activeUser, allowedViews, view, setView, onLogout, children, error }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null);
  const { getAccessibleModules } = useFeatureAccess(tenant?.id);
  const accessibleModules = getAccessibleModules(allowedViews);
  const searchInputRef = useRef(null);

  const facilityName = tenant?.name || "MedFlow Care Platform";
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

  const navContent = (
    <>
      <div className="sidebar-header">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/12 border border-white/12 flex items-center justify-center shadow-lg">
            <Stethoscope className="w-6 h-6 text-cyan-100" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70 font-extrabold">Healthcare EMR</p>
            <h1 className="text-lg font-extrabold text-white leading-tight truncate">{facilityName}</h1>
            <p className="text-xs text-cyan-50/68 mt-1">Clinical operations, patient records, and service coordination</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="mb-4 px-2">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Grid2X2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60 font-bold">Current module</p>
                <p className="text-sm font-bold">{currentModule}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-cyan-50/72">
              {moduleDescriptions[view] || "Patient-safe workflows organized for fast clinical access."}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {accessibleModules.map((module) => {
            const isActive = view === module;

            return (
              <ModuleGate key={module} module={module} tenantId={tenant?.id}>
                <button
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setView(module);
                    setMobileOpen(false);
                  }}
                >
                  <span className="shrink-0">{navIcons[module]}</span>
                  <span className="flex-1 text-left min-w-0">
                    <span className="block font-semibold truncate">{moduleMeta[module]?.title || module}</span>
                    <span className="block text-xs opacity-75 truncate">{moduleDescriptions[module] || "Clinical workspace"}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "translate-x-0.5" : ""}`} />
                </button>
              </ModuleGate>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/14 flex items-center justify-center text-white font-extrabold shrink-0">
              {activeUser?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{activeUser?.name || "Clinical User"}</div>
              <div className="text-xs text-cyan-100/68 truncate capitalize">{formatRole(activeUser?.role)}</div>
            </div>
            <ActionMenu
              className="shrink-0"
              trigger={
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/8 flex items-center justify-center text-white/90">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              }
              actions={[
                { icon: User, label: "Profile", onClick: () => setActiveDialog("profile") },
                { icon: Settings2, label: "Settings", onClick: openSettings },
                { icon: Search, label: "Global Search", onClick: focusGlobalSearch },
                { icon: HelpCircle, label: "Help", onClick: () => setActiveDialog("help") },
                { icon: LogOut, label: "Sign Out", onClick: onLogout }
              ]}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveDialog("profile")}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/8 px-1.5 py-1.5 text-xs font-medium text-white/75 hover:bg-white/12 transition-colors"
            >
              <User className="w-2.5 h-2.5" />
              Profile
            </button>
            <button
              onClick={openSettings}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/8 px-1.5 py-1.5 text-xs font-medium text-white/75 hover:bg-white/12 transition-colors"
            >
              <Settings2 className="w-2.5 h-2.5" />
              Settings
            </button>
            <button
              onClick={() => setActiveDialog("help")}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/8 px-1.5 py-1.5 text-xs font-medium text-white/75 hover:bg-white/12 transition-colors"
            >
              <HelpCircle className="w-2.5 h-2.5" />
              Help
            </button>
          </div>
          <button onClick={onLogout} className="btn mt-4 w-full !bg-white/10 !text-white !border-white/10 hover:!bg-white/16">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-root">
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-0" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[min(86vw,312px)] h-full premium-sidebar open">
            <div className="absolute right-3 top-3 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      <aside className="premium-sidebar hidden lg:flex">{navContent}</aside>

      <div className="main-content">
        <header className="premium-header">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-4 min-w-0">
              <button
                className="lg:hidden w-11 h-11 rounded-2xl border border-[var(--border)] bg-white/80 text-[var(--text-main)] flex items-center justify-center"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-soft)] font-extrabold">Clinical Workspace</p>
                <h2 className="text-2xl font-extrabold text-[var(--text-strong)] truncate">{currentModule}</h2>
                <p className="text-sm text-[var(--text-muted)] truncate">
                  {moduleDescriptions[view] || "Efficient, patient-safe workflows for the care team."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 xl:gap-3 min-w-0">
              <div className="hidden xl:flex items-stretch gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 shadow-sm shrink-0">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)] font-bold">System readiness</p>
                    <p className="text-sm font-bold leading-5 text-[var(--text-main)]">Care services available</p>
                  </div>
                </div>
                <div className="w-px self-stretch bg-[var(--border)]" />
                <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs min-w-[220px] content-center">
                  <div className="min-w-[96px]">
                    <div className="text-[var(--text-soft)]">Date</div>
                    <div className="font-semibold leading-5 text-[var(--text-main)] mt-1 whitespace-normal break-words">{today}</div>
                  </div>
                  <div className="min-w-[72px]">
                    <div className="text-[var(--text-soft)]">Role</div>
                    <div className="font-semibold leading-5 text-[var(--text-main)] mt-1 capitalize whitespace-normal break-words">{formatRole(activeUser?.role)}</div>
                  </div>
                </div>
              </div>

              <SmartSearch
                placeholder="Search patient, MRN, provider, or record"
                onSearch={handleSearchResult}
                inputRef={searchInputRef}
                className="hidden md:block flex-1 min-w-[220px] max-w-[380px] xl:max-w-[440px]"
              />

              <button
                onClick={() => searchInputRef.current?.focus()}
                className="hidden lg:flex p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0"
                title="Global Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="hidden sm:block">
                <NotificationSystem />
              </div>

              <button
                onClick={() => setActiveDialog("help")}
                className="hidden lg:flex p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-5.5 h-5.5" />
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="px-7 pt-6">
            <div className="premium-card border-[var(--danger)]/20 bg-[var(--danger-soft)] px-5 py-4">
              <div className="flex items-center gap-3 text-[var(--danger)]">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          </div>
        )}

        <main className="view-container">
          <div className="animate-slide-up">{children}</div>
        </main>
      </div>

      {activeDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setActiveDialog(null)} />
          <div className="relative premium-card w-full max-w-2xl p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-soft)] font-extrabold">
                  {activeDialog === "profile" ? "User Profile" : "Help Center"}
                </p>
                <h3 className="text-2xl font-extrabold text-[var(--text-strong)] mt-2">
                  {activeDialog === "profile" ? (activeUser?.name || "Clinical User") : `${currentModule} guidance`}
                </h3>
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="w-10 h-10 rounded-2xl border border-[var(--border)] bg-white flex items-center justify-center text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeDialog === "profile" ? (
              <div className="grid gap-4 md:grid-cols-2 mt-6">
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-soft)] font-bold">Name</p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-strong)]">{activeUser?.name || "Clinical User"}</p>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-soft)] font-bold">Role</p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-strong)] capitalize">{formatRole(activeUser?.role)}</p>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-soft)] font-bold">Facility</p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-strong)]">{facilityName}</p>
                </div>
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-soft)] font-bold">Current Module</p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-strong)]">{currentModule}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-5 text-[var(--text-main)] leading-7 [&_h3]:text-xl [&_h3]:font-extrabold [&_h3]:text-[var(--text-strong)] [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:text-[var(--text-main)]"
                dangerouslySetInnerHTML={{ __html: roleHelp }}
              />
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              {activeDialog === "help" && (
                <button
                  onClick={() => {
                    setActiveDialog(null);
                    focusGlobalSearch();
                  }}
                  className="btn btn-secondary"
                >
                  <Search className="w-4 h-4" />
                  Search records
                </button>
              )}
              <button onClick={() => setActiveDialog(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
