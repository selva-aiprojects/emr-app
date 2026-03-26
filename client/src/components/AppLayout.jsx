import { useMemo, useRef, useState } from "react";
import { moduleMeta } from "../config/modules.js";
import { BRAND } from "../config/branding.js";
import { useFeatureAccess } from "./FeatureGate.jsx";
import {
  Activity,
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Grid2X2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pill,
  Receipt,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCircle,
  Users,
  Bed,
  Truck,
  BookOpen,
  Zap,
  Droplet,
  MessageSquare
} from "lucide-react";
import { ActionMenu, NotificationSystem, SmartSearch } from "./UXEnhanced.jsx";
import "../styles/critical-care.css";

/* ─── NAV ICONS ──────────────────────────────────────────────────── */
const navIcons = {
  superadmin: ShieldCheck,
  dashboard: LayoutDashboard,
  doctor_workspace: HeartPulse,
  users: UserCircle,
  tenants: Grid2X2,
  ticketing: Bell,
  patients: Users,
  appointments: Calendar,
  emr: Stethoscope,
  inpatient: Bed,
  pharmacy: Pill,
  billing: Receipt,
  insurance: ShieldCheck,
  inventory: Package,
  employees: UserCircle,
  accounts: FileText,
  reports: Activity,
  admin: Settings,
  lab: FlaskConical,
  communication: Bell,
  documents: FileText,
  ambulance: Truck,
  service_catalog: BookOpen,
  ai_vision: Zap,
  superadmin: ShieldCheck,
  donor: Droplet,
  chat: MessageSquare
};

/* ─── SIDEBAR GROUP DEFINITIONS ──────────────────────────────────── */
const SIDEBAR_GROUPS_DEFAULT = [
  { name: "Hospital Monitoring",  modules: ["dashboard", "reports"] },
  { name: "Front Office Desk",    modules: ["patients", "appointments", "ambulance"] },
  { name: "Clinical Excellence",  modules: ["emr", "lab", "inpatient", "ai_vision", "donor"] },
  { name: "Pharmacy & Stores",    modules: ["pharmacy", "inventory"] },
  { name: "Revenue Cycle",        modules: ["service_catalog", "billing", "insurance", "accounts"] },
  { name: "HR & Admin Control",   modules: ["employees", "users", "admin"] },
  { name: "Notice & Helpdesk",    modules: ["communication", "documents", "ticketing", "chat"] },
];

const SIDEBAR_GROUPS_DOCTOR = [
  { name: "My Workspace", modules: ["doctor_workspace", "appointments", "ambulance", "ai_vision"] },
  { name: "Clinical Hub", modules: ["patients", "emr", "lab", "inpatient"] },
  { name: "Pharmacy",     modules: ["pharmacy"] },
  { name: "Communication",modules: ["communication", "documents"] },
];

function getSidebarGroups(role) {
  const r = (role || "").toLowerCase();
  if (r === "doctor") return SIDEBAR_GROUPS_DOCTOR;
  if (r === "superadmin") {
    return [
      { name: "Platform Control", modules: ["superadmin"] },
      ...SIDEBAR_GROUPS_DEFAULT
    ];
  }
  return SIDEBAR_GROUPS_DEFAULT;
}

function formatRole(role) {
  if (!role) return "Clinical User";
  return role.replace(/_/g, " ");
}

