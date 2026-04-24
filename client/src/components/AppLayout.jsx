import { useMemo, useState, useEffect } from "react";
import { moduleMeta } from "../config/modules.js";
import { BRAND } from "../config/branding.js";
import { menuService } from "../services/menuService.js";

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

/* ─── LUCIDE ICON MAP ───────────────────────────────────────────── */
const lucideIcons = {
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
};

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
  doctor_schedule: Calendar,
};

/* ─── SIDEBAR GROUP DEFINITIONS ──────────────────────────────────── */
const SIDEBAR_GROUPS_DEFAULT = [
  { name: "Hospital Summary", modules: ["dashboard", "reports"] },
  { name: "Patient Desk", modules: ["patients", "find_doctor", "doctor_availability"] },
  { name: "Lab & Test Services", modules: ["lab", "lab_availability", "ai_vision"] },
  { name: "Bed & Patient Care", modules: ["emr", "inpatient", "bed_management"] },
  { name: "Medicine & Stock", modules: ["pharmacy", "inventory"] },
  { name: "Billing & Finance", modules: ["billing", "accounts_receivable", "insurance", "accounts", "accounts_payable", "financial_ledger"] },
  { name: "Personnel & Payroll", modules: ["staff_management", "employees", "employee_master", "attendance", "payroll_service"] },
  { name: "Institutional Ops", modules: ["admin", "users", "hospital_settings", "departments", "admin_masters"] },
  { name: "Help & Assets", modules: ["support", "communication", "documents", "chat", "service_catalog"] },
  { name: "Ambulance & Emergency", modules: ["ambulance", "donor"] },
];

