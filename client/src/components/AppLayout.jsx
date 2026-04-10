import { useMemo, useState } from "react";
import { moduleMeta } from "../config/modules.js";
import { BRAND } from "../config/branding.js";

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
  TestTube,
  UserCircle,
  Users,
  Bed,
  Truck,
  MessageSquare,
  BookOpen,
  Zap,
  Droplet,
  Building2,
  Database,
  Megaphone,
  CreditCard,
} from "lucide-react";

import { ActionMenu, NotificationSystem, SmartSearch } from "./UXEnhanced.jsx";
import "../styles/critical-care.css";

/* ─── NAV ICONS ──────────────────────────────────────────────────── */
const navIcons = {
  superadmin: ShieldCheck,
  tenant_management: Grid2X2,
  user_provisioning: UserCircle,
  financial_control: Receipt,
  dashboard: LayoutDashboard,
  doctor_workspace: HeartPulse,
  users: UserCircle,
  tenants: Grid2X2,
  support: Settings,
  patients: Users,
  appointments: Calendar,
  find_doctor: Stethoscope,
  doctor_availability: Calendar,
  emr: Stethoscope,
  inpatient: Bed,
  pharmacy: Pill,
  billing: Receipt,
  insurance: ShieldCheck,
  inventory: Package,
  employees: UserCircle,
  accounts: FileText,
  reports: Activity,
  lab_availability: TestTube,
  admin: Database,
  lab: FlaskConical,
  communication: Bell,
  documents: FileText,
  ambulance: Truck,
  service_catalog: BookOpen,
  ai_vision: Zap,
  donor: Droplet,
  chat: MessageSquare,
  employee_master: UserCircle,
  attendance: Calendar,
  payroll: Receipt,
  accounts_receivable: FileText,
  accounts_payable: FileText,
  departments: Building2,
  bed_management: Bed,
  hospital_settings: Settings,
  admin_masters: Database,
  subscription_mgmt: CreditCard,
  ad_manager: Zap,
};

/* ─── SIDEBAR GROUP DEFINITIONS ──────────────────────────────────── */
const SIDEBAR_GROUPS_DEFAULT = [
  { name: "Hospital Summary", modules: ["dashboard", "reports"] },
  { name: "Patient Desk", modules: ["patients", "appointments", "find_doctor", "doctor_availability"] },
  { name: "Lab & Test Services", modules: ["lab", "lab_availability", "ai_vision"] },
  { name: "Bed & Patient Care", modules: ["emr", "inpatient", "bed_management"] },
  { name: "Medicine & Stock", modules: ["pharmacy", "inventory"] },
  { name: "Billing & Payments", modules: ["billing", "accounts_receivable", "insurance", "accounts", "accounts_payable"] },
  { name: "Staff & Office", modules: ["admin", "users", "employees", "employee_master", "attendance", "payroll"] },
  { name: "Hospital Settings", modules: ["hospital_settings", "departments", "admin_masters"] },
  { name: "Help & Messages", modules: ["support", "communication", "documents", "chat"] },
  { name: "Ambulance & Emergency", modules: ["ambulance", "donor"] },
  { name: "Service List & Rates", modules: ["service_catalog"] },
];

const SIDEBAR_GROUPS_DOCTOR = [
  { name: "My Workspace", modules: ["doctor_workspace", "find_doctor", "doctor_availability"] },
  { name: "Patient Care", modules: ["patients", "appointments", "emr", "inpatient"] },
  { name: "Diagnostics", modules: ["lab", "lab_availability", "ai_vision"] },
  { name: "Emergency", modules: ["ambulance"] },
  { name: "Communication", modules: ["communication", "documents"] },
];

