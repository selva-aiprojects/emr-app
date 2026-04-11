import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useToast } from './hooks/useToast.jsx';
import { api } from './api.js';
import { fallbackPermissions } from './config/modules.js';
import { featureFlagService } from './services/featureFlag.service.js';
import AppLayout from './components/AppLayout.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import Chatbot from './components/Chatbot.jsx';
const EnhancedSuperadminPage = lazy(() => import('./pages/EnhancedSuperadminPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const DoctorWorkspacePage = lazy(() => import('./pages/DoctorWorkspacePage.jsx'));
const PatientsPage = lazy(() => import('./pages/PatientsPage.jsx'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const FindDoctorPage = lazy(() => import('./pages/FindDoctorPage.jsx'));
const DoctorAvailabilityPage = lazy(() => import('./pages/DoctorAvailabilityPage.jsx'));
const EmrPage = lazy(() => import('./pages/EmrPage.jsx'));
const BillingPage = lazy(() => import('./pages/BillingPage.jsx'));
const InsurancePage = lazy(() => import('./pages/InsurancePage.jsx'));
const InpatientPage = lazy(() => import('./pages/InpatientPage.jsx'));
const PharmacyPage = lazy(() => import('./pages/EnhancedPharmacyPage.jsx'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'));
const AccountsPage = lazy(() => import('./pages/AccountsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const UnifiedLoginPage = lazy(() => import('./pages/UnifiedLoginPage.jsx'));
const UsersPage = lazy(() => import('./pages/UsersPage.jsx'));
const LabPage = lazy(() => import('./pages/LabPage.jsx'));
const LabAvailabilityPage = lazy(() => import('./pages/LabAvailabilityPage.jsx'));
const LabTestsPage = lazy(() => import('./pages/LabTestsPage.jsx'));
const SupportPage = lazy(() => import('./pages/SupportPage.jsx'));
const CommunicationPage = lazy(() => import('./pages/CommunicationPage.jsx'));
const DocumentVaultPage = lazy(() => import('./pages/DocumentVaultPage.jsx'));
const AmbulancePage = lazy(() => import('./pages/AmbulancePage.jsx'));
const ServiceCatalogPage = lazy(() => import('./pages/ServiceCatalogPage.jsx'));
const AIImageAnalysisPage = lazy(() => import('./pages/AIImageAnalysisPage.jsx'));
const DonorPage = lazy(() => import('./pages/DonorPage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage.jsx'));
const HospitalSettingsPage = lazy(() => import('./pages/HospitalSettingsPage.jsx'));
const AdminMastersPage = lazy(() => import('./pages/AdminMastersPage.jsx'));
const PatientProfilePage = lazy(() => import('./pages/PatientProfilePage.jsx'));
const PayrollServicePage = lazy(() => import('./pages/PayrollServicePage.jsx'));
const StaffManagementPage = lazy(() => import('./pages/StaffManagementPage.jsx'));
const FinancialLedgerPage = lazy(() => import('./pages/FinancialLedgerPage.jsx'));
const EmployeeMasterPage = lazy(() => import('./pages/EmployeeMasterPage.jsx'));

export default function App() {
  const suspenseFallback = (
    <div className="p-8 animate-pulse space-y-4">
      <div className="h-8 w-64 bg-slate-100 rounded-xl" />
      <div className="h-4 w-96 bg-slate-50 rounded-lg" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-50 rounded-xl mt-4" />
    </div>
  );
  const [tenants, setTenants] = useState([
    { id: 'b01f0cdc-4e8b-4db5-ba71-e657a414695e', name: 'NHGL Healthcare Institute', code: 'NHGL' }
  ]);
  const [session, setSession] = useState(() => {
    const s = api.getStoredSession();
    const u = api.getStoredUser();
    return (s && u) ? { ...s, user: u } : null;
  });
  const [view, setView] = useState(() => {
    const s = api.getStoredSession();
    const u = api.getStoredUser();
    const role = u?.role || s?.role;
    if (role && role.toLowerCase() === 'superadmin') return 'superadmin';
    return (s && s.tenantId) ? 'dashboard' : 'login';
  });
  const [permissions, setPermissions] = useState(fallbackPermissions);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [walkins, setWalkins] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [superOverview, setSuperOverview] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notices, setNotices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activePatientId, setActivePatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();


  console.log('DEBUG: EnhancedSuperadminPage render', { superOverview, tenantsLength: tenants?.length });
  const [error, setError] = useState('');

  const tenant = useMemo(() => tenants.find((t) => t.id === session?.tenantId), [tenants, session]);
  const activeUser = session?.user || null;
  const isDoctor = (activeUser?.role || '').toLowerCase() === 'doctor';
  const providers = useMemo(() => users.filter((x) => ['Doctor', 'Nurse', 'Admin'].includes(x.role)), [users]);
  const scopedProviders = useMemo(() => {
    if (!isDoctor) return providers;
    const mine = providers.filter((p) => p.id === activeUser?.id);
    return mine.length ? mine : (activeUser?.id ? [{ id: activeUser.id, name: activeUser.name || 'Me', role: 'Doctor' }] : []);
  }, [isDoctor, providers, activeUser]);
  const doctorAppointments = useMemo(() => {
    if (!isDoctor) return appointments;
    return appointments.filter((a) => (a.providerId || a.provider_id) === activeUser?.id);
  }, [isDoctor, appointments, activeUser]);
  const doctorPatientIds = useMemo(() => {
    if (!isDoctor) return null;
    const ids = new Set();
    doctorAppointments.forEach((a) => ids.add(a.patientId || a.patient_id));
    encounters
      .filter((e) => (e.providerId || e.provider_id) === activeUser?.id)
      .forEach((e) => ids.add(e.patientId || e.patient_id));
    ids.delete(undefined);
    ids.delete(null);
    ids.delete('');
    return ids;
  }, [isDoctor, doctorAppointments, encounters, activeUser]);
  const scopedPatients = useMemo(() => {
    if (!isDoctor) return patients;
    // For Doctors: Show patients with appointments/encounters OR the currently active patient (e.g. just created)
    const result = patients.filter((p) => doctorPatientIds?.has(p.id) || p.id === activePatientId);
    console.log(`[FORENSIC_SCOPE] Doctor Patient Scope. Total: ${patients.length}, Scoped: ${result.length}, ActiveID: ${activePatientId}`);
    return result;
  }, [isDoctor, patients, doctorPatientIds, activePatientId]);

  const scopedAppointments = useMemo(() => (isDoctor ? doctorAppointments : appointments), [isDoctor, doctorAppointments, appointments]);
  const scopedEncounters = useMemo(() => {
    if (!isDoctor) return encounters;
    return encounters.filter((e) => doctorPatientIds?.has(e.patientId || e.patient_id));
  }, [isDoctor, encounters, doctorPatientIds]);
  const scopedWalkins = useMemo(() => (isDoctor ? [] : walkins), [isDoctor, walkins]);
  const activePatient = useMemo(
    () => scopedPatients.find((p) => p.id === activePatientId) || scopedPatients[0] || null,
    [scopedPatients, activePatientId]
  );

  const allowedViews = useMemo(() => {
    if (!activeUser?.role) {
      return [];
    }

    // Superadmin bypasses all tenant/tier restrictions — they have no tenant
    if (activeUser.role.toLowerCase() === 'superadmin') {
      return ['superadmin', 'tenant_management', 'infra_health', 'financial_control', 'subscription_mgmt', 'communication', 'reports', 'support', 'admin'];
    }

    const roleKey = activeUser.role.charAt(0).toUpperCase() + activeUser.role.slice(1).toLowerCase();
    let normalizedRole = roleKey;
    if (roleKey === 'Front office') normalizedRole = 'Front Office';
    else if (roleKey === 'Support staff') normalizedRole = 'Support Staff';
    else if (roleKey === 'Hr') normalizedRole = 'HR';
    else if (roleKey === 'Administrator' || roleKey === 'Admin role') normalizedRole = 'Admin';

    const roleViews = permissions[normalizedRole] || permissions[activeUser.role] || ['dashboard'];
    
    return roleViews.filter((item) => {
      if (item === 'dashboard') return true;
      
      const tier = tenant?.subscription_tier || 'Enterprise';
      
      // Feature visibility matrix by subscription tier
      if (tier === 'Free') {
        const freeModules = ['superadmin', 'dashboard', 'patients', 'appointments', 'emr', 'reports', 'admin', 'users', 'support', 'communication', 'documents', 'hospital_settings'];
        return freeModules.includes(item);
      } else if (tier === 'Basic') {
        const basicModules = ['superadmin', 'dashboard', 'patients', 'appointments', 'emr', 'reports', 'admin', 'users', 'support', 'communication', 'documents', 'inventory', 'pharmacy', 'ambulance', 'lab', 'hospital_settings', 'departments'];
        return basicModules.includes(item);
      } else if (tier === 'Professional') {
        const proModules = [
          'superadmin', 'dashboard', 'patients', 'appointments', 'emr', 'reports', 'admin', 'users', 'support', 'communication', 'documents', 
          'inventory', 'pharmacy', 'ambulance', 'lab', 'inpatient', 'billing', 'accounts', 'accounts_receivable', 'accounts_payable', 
          'insurance', 'service_catalog', 'hospital_settings', 'departments', 'bed_management'
        ];
        return proModules.includes(item);
      }
      
      return true; // Enterprise has everything
    });
  }, [permissions, activeUser, tenant]);

  const slmInsights = useMemo(() => {
    if (!tenant) return null;
    const pendingBilled = invoices.filter(i => i.status !== 'paid').length;
    const capacity = encounters.filter(e => e.status === 'open').length;

    return {
      narrative: `Facility throughput is currently at ${((capacity / 50) * 100).toFixed(0)}% theoretical capacity. ${pendingBilled > 10 ? 'Alert: Financial lag detected in billing cycles.' : 'Financial velocity is within target parameters.'}`,
      trends: ['↑ Patient Inflow', '✓ Staff Stability', pendingBilled > 15 ? '⚠ Billing Backlog' : '✓ Liquidity Stable'],
      forecast: (reportSummary?.periodical?.dailyAppointments || 0) * 30 * 1.15
    };
  }, [tenant, encounters, invoices, reportSummary]);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    // Don't redirect if superadmin — they always land on their own console
    if (activeUser?.role?.toLowerCase() === 'superadmin') return;
    if (isDoctor && (view === 'dashboard' || !allowedViews.includes(view)) && allowedViews.includes('appointments')) {
      setView('doctor_workspace');
      return;
    }
    if (!allowedViews.includes(view) && view !== 'doctor_workspace' && view !== 'superadmin' && allowedViews.length) {
      setView(allowedViews[0]);
    }
  }, [allowedViews, view, isDoctor, activeUser]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });

      document.querySelector('.view-container')?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  useEffect(() => {
    if (!tenant) return;
    const theme = tenant.theme || {};
    const primary = theme.primary || '#011627';
    const accent = theme.accent || '#0077B6';
    document.documentElement.style.setProperty('--clinical-primary', primary);
    document.documentElement.style.setProperty('--clinical-secondary', accent);
    document.documentElement.style.setProperty('--medical-navy', primary);
    return () => {
      document.documentElement.style.removeProperty('--clinical-primary');
      document.documentElement.style.removeProperty('--clinical-secondary');
      document.documentElement.style.removeProperty('--medical-navy');
    };
  }, [tenant]);

  async function loadTenants() {
    try {
      setTenants(await api.getTenants());
    } catch (err) {
      setError(err.message);
    }
  }

  function normalizeRole(role) {
    if (!role) return '';
    const roleKey = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (roleKey === 'Front office') return 'Front Office';
    if (roleKey === 'Support staff') return 'Support Staff';
    if (roleKey === 'Hr') return 'HR';
    if (roleKey === 'Administrator' || roleKey === 'Admin role') return 'Admin';
    return roleKey;
  }

  function mergePermissions(permissionsPayload) {
    const merged = { ...fallbackPermissions };
    if (permissionsPayload) {
      Object.keys(permissionsPayload).forEach(role => {
        const dbPerms = permissionsPayload[role] || [];
        if (merged[role]) {
          merged[role] = Array.from(new Set([...merged[role], ...dbPerms]));
        } else {
          merged[role] = dbPerms;
        }
      });
    }
    return merged;
  }

  function extractFormPayload(input) {
    if (!input) return {};
    if (typeof input.preventDefault === 'function' && input.target) {
      input.preventDefault();
      const fd = new FormData(input.target);
      return Object.fromEntries(fd.entries());
    }
    return input;
  }

  async function refreshTenantData(
    tenantId = session?.tenantId,
    userId = session?.user?.id,
    userRole = session?.user?.role,
    options = {}
  ) {
    if (!tenantId) {
      return;
    }

    const mode = options.mode || 'full';
    const bootstrap = await api.getBootstrapData(tenantId, userId);

    const effectivePermissions = mergePermissions(bootstrap.permissions);
    const normalizedRole = normalizeRole(userRole);
    const roleViews = effectivePermissions[normalizedRole] || effectivePermissions[userRole] || [];
    const canReadReports = roleViews.includes('reports');

    setPermissions(effectivePermissions);

    // Use non-destructive merging for critical entities to handle replication lag
    const mergeData = (prev, incoming) => {
        if (!incoming) return prev;
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = incoming.filter(p => !existingIds.has(p.id));
        return [...prev, ...newOnes];
    };

    setPatients(prev => {
        const merged = mergeData(prev, bootstrap.patients);
        // Force-prepend any un-synced vault patient if found
        const vaultRaw = localStorage.getItem('LAST_CREATED_PATIENT_SYNC');
        if (vaultRaw) {
            try {
                const vault = JSON.parse(vaultRaw);
                const age = Date.now() - vault.timestamp;
                if (age < 300000) { // 5 minutes
                    const exists = merged.some(p => p.lastName === vault.lastName);
                    if (!exists) {
                         console.log('RE-INJECTING missing patient from SyncVault:', vault.lastName);
                         return [{ id: 'vault-' + vault.timestamp, ...vault, mrn: 'SYNC-PENDING' }, ...merged];
                    }
                }
            } catch (e) {}
        }
        console.log(`DEBUG_REFRESH: Patients count ${prev.length} -> ${merged.length}`);
        return merged;
    });
    setAppointments(prev => mergeData(prev, bootstrap.appointments));
    setWalkins(prev => mergeData(prev, bootstrap.walkins));
    setEncounters(bootstrap.encounters || []);
    window.DEBUG_ALL_ENCOUNTERS = bootstrap.encounters || [];
    
    setInvoices(bootstrap.invoices || []);
    setInventory(prev => mergeData(prev, bootstrap.inventory));
    setEmployees(prev => mergeData(prev, bootstrap.employees));
    setExpenses(bootstrap.expenses || []);
    setEmployeeLeaves(prev => mergeData(prev, bootstrap.employeeLeaves));
    setInsuranceProviders(prev => mergeData(prev, bootstrap.insuranceProviders));
    setClaims(prev => mergeData(prev, bootstrap.claims));
    
    if (!activePatientId && bootstrap.patients?.length) {
      setActivePatientId(bootstrap.patients[0].id);
    }

    if (mode === 'fast') {
      void (async () => {
        const reportsPromise = canReadReports
          ? api.getReportSummary(tenantId).catch((err) => {
              console.warn('Report summary unavailable for current role/session:', err.message);
              return null;
            })
          : Promise.resolve(null);

        const [tenantUsers, reports, noticeFeed, documentFeed, expensesFeed] = await Promise.all([
          api.getUsers(tenantId).catch(() => []),
          reportsPromise,
          api.getNotices(tenantId, 'all').catch(() => []),
          api.getDocuments(tenantId).catch(() => []),
          api.getExpenses(tenantId).catch(() => [])
        ]);

        setUsers(tenantUsers || []);
        setNotices(noticeFeed || []);
        setDocuments(documentFeed || []);
        setReportSummary(reports);
        setExpenses(expensesFeed || []);
      })();
      return;
    }

    const reportsPromise = canReadReports
      ? api.getReportSummary(tenantId).catch((err) => {
          console.warn('Report summary unavailable for current role/session:', err.message);
          return null;
        })
      : Promise.resolve(null);

    const [tenantUsers, reports, noticeFeed, documentFeed, expensesFeed] = await Promise.all([
      api.getUsers(tenantId).catch(() => []),
      reportsPromise,
      api.getNotices(tenantId, 'all').catch(() => []),
      api.getDocuments(tenantId).catch(() => []),
      api.getExpenses(tenantId).catch(() => [])
    ]);

    setUsers(tenantUsers || []);
    setNotices(noticeFeed || []);
    setDocuments(documentFeed || []);
    setReportSummary(reports);
    setExpenses(expensesFeed || []);
  }

  async function refreshSuperadmin() {
    console.log('DEBUG: refreshSuperadmin started');
    try {
      const [overview, allUsers, allTenants, allTickets] = await Promise.all([
        api.getSuperadminOverview(),
        api.getUsers(),
        api.getTenants(),
        api.getSupportTickets()
      ]);
      console.log('DEBUG: Superadmin data fetched', { overview, allUsers, allTenants, allTickets });
      setSuperOverview(overview);
      setUsers(allUsers || []);
      setTenants(allTenants || []);
      setTickets(allTickets || []);
    } catch (err) {
      console.error('DEBUG: refreshSuperadmin failed', err);
      setError('Failed to load platform data: ' + err.message);
    }
  }

  // Restore data on mount/reload
  useEffect(() => {
    if (session?.user?.id) {
      // Superadmin may not have a tenantId
      if (session.user.role === 'Superadmin' || session.tenantId) {
        const fetchData = async () => {
          try {
            if (session.user.role === 'Superadmin') {
              await refreshSuperadmin();
            } else {
              await refreshTenantData(session.tenantId, session.user.id, session.user.role, { mode: 'fast' });
            }
          } catch (e) {
            console.error('Failed to restore session data', e);
          }
        };
        fetchData();
      }
    }
  }, [session?.tenantId, session?.user?.id]);
  
  // Institutional Theme Sync
  useEffect(() => {
    if (tenant?.theme) {
      try {
        const themeConfig = typeof tenant.theme === 'string' ? JSON.parse(tenant.theme) : tenant.theme;
        const { primary, accent, hero, text } = themeConfig;
        if (primary) {
          document.documentElement.style.setProperty('--clinical-primary', primary);
          document.documentElement.style.setProperty('--clinical-primary-dark', primary); 
        }
        if (accent) {
          document.documentElement.style.setProperty('--clinical-accent', accent);
        }
        if (hero) {
          document.documentElement.style.setProperty('--clinical-hero', hero);
        }
        if (text) {
          document.documentElement.style.setProperty('--clinical-text', text);
        }
      } catch (err) {
        console.warn('[THEME_SYNC] Failed to parse institutional theme shard:', err);
      }
    }
  }, [tenant]);

  useEffect(() => {
    console.log('PLATFORM_DIAGNOSTIC:', {
      role: activeUser?.role,
      view,
      allowedViews,
      hasSession: !!session,
      tenantId: session?.tenantId
    });
  }, [activeUser, view, allowedViews, session]);

  async function handleLogin(loginData) {
    setError('');
    try {
      setLoading(true);
      setSession(loginData);

      if (loginData?.permissions) {
        setPermissions(mergePermissions(loginData.permissions));
      }

      if (loginData?.featureFlags && loginData?.tenantId) {
        featureFlagService.seedCache(loginData.tenantId, loginData.featureFlags);
      }

      if (loginData.role === 'Superadmin') {
        setView('superadmin');
        refreshSuperadmin().catch((err) => {
          console.error('Superadmin refresh failed:', err);
        });
      } else {
        const targetView = (loginData.user?.role || '').toLowerCase() === 'doctor' ? 'doctor_workspace' : 'dashboard';
        setView(targetView);
        refreshTenantData(loginData.tenantId, loginData.user.id, loginData.user.role, { mode: 'fast' }).catch((err) => {
          console.error('Tenant refresh failed:', err);
        });
      }
    } catch (err) {
      console.error('DIAGNOSTIC: Login process failed at step:', err);
      // Let the user see the Error on the current page instead of kicking them out
      setError('System Error: ' + (err.message || 'Unknown error during startup'));
    } finally {
      setLoading(false);
    }
  }

  async function withRefresh(action, successMsg = '') {
    try {
      setError('');
      await action();
      if (activeUser?.role === 'Superadmin') {
        await refreshSuperadmin();
      } else {
        await refreshTenantData();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    api.logout(); // This will clear storage and redirect
  }

  async function printPatientDoc(docType) {
    if (!activePatient || !session?.tenantId) {
      return;
    }
    const doc = await api.getPatientPrintDoc(activePatient.id, docType, session.tenantId);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      return;
    }
    win.document.write(`<html><body><h2>${doc.title}</h2><h3>${doc.patient.firstName} ${doc.patient.lastName} (${doc.patient.mrn})</h3><pre>${JSON.stringify(doc.rows, null, 2)}</pre></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  if (!session) {
    return <UnifiedLoginPage tenants={tenants} onLogin={handleLogin} loading={loading} error={error} />;
  }

  // Calculate metrics safely
  const metrics = {
    patients: (scopedPatients || []).length,
    appointments: (scopedAppointments || []).length,
    walkins: (scopedWalkins || []).filter((w) => w.status !== 'converted').length,
    employees: (employees || []).length,
    revenue: (invoices || []).reduce((sum, x) => sum + Number(x.paid || 0), 0)
  };

  return (
    <>
      <AppLayout
        tenant={tenant}
        activeUser={activeUser}
        allowedViews={allowedViews}
        view={view}
        setView={setView}
        onLogout={logout}
        error={error}
        patients={scopedPatients}
        appointments={scopedAppointments}
      >
        <ErrorBoundary>
          <Suspense fallback={suspenseFallback}>
            {activeUser?.role === 'Superadmin' && ['superadmin', 'tenant_management', 'infra_health', 'financial_control', 'subscription_mgmt', 'communication', 'support', 'reports', 'admin'].includes(view) && (
            <EnhancedSuperadminPage
              view={view}
              apiClient={api}
              tenant={tenant}
              userRole={activeUser?.role}
              superOverview={superOverview}
              tenants={tenants}
              users={users}
              onCreateTenant={(data) => withRefresh(() => api.createTenant(data))}
              onCreateUser={(tenantId, data) => withRefresh(() => api.provisionTenantAdmin(tenantId, data))}
              tickets={tickets}
              onResolveTicket={async (id) => {
                 await withRefresh(() => api.updateSupportStatus(id, 'resolved'));
              }}
              onRefresh={refreshSuperadmin}
              infra={superOverview?.infra || {}}
            />
          )}

          {view === 'doctor_workspace' && (
            <DoctorWorkspacePage
              activeUser={activeUser}
              appointments={scopedAppointments}
              patients={scopedPatients}
              encounters={scopedEncounters}
              users={users}
              setView={setView}
              setActivePatientId={setActivePatientId}
              onSetAppointmentStatus={(appointmentId, status) => withRefresh(() => api.setAppointmentStatus(appointmentId, { tenantId: session.tenantId, userId: activeUser.id, status }))}
            />
          )}

          {view === 'dashboard' && (
            <DashboardPage 
              metrics={metrics} 
              activeUser={activeUser} 
              setView={setView} 
              tenant={session?.tenantId ? { id: session.tenantId, ...tenant } : null} 
              view={view}
              appointments={appointments}
              patients={patients}
              setActivePatientId={setActivePatientId}
            />
          )}

        {view === 'patients' && (
          <PatientsPage
            activeUser={activeUser}
            session={session}
            tenant={tenant}
            patients={patients}
            setView={setView}
            setActivePatientId={setActivePatientId}
            onCreatePatient={async (data) => {
              console.log('DEBUG: onCreatePatient called in App.jsx', data);
              try {
                const newPatient = await api.createPatient({ ...data, tenantId: tenant?.id || session?.tenantId });
                if (newPatient) {
                  // Persistent vault injection with REAL server ID
                  localStorage.setItem('LAST_CREATED_PATIENT_SYNC', JSON.stringify({ ...newPatient, timestamp: Date.now() }));
                  setPatients(prev => [newPatient, ...prev]);
                }
                showToast({ message: 'Patient registered successfully!', type: 'success' });
              } catch (err) {
                console.error('DEBUG: onCreatePatient FAILED', err);
                showToast({ message: 'Registration failed: ' + err.message, type: 'error' });
              }
            }}
          />
        )}

        {view === 'patient-profile' && (
          <PatientProfilePage
            patientId={activePatientId}
            activeUser={activeUser}
            tenant={tenant}
            session={session}
            onBack={() => setView('patients')}
            setView={setView}
          />
        )}

        {view === 'appointments' && (
          <AppointmentsPage
            activeUser={activeUser}
            session={session}
            patients={scopedPatients}
            providers={scopedProviders}
            walkins={scopedWalkins}
            appointments={scopedAppointments}
            users={users}
            setView={setView}
            setActivePatientId={setActivePatientId}
            onCreateAppointment={(input) => {
              const data = extractFormPayload(input);
              withRefresh(() => api.addAppointment({
                tenantId: session.tenantId, userId: activeUser.id,
                patientId: data.patientId, providerId: data.providerId,
                start: data.start, end: data.end, reason: data.reason
              }));
            }}
            onCreatePatient={async (data) => {
              const res = await api.addPatient({
                tenantId: session.tenantId, userId: activeUser.id,
                ...data
              });
              if (res && res.id) {
                await refreshTenantData();
                return res;
              }
              throw new Error("Patient creation failed");
            }}
            onCreateWalkin={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addWalkin({
                tenantId: session.tenantId, userId: activeUser.id,
                name: fd.get('name'), phone: fd.get('phone'), reason: fd.get('reason')
              }));
            }}
            onSelfAppointment={(input) => {
              const data = extractFormPayload(input);
              withRefresh(() => api.addSelfAppointment({
                tenantId: session.tenantId, userId: activeUser.id, patientId: activeUser.patientId,
                providerId: data.providerId, start: data.start, end: data.end, reason: data.reason
              }));
            }}
            onConvertWalkin={async (walkinId) => {
              await withRefresh(async () => {
                const newPatient = await api.convertWalkin(walkinId, { tenantId: session.tenantId, userId: activeUser.id });
                if (newPatient && newPatient.id) {
                  setActivePatientId(newPatient.id);
                  setView('patients');
                }
              });
            }}
            onSetAppointmentStatus={(appointmentId, status) => withRefresh(() => api.setAppointmentStatus(appointmentId, { tenantId: session.tenantId, userId: activeUser.id, status }))}
            onReschedule={(appointmentId, data) => {
              withRefresh(() => api.rescheduleAppointment(appointmentId, { 
                tenantId: session.tenantId, 
                userId: activeUser.id, 
                ...data 
              }));
            }}
          />
        )}

        {view === 'find_doctor' && (
          <FindDoctorPage
            activeUser={activeUser}
            session={session}
            providers={providers}
            patients={scopedPatients}
            onCreateAppointment={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addAppointment({
                tenantId: session.tenantId, userId: activeUser.id,
                patientId: fd.get('patientId'), providerId: fd.get('providerId'),
                start: fd.get('start'), end: fd.get('end'), reason: fd.get('reason')
              }));
            }}
            onSelfAppointment={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addSelfAppointment({
                tenantId: session.tenantId, userId: activeUser.id, patientId: activeUser.patientId,
                providerId: fd.get('providerId'), start: fd.get('start'), end: fd.get('end'), reason: fd.get('reason')
              }));
            }}
          />
        )}

        {view === 'doctor_availability' && (
          <DoctorAvailabilityPage
            selectedDoctor={null}
            activeUser={activeUser}
            session={session}
            patients={scopedPatients}
            providers={providers}
            onBookAppointment={(appointmentData) => {
              withRefresh(() => api.addAppointment({
                tenantId: session.tenantId, userId: activeUser.id,
                patientId: appointmentData.patientId, providerId: appointmentData.providerId,
                start: appointmentData.start || `${appointmentData.date}T${appointmentData.startTime}`,
                end: appointmentData.end || `${appointmentData.date}T${appointmentData.endTime}`,
                reason: appointmentData.reason
              }));
            }}
            onBack={() => setView('find_doctor')}
          />
        )}

        {view === 'emr' && (
            <EmrPage
              tenant={tenant}
              activeUser={activeUser}
              selectedId={activePatientId}
              patients={scopedPatients}
              providers={scopedProviders}
              encounters={scopedEncounters}
              onCreateEncounter={async (data) => {
              try {
                // 1. Create main encounter record
                const encounterRes = await api.addEncounter({
                  tenantId: session.tenantId,
                  userId: activeUser.id,
                  patientId: data.patientId,
                  providerId: data.providerId,
                  type: data.type,
                  complaint: data.complaint,
                  diagnosis: data.diagnosis,
                  notes: data.notes,
                  bp: data.bp, // Ensure backend handles these or they'll be ignored
                  hr: data.hr,
                  wardId: data.wardId,
                  bedId: data.bedId
                });

                // 2. Only doctors can create prescription records
                if (isDoctor && data.medications && data.medications.length > 0) {
                  // A. Legacy clinical record logic
                  await api.addPatientClinical(data.patientId, {
                    tenantId: session.tenantId,
                    userId: activeUser.id,
                    section: 'prescriptions',
                    payload: {
                      date: new Date().toISOString().slice(0, 10),
                      vitals: { bp: data.bp, hr: data.hr },
                      medications: data.medications,
                      notes: data.notes,
                      providerId: data.providerId,
                      wardId: data.wardId,
                      bedId: data.bedId
                    }
                  });

                  // B. New Pharmacy Microservice logic
                  try {
                    await api.createPrescription(session.tenantId, {
                      patientId: data.patientId,
                      encounterId: encounterRes?.id || `enc-${Date.now()}`,
                      priority: 'routine',
                      category: data.type === 'Emergency' ? 'stat' : 'outpatient',
                      items: data.pharmacyItems || [],
                      wardId: data.wardId,
                      bedId: data.bedId
                    });
                  } catch (rxErr) {
                    console.error('Failed to create pharmacy prescription:', rxErr);
                  }
                }
                refreshTenantData();
                return encounterRes;
              } catch (err) {
                console.error('Encounter error:', err);
                throw err;
              }
            }}
            onOrderLab={async (labData) => {
              try {
                await api.createLabOrder({
                  tenantId: session.tenantId,
                  patientId: labData.patientId,
                  encounterId: labData.encounterId,
                  tests: labData.tests,
                  priority: labData.priority || 'routine',
                  notes: labData.notes
                });
                refreshTenantData();
              } catch (err) {
                console.error('Lab order error:', err);
                throw err;
              }
            }}
            onDischarge={() => refreshTenantData()}
            onCreateDocument={(payload) => withRefresh(() => api.createDocument({
              tenantId: session.tenantId,
              ...payload
            }))}
          />
        )}

        {view === 'inpatient' && (
          <InpatientPage
            tenant={tenant}
            providers={providers}
            encounters={encounters}
            onDischarge={() => refreshTenantData()}
            refreshTenantData={() => refreshTenantData()}
          />
        )}

        {view === 'pharmacy' && (
          <PharmacyPage
            tenant={tenant}
            setView={setView}
            activeUser={activeUser}
          />
        )}

        {['billing', 'accounts_receivable'].includes(view) && (
          <BillingPage
            tenant={tenant}
            patients={patients}
            invoices={invoices}
            setView={setView}
            setActivePatientId={setActivePatientId}
            onIssueInvoice={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createInvoice({
                tenantId: session.tenantId, userId: activeUser.id, patientId: fd.get('patientId'),
                description: fd.get('description'), amount: fd.get('amount'),
                taxPercent: fd.get('taxPercent'), paymentMethod: fd.get('paymentMethod')
              }));
            }}
            onMarkPaid={(id) => {
              const method = window.prompt('Payment Method (Cash, Card, UPI, Insurance)?', 'Cash');
              if (method) withRefresh(() => api.payInvoice(id, session.tenantId, activeUser.id, method));
            }}
          />
        )}

        {['employees', 'employee_master', 'attendance'].includes(view) && (
          <EmployeesPage
            tenant={tenant}
            employees={employees}
            employeeLeaves={employeeLeaves}
            onCreateEmployee={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addEmployee({
                tenantId: session.tenantId,
                name: fd.get('name'), email: fd.get('email'), code: fd.get('code'), department: fd.get('department'),
                designation: fd.get('designation'), joinDate: fd.get('joinDate'), shift: fd.get('shift'),
                salary: Number(fd.get('salary'))
              }));
            }}
            onRecordAttendance={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.recordAttendance({
                tenantId: session.tenantId, employeeId: fd.get('employeeId'),
                date: fd.get('date'), timeIn: fd.get('timeIn'),
                timeOut: fd.get('timeOut'), status: fd.get('status')
              }));
            }}
            onApplyLeave={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addEmployeeLeave(fd.get('employeeId'), {
                tenantId: session.tenantId, from: fd.get('from'), to: fd.get('to'), type: fd.get('type')
              }));
            }}
          />
        )}

        {view === 'staff_management' && (
          <StaffManagementPage 
            tenant={tenant} 
            employees={employees} 
          />
        )}

        {view === 'payroll_service' && (
          <PayrollServicePage 
            tenant={tenant} 
            employees={employees} 
          />
        )}

        {view === 'financial_ledger' && (
          <FinancialLedgerPage 
            tenant={tenant} 
            invoices={invoices}
            expenses={expenses} 
          />
        )}

        {view === 'insurance' && (
          <InsurancePage
            providers={insuranceProviders}
            claims={claims}
            onCreateProvider={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createInsuranceProvider({
                tenantId: session.tenantId,
                name: fd.get('name'),
                type: fd.get('type'),
                coverageLimit: Number(fd.get('coverageLimit')),
                contactPerson: fd.get('contactPerson'),
                phone: fd.get('phone'),
                email: fd.get('email'),
                address: fd.get('address')
              }));
            }}
            onCreateClaim={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createInsuranceClaim({
                tenantId: session.tenantId,
                providerId: fd.get('providerId'),
                patientId: fd.get('patientId'),
                amount: Number(fd.get('amount')),
                claimNumber: fd.get('claimNumber')
              }));
              e.target.reset();
            }}
          />
        )}

        {view === 'lab' && <LabPage tenant={session?.tenantId ? { id: session.tenantId, code: session.tenantCode, ...session } : null} activeUser={activeUser} />}

        {view === 'users' && (
          <UsersPage 
            users={users}
            activeUser={activeUser}
            tenant={tenant}
            onUpdateUserRole={(id, role) => withRefresh(() => api.updateUser(id, { role }))}
            onResetPassword={async (userId) => {
              const newPassword = window.prompt('Enter new password for this user (min 8 chars):');
              if (!newPassword || newPassword.length < 8) {
                if (newPassword !== null) showToast({ message: 'Password must be at least 8 characters.', type: 'error' });
                return;
              }
              try {
                const targetUser = users.find(u => u.id === userId);
                if (!targetUser) { showToast({ message: 'User not found.', type: 'error' }); return; }
                await api.resetUserPassword(session.tenantId, targetUser.email, newPassword);
                showToast({ message: `Password reset successfully for ${targetUser.name || targetUser.email}.`, type: 'success' });
              } catch (err) {
                showToast({ message: 'Password reset failed: ' + err.message, type: 'error' });
              }
            }}
            onCreateUser={async (data) => {
              await withRefresh(() => api.createUser({
                tenantId: session.tenantId,
                ...data
              }));
            }}
          />
        )}

        {view === 'lab_availability' && <LabAvailabilityPage 
            tenant={tenant} 
            activeUser={activeUser}
            patients={scopedPatients}
            onBookAppointment={(appointmentData) => {
              withRefresh(() => api.createLabOrder({
                tenantId: session.tenantId,
                patientId: appointmentData.patientId,
                tests: [{
                  code: appointmentData.testType?.toUpperCase().replace(/\s+/g, '_') || 'LAB',
                  name: appointmentData.testType || appointmentData.labName || 'Lab Test'
                }],
                priority: appointmentData.urgent ? 'urgent' : 'routine',
                notes: [
                  `Lab: ${appointmentData.labName}`,
                  `Date: ${appointmentData.date}`,
                  `Slot: ${appointmentData.startTime} - ${appointmentData.endTime}`,
                  appointmentData.fasting ? 'Fasting required' : null,
                  appointmentData.reason
                ].filter(Boolean).join(' | ')
              }));
            }}
          />}
        
        {view === 'lab_tests' && <LabTestsPage tenant={tenant} activeUser={activeUser} />}
        
        {view === 'communication' && (
          <CommunicationPage
            activeUser={activeUser}
            notices={notices}
            onCreateNotice={(payload) => withRefresh(() => api.createNotice({
              tenantId: session.tenantId,
              ...payload
            }))}
            onSetNoticeStatus={(noticeId, status) => withRefresh(() => api.updateNoticeStatus(noticeId, status, session.tenantId))}
          />
        )}

        {view === 'documents' && (
          <DocumentVaultPage
            activeUser={activeUser}
            documents={documents}
            patients={scopedPatients}
            onCreateDocument={(payload) => withRefresh(() => api.createDocument({
              tenantId: session.tenantId,
              ...payload
            }))}
            onSetDocumentDeleted={(documentId, isDeleted) => withRefresh(() => api.setDocumentDeleted(documentId, session.tenantId, isDeleted))}
          />
        )}

        {view === 'support' && (
          <SupportPage
            tenant={tenant}
            activeUser={activeUser}
            tickets={tickets}
            onCreateTicket={(payload) => withRefresh(() => api.createSupportTicket({
              tenantId: session.tenantId,
              ...payload
            }))}
          />
        )}

        {['accounts', 'accounts_payable'].includes(view) && <AccountsPage tenant={tenant} initialTab={view === 'accounts_payable' ? 'record' : 'snapshot'} />}
        {view === 'ambulance' && <AmbulancePage tenant={tenant} />}
        {view === 'service_catalog' && <ServiceCatalogPage tenant={tenant} />}
        {view === 'ai_vision' && <AIImageAnalysisPage tenant={tenant} patients={patients} />}
        
        {['admin', 'admin_masters', 'bed_management'].includes(view) && (
          <AdminMastersPage 
            tenant={tenant} 
            onViewChange={(newView) => setView(newView)} 
          />
        )}
        
        {view === 'hospital_settings' && (
          <HospitalSettingsPage 
            tenant={tenant} 
            onUpdateTenant={(updated) => {
              setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
            }} 
          />
        )}
        
        {view === 'employee_master' && (
          <EmployeeMasterPage 
            tenant={tenant}
            employees={employees}
            activeUser={activeUser}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'departments' && <DepartmentsPage tenant={tenant} />}
        
        {view === 'donor' && <DonorPage tenant={tenant} />}
        {view === 'chat' && <ChatPage activeUser={activeUser} />}

        {view === 'reports' && <ReportsPage reportSummary={reportSummary} tenant={tenant} slmInsights={slmInsights} superOverview={superOverview} />}
        </Suspense>
        </ErrorBoundary>
      </AppLayout>

      <Chatbot context={{
        patients: scopedPatients, appointments: scopedAppointments, walkins: scopedWalkins, encounters: scopedEncounters, invoices, inventory,
        employees, employeeLeaves, insuranceProviders, claims, notices, documents, tenant, activeUser, setView
      }} />
    </>
  );
}