const SIDEBAR_GROUPS_DOCTOR = [
  { name: "My Workspace", modules: ["doctor_workspace", "doctor_schedule", "find_doctor", "doctor_availability"] },
  { name: "Patient Care", modules: ["patients", "emr", "inpatient"] },
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
function NavGroup({ group, visibleModules, view, setView, setMobileOpen, sidebarCollapsed, databaseMenu }) {
  const [open, setOpen] = useState(true);

  if (visibleModules.length === 0) return null;

  return (
    <div className="mb-4">
      {!sidebarCollapsed && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="
            w-full flex items-center justify-between
            px-3 py-2 rounded-lg
            text-[10px] font-black uppercase tracking-wider
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
        <div className={`space-y-1.5 ${!sidebarCollapsed && open ? "pt-2 pb-4" : ""}`}>
          {visibleModules.map((moduleName) => {
            // Try to get icon and info from database first, then fallback to hardcoded
            let Icon = LayoutDashboard;
            let moduleInfo = moduleMeta[moduleName];
            let displayName = moduleInfo?.title || moduleName;
            let subtitle = moduleInfo?.subtitle;
            
            if (databaseMenu) {
              // Find this module in database menu
              for (const header of databaseMenu) {
                const item = header.items.find(i => i.code === moduleName);
                if (item) {
                  // Use specific icon from DB, then fallback to navIcons map, then default
                  Icon = lucideIcons[item.icon_name] || navIcons[item.icon_name] || navIcons[moduleName] || LayoutDashboard;
                  displayName = item.name;
                  subtitle = item.description;
                  break;
                }
              }
            } else {
              // Fallback to hardcoded icons
              Icon = navIcons[moduleName] || LayoutDashboard;
            }
            
            const isActive = view === moduleName;

            return (
              <button
                key={moduleName}
                data-testid={`nav-${moduleName}`}
                onClick={() => {
                  // Special handling for EMR workflow navigation
                  if (moduleName === 'emr') {
                    setView(moduleName);
                    // Reset EMR to dashboard when navigating from sidebar
                    onEmrWorkflowChange?.('dashboard');
                    const event = new CustomEvent('emrWorkflowChange', { detail: 'dashboard' });
                    window.dispatchEvent(event);
                  } else if (moduleName.startsWith('emr_')) {
                    // Handle EMR workflow-specific menu items
                    setView('emr');
                    // Extract target workflow from module code
                    const targetWorkflow = moduleName.replace('emr_', '').replace('_', '-');
                    onEmrWorkflowChange?.(targetWorkflow);
                    const event = new CustomEvent('emrWorkflowChange', { detail: targetWorkflow });
                    window.dispatchEvent(event);
                  } else {
                    setView(moduleName);
                  }
                  setMobileOpen(false);
                }}
                title={sidebarCollapsed ? displayName : ""}
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
                      {displayName}
                    </span>
                    {subtitle && (
                      <span className="text-[10px] opacity-40 font-medium mt-0.5 truncate">
                        {subtitle}
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
  menuData = null, 
  onEmrWorkflowChange, // New prop
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const facilityName = tenant?.name || `${BRAND.name} Care Platform`;
  const isDoctor = (activeUser?.role || "").toLowerCase() === "doctor";
  const currentModule =
    view === "doctor_workspace"
      ? "My Schedule"
      : moduleMeta[view]?.title || "Clinical Workspace";
  
  const [databaseMenu, setDatabaseMenu] = useState(menuData);
  const [menuLoading, setMenuLoading] = useState(!menuData);

  useEffect(() => {
    if (menuData) {
      setDatabaseMenu(menuData);
      setMenuLoading(false);
    }
  }, [menuData]);

  useEffect(() => {
    const loadMenuFromDatabase = async () => {
      // If we already have menuData from bootstrap, skip the extra fetch
      if (databaseMenu && databaseMenu.length > 0) {
        setMenuLoading(false);
        return;
      }

      if (!activeUser?.role) {
        setMenuLoading(false);
        return;
      }

      try {
        const menuData = await menuService.getUserMenu();
        setDatabaseMenu(menuData);
      } catch (error) {
        console.warn('Failed to load menu from database, falling back to defaults:', error);
        setDatabaseMenu(null);
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenuFromDatabase();
  }, [activeUser?.role]);

  // Convert database menu to sidebar groups format
  const sidebarGroups = useMemo(() => {
    if (menuLoading) return [];
    
    if (databaseMenu && databaseMenu.length > 0) {
      // Use database menu
      const groups = databaseMenu.map(header => ({
        name: header.title || header.name,
        modules: header.items.map(item => item.code)
      }));

      // Ensure Doctor Desk is always visible for doctors
      const hasWorkspace = groups.some(g => g.modules.includes('doctor_workspace'));
      if (isDoctor && !hasWorkspace) {
        groups.unshift({
          name: 'My Workspace',
          modules: ['doctor_workspace']
        });
      }
      return groups;
    }
    
    // Fallback to hardcoded groups
    return getSidebarGroups(activeUser?.role);
  }, [activeUser?.role, databaseMenu, menuLoading]);

  const effectiveAccessibleModules = useMemo(() => {
    // If we have database menu, extract modules from there
    if (databaseMenu && databaseMenu.length > 0) {
      const dbModules = [];
      databaseMenu.forEach(header => {
        header.items.forEach(item => {
          dbModules.push(item.code);
        });
      });
      
      // Deduplicate modules from database
      const uniqueDbModules = [...new Set(dbModules)];
      
      // CRITICAL: Filter database modules by allowedViews to maintain RBAC consistency
      const filtered = uniqueDbModules.filter(m => allowedViews.includes(m));
      
      if (isDoctor && !filtered.includes("doctor_workspace")) {
        return ["doctor_workspace", ...filtered];
      }
      return filtered;
    }
    
    // Fallback to original logic
    if (isDoctor && !allowedViews.includes("doctor_workspace")) {
      return ["doctor_workspace", ...allowedViews];
    }
    return allowedViews;
  }, [isDoctor, allowedViews, databaseMenu]);

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
      <div className={`sidebar-header-highlight flex items-center border-b border-white/[0.06] ${sidebarCollapsed ? "justify-center p-4" : "justify-between px-5 py-4"}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-4 min-w-0">
            {tenant?.logo_url ? (
              <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-xl flex-shrink-0 animate-scale-in">
                <img src={tenant.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Activity size={20} />
              </div>
            )}
            <div className="min-w-0">
              <h1 
                className="text-[14px] font-black tracking-tight text-white uppercase leading-tight" 
                style={{ color: '#ffffff !important', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                {BRAND.name}
              </h1>
              <p 
                className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] truncate mt-1" 
                style={{ color: 'rgba(255, 255, 255, 0.9) !important', textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
              >
                {facilityName}
              </p>
            </div>
          </div>
        )}

        {sidebarCollapsed &&
          (tenant?.logo_url ? (
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-lg">
              <img src={tenant.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Activity size={18} />
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
        className="sidebar-custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5"
      >
        {sidebarGroups.map((group) => {
          const visibleModules = group.modules.filter((m) => effectiveAccessibleModules.includes(m));
          
          // Skip empty groups
          if (visibleModules.length === 0) return null;
          
          return (
            <NavGroup
              key={group.name}
              group={group}
              visibleModules={visibleModules}
              view={view}
              setView={setView}
              setMobileOpen={setMobileOpen}
              sidebarCollapsed={sidebarCollapsed}
              databaseMenu={databaseMenu}
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

        <header className="flex-shrink-0 bg-white border-b border-[rgba(0,119,182,0.12)] px-6 h-20 flex items-center justify-between shadow-sm shadow-[rgba(0,119,182,0.04)]">
          <div className="flex items-center gap-6 min-w-0 flex-shrink-0">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-3 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all hidden lg:flex flex-shrink-0"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-base lg:text-lg font-black tracking-tight text-slate-900 leading-none flex items-center gap-2 truncate">
                {currentModule}
              </h2>
              <div className="hidden sm:flex items-center gap-2 mt-2 overflow-hidden">
                <span 
                  className="text-[11px] font-black uppercase tracking-tight text-white px-3 py-1 rounded-lg shadow-md flex-shrink-0"
                  style={{ backgroundColor: tenant?.theme?.primary || '#0f5a6e' }}
                >
                  {facilityName}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none truncate opacity-60">
                  Secure Control Room
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-1 justify-end gap-3 lg:gap-10 min-w-0 ml-6 h-12">
            <div className="hidden md:block w-48 lg:w-56 flex-shrink">
              <SmartSearch
                onSearch={handleSearchResult}
                placeholder="Search resources..."
                patients={patients}
                appointments={appointments}
              />
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <NotificationSystem />
              <ActionMenu
                trigger={
                  <div className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-2xl cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-[12px] bg-[var(--clinical-secondary)]/10 text-[var(--clinical-secondary)] flex items-center justify-center font-black text-[12px] border border-[var(--clinical-secondary)]/20 uppercase shadow-sm">
                      {(activeUser?.name || "A").charAt(0)}
                    </div>
                    <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
                  </div>
                }
                actions={[
                  { label: "Settings", onClick: () => setView("admin") },
                  { label: "Sign Out", onClick: onLogout },
                ]}
              />
            </div>

            <div className="hidden md:flex items-center pl-6 border-l border-slate-100 flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300 mr-3">Powered by</span>
              <img 
                src={(() => {
                  const pColor = tenant?.theme?.primary?.toLowerCase() || '';
                  if (pColor.includes('red') || pColor.startsWith('#e') || pColor.startsWith('#f4')) return '/healthezee-logo-red.png';
                  if (pColor.includes('white') || pColor === '#ffffff' || pColor.startsWith('#f9')) return '/healthezee-logo-light.png';
                  return '/healthezee-logo-reg.png';
                })()} 
                alt="Healthezee" 
                style={{ height: '32px', maxHeight: '32px', width: 'auto', display: 'block' }}
                className="hover:scale-105 transition-transform" 
              />
            </div>
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