function getSidebarGroups(role) {
  const r = (role || "").toLowerCase();
  if (r === "doctor") return SIDEBAR_GROUPS_DOCTOR;
  if (r === "superadmin") {
    return [
      { name: "Intelligence", modules: ["superadmin"] },
      { name: "Payments & Plans", modules: ["subscription_mgmt"] },
      { name: "Hospitals List", modules: ["tenant_management"] },
      { name: "Server Health", modules: ["infra_health"] },
      { name: "Daily Accounts", modules: ["financial_control"] },
      { name: "Notices & Messages", modules: ["communication"] },
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
  const [open, setOpen] = useState(true);

  if (visibleModules.length === 0) return null;

  return (
    <div className="mb-1">
      {!sidebarCollapsed && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="
            w-full flex items-center justify-between
            px-3 py-2 rounded-lg
            text-[11px] font-black uppercase tracking-[0.18em]
            text-white/40 hover:text-white/70
            hover:bg-[var(--clinical-primary)]/15
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

      <div
        className={`
          overflow-hidden transition-all duration-200 ease-in-out
          ${sidebarCollapsed ? "block" : open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className={`space-y-0.5 ${!sidebarCollapsed && open ? "pt-1 pb-2" : ""}`}>
          {visibleModules.map((moduleName) => {
            const Icon = navIcons[moduleName] || LayoutDashboard;
            const moduleInfo = moduleMeta[moduleName];
            const isActive = view === moduleName;

            return (
              <button
                key={moduleName}
                onClick={() => {
                  setView(moduleName);
                  setMobileOpen(false);
                }}
                title={sidebarCollapsed ? moduleInfo?.title || moduleName : ""}
                className={`
                  w-full flex items-center gap-3 rounded-xl transition-all duration-150 group relative
                  ${sidebarCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2.5"}
                  ${
                    isActive
                      ? "bg-[var(--clinical-secondary)] text-white shadow-lg shadow-[var(--clinical-secondary)]/20"
                      : "text-white/50 hover:bg-[var(--clinical-primary)]/20 hover:text-white hover:shadow-md"
                  }
                `}
              >
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

      {!sidebarCollapsed && open && <div className="mx-3 border-b border-white/[0.05] mt-1" />}
    </div>
  );
}

/* ─── MAIN LAYOUT ────────────────────────────────────────────────── */
export default function AppLayout({
  tenant,
  activeUser,
  allowedViews,
  view,
  setView,
  onLogout,
  children,
  error,
  patients = [],
  appointments = [],
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const facilityName = tenant?.name || `${BRAND.name} Care Platform`;
  const isDoctor = (activeUser?.role || "").toLowerCase() === "doctor";
  const currentModule =
    view === "doctor_workspace"
      ? "My Schedule"
      : moduleMeta[view]?.title || "Clinical Workspace";

  const effectiveAccessibleModules = useMemo(() => {
    if (isDoctor && !allowedViews.includes("doctor_workspace")) {
      return ["doctor_workspace", ...allowedViews];
    }
    return allowedViews;
  }, [isDoctor, allowedViews]);

  const sidebarGroups = useMemo(() => getSidebarGroups(activeUser?.role), [activeUser?.role]);

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
    if (result?.type === "nav") {
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

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[var(--medical-navy)] border-r border-white/[0.05] shadow-2xl">
      <div className={`flex items-center border-b border-white/[0.06] ${sidebarCollapsed ? "justify-center p-4" : "justify-between px-5 py-4"}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {tenant?.logo_url ? (
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-lg flex-shrink-0">
                <img src={tenant.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--clinical-secondary)] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Activity size={16} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-[13px] font-black tracking-tight text-white uppercase leading-none" style={{ color: '#ffffff' }}>
                {BRAND.name}
              </h1>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest truncate mt-0.5" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                {facilityName}
              </p>
            </div>
          </div>
        )}

        {sidebarCollapsed &&
          (tenant?.logo_url ? (
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-lg">
              <img src={tenant.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--clinical-secondary)] flex items-center justify-center text-white">
              <Activity size={16} />
            </div>
          ))}

        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-white/30 hover:text-white transition-all"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {sidebarGroups.map((group) => {
          const visibleModules = group.modules.filter((m) => effectiveAccessibleModules.includes(m));
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
    <div className="flex h-screen bg-[#EFF5FA] overflow-hidden">
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[100]
          bg-[var(--medical-navy-light)] flex-shrink-0
          transition-all duration-300 ease-in-out h-full
          ${sidebarCollapsed ? "w-[60px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {SidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-500 rounded-lg hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-800">{BRAND.name}</span>
          <div className="w-9" />
        </div>

        <header className="flex-shrink-0 bg-white border-b border-[rgba(0,119,182,0.12)] px-6 h-16 flex items-center justify-between shadow-sm shadow-[rgba(0,119,182,0.04)]">
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
                  Hospital Control Room
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-[var(--clinical-secondary)]/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-700 leading-none bg-[var(--clinical-secondary)]/8 px-1.5 py-0.5 rounded-md">
                  {facilityName}
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-[var(--clinical-secondary)]/20" />
                <span className="text-[8px] font-bold text-slate-400 leading-none uppercase tracking-widest">{today}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center pr-4 border-r border-slate-100">
              <img src="/healthezee-logo.png" alt="Healthezee Logo" className="h-7 w-auto object-contain" />
            </div>

            <div className="hidden lg:block w-64">
              <SmartSearch
                onSearch={handleSearchResult}
                placeholder="Search patients, records..."
                patients={patients}
                appointments={appointments}
              />
            </div>
            <div className="lg:hidden w-full max-w-xs">
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
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--clinical-secondary)]/10 text-[var(--clinical-secondary)] flex items-center justify-center font-black text-[10px] border border-[var(--clinical-secondary)]/20 uppercase shadow-sm">
                    {(activeUser?.name || "A").charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              }
              actions={[
                { label: "My Clinical Profile", onClick: () => setView("doctor_workspace") },
                { label: "System Preferences", onClick: () => setView("admin") },
                { label: "Sign Out Session", onClick: onLogout },
              ]}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 lg:p-8 bg-[#EFF5FA]">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden"
        />
      )}
    </div>
  );
}