/* ─── COLLAPSIBLE GROUP COMPONENT ────────────────────────────────── */
function NavGroup({ group, visibleModules, view, setView, setMobileOpen, sidebarCollapsed }) {
  // By default all groups start open
  const [open, setOpen] = useState(true);

  if (visibleModules.length === 0) return null;

  return (
    <div className="mb-1">
      {/* Group header — always shown; clicking toggles expand/collapse */}
      {!sidebarCollapsed && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="
            w-full flex items-center justify-between
            px-3 py-2 rounded-lg
            text-[11px] font-black uppercase tracking-[0.18em]
            text-white/30 hover:text-white/50
            hover:bg-white/[0.04]
            transition-all duration-150 select-none
            group
          "
        >
          <span>{group.name}</span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
      )}

      {/* Items — hidden when group is collapsed OR sidebar is icon-only */}
      <div
        className={`
          overflow-hidden transition-all duration-200 ease-in-out
          ${sidebarCollapsed ? "block" : open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}
        `}
        style={!sidebarCollapsed ? {} : undefined}
      >
        <div className={`space-y-0.5 ${!sidebarCollapsed && open ? "pt-1 pb-2" : ""}`}>
          {visibleModules.map((moduleName) => {
            const Icon = navIcons[moduleName] || LayoutDashboard;
            const moduleInfo = moduleMeta[moduleName];
            const isActive = view === moduleName;

            return (
              <button
                key={moduleName}
                onClick={() => { setView(moduleName); setMobileOpen(false); }}
                title={sidebarCollapsed ? moduleInfo?.title || moduleName : ""}
                className={`
                  w-full flex items-center gap-3 rounded-xl transition-all duration-150 group relative
                  ${sidebarCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2.5"}
                  ${isActive
                    ? "bg-[var(--clinical-secondary)] text-white shadow-lg shadow-[var(--clinical-secondary)]/20"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                  }
                `}
              >
                {/* Active indicator stripe */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                )}

                <Icon
                  size={16}
                  className={`flex-shrink-0 ${isActive ? "opacity-100" : "opacity-50 group-hover:opacity-90"} transition-opacity`}
                />

                {!sidebarCollapsed && (
                  <div className="flex flex-col items-start leading-none min-w-0">
                    <span className="text-xs font-semibold tracking-tight truncate">
                      {moduleInfo?.title || moduleName}
                    </span>
                    {moduleInfo?.subtitle && (
                      <span className="text-[10px] opacity-40 font-medium mt-0.5 truncate">
                        {moduleInfo.subtitle}
                      </span>
                    )}
                  </div>
                )}

                {isActive && !sidebarCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separator between groups (only when expanded) */}
      {!sidebarCollapsed && open && (
        <div className="mx-3 border-b border-white/[0.05] mt-1" />
      )}
    </div>
  );
}

/* ─── MAIN LAYOUT ────────────────────────────────────────────────── */
export default function AppLayout({
  tenant, activeUser, allowedViews, view, setView, onLogout, children, error,
  patients = [], appointments = []
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { getAccessibleModules } = useFeatureAccess(tenant?.id);
  const accessibleModules = getAccessibleModules(allowedViews);

  const facilityName = tenant?.name || `${BRAND.name} Care Platform`;
  const isDoctor = (activeUser?.role || "").toLowerCase() === "doctor";
  const currentModule =
    view === "doctor_workspace"
      ? "My Schedule"
      : moduleMeta[view]?.title || "Clinical Workspace";

  const effectiveAccessibleModules = useMemo(() => {
    if (isDoctor && !accessibleModules.includes("doctor_workspace")) {
      return ["doctor_workspace", ...accessibleModules];
    }
    return accessibleModules;
  }, [isDoctor, accessibleModules]);

  const sidebarGroups = useMemo(
    () => getSidebarGroups(activeUser?.role),
    [activeUser?.role]
  );

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const handleSearchResult = (result) => {
    if (result?.type === 'nav') {
      if (allowedViews.includes(result.target)) setView(result.target);
      return;
    }
    const targetViewByType = {
      patient: "patients",
      appointment: "appointments",
      medication: allowedViews.includes("pharmacy") ? "pharmacy" : "emr",
    };
    const targetView = targetViewByType[result?.type];
    if (targetView && allowedViews.includes(targetView)) setView(targetView);
  };

  /* ── Sidebar content ── */
  const SidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[var(--medical-navy)] to-[var(--medical-navy-light)] border-r border-white/[0.05] shadow-2xl">

      {/* ── HEADER ── */}
      <div className={`flex items-center border-b border-white/[0.06] ${sidebarCollapsed ? "justify-center p-4" : "justify-between px-5 py-4"}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--clinical-secondary)] flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Activity size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] font-black tracking-tight text-white uppercase leading-none">
                {BRAND.name}
              </h1>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest truncate mt-0.5">
                {facilityName}
              </p>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-[var(--clinical-secondary)] flex items-center justify-center text-white">
            <Activity size={16} />
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-white/30 hover:text-white transition-all"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {sidebarGroups.map((group) => {
          const visibleModules = group.modules.filter((m) =>
            effectiveAccessibleModules.includes(m)
          );
          return (
            <NavGroup
              key={group.name}
              group={group}
              visibleModules={visibleModules}
              view={view}
              setView={setView}
              setMobileOpen={setMobileOpen}
              sidebarCollapsed={sidebarCollapsed}
            />
          );
        })}
      </nav>

      {/* ── USER PROFILE FOOTER ── */}
      <div className={`border-t border-white/[0.06] p-3 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] transition-all ${sidebarCollapsed ? "justify-center w-10" : ""}`}>
          <div className="w-7 h-7 rounded-lg bg-[var(--clinical-secondary)]/20 border border-[var(--clinical-secondary)]/20 flex items-center justify-center text-[var(--clinical-secondary)] font-bold text-xs flex-shrink-0">
            {(activeUser?.name || "A").charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none">
                  {activeUser?.name || "Administrator"}
                </p>
                <p className="text-[10px] font-medium text-white/30 truncate leading-none uppercase tracking-widest mt-0.5">
                  {formatRole(activeUser?.role)}
                </p>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all flex-shrink-0"
              >
                <LogOut size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f0f4f8] overflow-hidden">

      {/* ── SIDEBAR (desktop static, mobile overlay) ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[100]
          bg-[var(--medical-navy)] flex-shrink-0
          transition-all duration-300 ease-in-out h-full
          ${sidebarCollapsed ? "w-[60px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {SidebarContent}
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-500 rounded-lg hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-800">{BRAND.name}</span>
          <div className="w-9" />
        </div>

        {/* Top header bar */}
        <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all hidden lg:flex"
            >
              <Menu size={18} />
            </button>
            <div className="flex flex-col justify-center">
              <h2 className="text-sm font-black tracking-tight text-slate-900 leading-none flex items-center gap-3">
                {currentModule}
                {sidebarCollapsed && (
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-201 uppercase tracking-tighter font-black animate-fade-in shadow-sm">
                    {facilityName}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--clinical-secondary)] leading-none">
                  Institutional Console
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                <span className="text-[8px] font-bold text-slate-400 leading-none uppercase tracking-widest">{today}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block w-64">
              <SmartSearch
                onSearch={handleSearchResult}
                placeholder="Search patients, records..."
                patients={patients}
                appointments={appointments}
              />
            </div>
            <NotificationSystem />
            <ActionMenu 
              trigger={
                <div className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-xl cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-[10px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] border border-indigo-100 uppercase shadow-sm">
                    {(activeUser?.name || "A").charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              }
              actions={[
                { label: 'My Clinical Profile', onClick: () => setView('doctor_workspace') },
                { label: 'System Preferences', onClick: () => setView('admin') },
                { label: 'Sign Out Session', onClick: onLogout }
              ]} 
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden"
        />
      )}
    </div>
  );
}
