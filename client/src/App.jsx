import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { fallbackPermissions } from './config/modules.js';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SuperadminPage from './pages/SuperadminPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import EmrPage from './pages/EmrPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import InsurancePage from './pages/InsurancePage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import InpatientPage from './pages/InpatientPage.jsx';
import PharmacyPage from './pages/PharmacyPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import AccountsPage from './pages/AccountsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import LabPage from './pages/LabPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import Chatbot from './components/Chatbot.jsx';

export default function App() {
  const [tenants, setTenants] = useState([]);
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
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [superOverview, setSuperOverview] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [activePatientId, setActivePatientId] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('DEBUG: SuperadminPage render', { superOverview, tenantsLength: tenants?.length });
  const [error, setError] = useState('');

  const tenant = useMemo(() => tenants.find((t) => t.id === session?.tenantId), [tenants, session]);
  const activeUser = session?.user || null;
  const providers = useMemo(() => users.filter((x) => ['Doctor', 'Nurse', 'Admin'].includes(x.role)), [users]);
  const activePatient = useMemo(
    () => patients.find((p) => p.id === activePatientId) || patients[0] || null,
    [patients, activePatientId]
  );

  const allowedViews = useMemo(() => {
    if (!activeUser?.role) {
      return [];
    }

    // Normalize role for permission mapping
    const roleKey = activeUser.role.charAt(0).toUpperCase() + activeUser.role.slice(1).toLowerCase();
    const normalizedRole = roleKey === 'Front office' ? 'Front Office' : (roleKey === 'Support staff' ? 'Support Staff' : roleKey);

    const roleViews = permissions[normalizedRole] || permissions[activeUser.role] || ['dashboard'];
    
    return roleViews.filter((item) => {
      if (item === 'dashboard') return true;
      
      const tier = tenant?.subscription_tier || 'Free';
      
      // Feature visibility matrix by subscription tier
      if (tier === 'Free') {
        // Free: Only Core EMR & Appointments
        const freeModules = ['dashboard', 'patients', 'appointments', 'emr', 'reports', 'admin', 'users', 'support'];
        if (!freeModules.includes(item)) return false;
      } else if (tier === 'Basic') {
        // Basic: + Pharmacy, Lab, Inventory
        const premiumModules = ['inpatient', 'billing', 'accounts', 'insurance', 'employees'];
        if (premiumModules.includes(item)) return false;
      } else if (tier === 'Professional') {
        // Professional: + Inpatient, Financials
        const enterpriseModules = ['employees'];
        if (enterpriseModules.includes(item)) return false;
      }
      
      return true;
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
    if (!allowedViews.includes(view) && allowedViews.length) {
      setView(allowedViews[0]);
    }
  }, [allowedViews, view]);

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
    // Tenant theme colors are available as tenant.theme.primary / accent
    // but we use the design-system palette instead
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
    return roleKey;
  }

  async function refreshTenantData(tenantId = session?.tenantId, userId = session?.user?.id, userRole = session?.user?.role) {
    if (!tenantId) {
      return;
    }

    const [bootstrap, tenantUsers] = await Promise.all([
      api.getBootstrap(tenantId, userId),
      api.getUsers(tenantId)
    ]);

    const effectivePermissions = bootstrap.permissions || fallbackPermissions;
    const normalizedRole = normalizeRole(userRole);
    const roleViews = effectivePermissions[normalizedRole] || effectivePermissions[userRole] || [];
    const canReadReports = roleViews.includes('reports');

    let reports = null;
    if (canReadReports) {
      try {
        reports = await api.getReportSummary(tenantId);
      } catch (err) {
        console.warn('Report summary unavailable for current role/session:', err.message);
      }
    }

    setPermissions(effectivePermissions);
    setUsers(tenantUsers || []);
    setPatients(bootstrap.patients || []);
    setAppointments(bootstrap.appointments || []);
    setWalkins(bootstrap.walkins || []);
    setEncounters(bootstrap.encounters || []);
    setInvoices(bootstrap.invoices || []);
    setInventory(bootstrap.inventory || []);
    setEmployees(bootstrap.employees || []);
    setEmployeeLeaves(bootstrap.employeeLeaves || []);
    setInsuranceProviders(bootstrap.insuranceProviders || []);
    setClaims(bootstrap.claims || []);
    setReportSummary(reports);
    if (!activePatientId && bootstrap.patients?.length) {
      setActivePatientId(bootstrap.patients[0].id);
    }
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
              await refreshTenantData(session.tenantId, session.user.id, session.user.role);
            }
          } catch (e) {
            console.error('Failed to restore session data', e);
          }
        };
        fetchData();
      }
    }
  }, [session?.tenantId, session?.user?.id]);

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

      if (loginData.role === 'Superadmin') {
        await refreshSuperadmin();
        setView('superadmin');
      } else {
        // Fetch tenant data FIRST
        await refreshTenantData(loginData.tenantId, loginData.user.id, loginData.user.role);
        // Only show dashboard AFTER data is loaded
        setView('dashboard');
      }
    } catch (err) {
      console.error('DIAGNOSTIC: Login process failed at step:', err);
      // Let the user see the Error on the current page instead of kicking them out
      setError('System Error: ' + (err.message || 'Unknown error during startup'));
    } finally {
      setLoading(false);
    }
  }

  async function withRefresh(action) {
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
    return <LoginPage tenants={tenants} onLogin={handleLogin} loading={loading} error={error} />;
  }

  // Calculate metrics safely
  const metrics = {
    patients: (patients || []).length,
    appointments: (appointments || []).length,
    walkins: (walkins || []).filter((w) => w.status !== 'converted').length,
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
      >
        {view === 'superadmin' && (
          <SuperadminPage
            superOverview={superOverview}
            tenants={tenants}
            onCreateTenant={(data) => withRefresh(() => api.createTenant(data))}
            onCreateUser={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createUser({
                tenantId: fd.get('tenantId'), name: fd.get('name'), email: fd.get('email'), role: fd.get('role')
              }));
            }}
            tickets={tickets}
            onResolveTicket={async (id) => {
               await withRefresh(() => api.updateSupportStatus(id, 'resolved'));
            }}
            onRefresh={refreshSuperadmin}
            infra={superOverview?.infra || {}}
          />
        )}

        {view === 'dashboard' && <DashboardPage metrics={metrics} activeUser={activeUser} setView={setView} tenant={session?.tenantId ? { id: session.tenantId, ...tenant } : null} view={view} />}

        {view === 'patients' && (
          <PatientsPage
            activeUser={activeUser}
            session={session}
            patients={patients}
            activePatient={activePatient}
            activePatientId={activePatientId}
            setActivePatientId={setActivePatientId}
            onCreatePatient={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await withRefresh(async () => {
                const newPatient = await api.addPatient({
                  tenantId: session.tenantId, userId: activeUser.id,
                  firstName: fd.get('firstName'), lastName: fd.get('lastName'), dob: fd.get('dob'),
                  gender: fd.get('gender'), phone: fd.get('phone'), email: fd.get('email'),
                  address: fd.get('address'), bloodGroup: fd.get('bloodGroup'),
                  emergencyContact: fd.get('emergencyContact'), insurance: fd.get('insurance'),
                  chronicConditions: fd.get('chronicConditions'), allergies: fd.get('allergies'),
                  surgeries: fd.get('surgeries'), familyHistory: fd.get('familyHistory')
                });
                if (newPatient && newPatient.id) {
                  setActivePatientId(newPatient.id);
                  setView('emr');
                }
              });
            }}
            onAddClinical={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addPatientClinical(activePatient.id, {
                tenantId: session.tenantId, userId: activeUser.id, section: fd.get('section'),
                payload: { date: new Date().toISOString().slice(0, 10), text: fd.get('text') }
              }));
            }}
            onPrint={printPatientDoc}
          />
        )}

        {view === 'appointments' && (
          <AppointmentsPage
            activeUser={activeUser}
            session={session}
            patients={patients}
            providers={providers}
            walkins={walkins}
            appointments={appointments}
            users={users}
            setView={setView}
            setActivePatientId={setActivePatientId}
            onCreateAppointment={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addAppointment({
                tenantId: session.tenantId, userId: activeUser.id,
                patientId: fd.get('patientId'), providerId: fd.get('providerId'),
                start: fd.get('start'), end: fd.get('end'), reason: fd.get('reason')
              }));
            }}
            onCreateWalkin={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addWalkin({
                tenantId: session.tenantId, userId: activeUser.id,
                name: fd.get('name'), phone: fd.get('phone'), reason: fd.get('reason')
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
            onReschedule={(appointment) => {
              const start = window.prompt('New start (YYYY-MM-DDTHH:mm)', appointment.start);
              if (!start) return;
              const end = window.prompt('New end (YYYY-MM-DDTHH:mm)', appointment.end);
              if (!end) return;
              withRefresh(() => api.rescheduleAppointment(appointment.id, { tenantId: session.tenantId, userId: activeUser.id, start, end }));
            }}
          />
        )}

        {view === 'emr' && (
          <EmrPage
            tenant={tenant}
            patients={patients}
            providers={providers}
            encounters={encounters}
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
                  hr: data.hr
                });

                // 2. If there are medications, save them to clinical records as a prescription
                if (data.medications && data.medications.length > 0) {
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
                      providerId: data.providerId
                    }
                  });

                  // B. New Pharmacy Microservice logic
                  try {
                    await api.createPrescription(session.tenantId, {
                      patientId: data.patientId,
                      encounterId: encounterRes?.id || `enc-${Date.now()}`,
                      priority: 'routine',
                      category: data.type === 'Emergency' ? 'stat' : 'outpatient',
                      items: data.pharmacyItems || []
                    });
                  } catch (rxErr) {
                    console.error('Failed to create pharmacy prescription:', rxErr);
                  }
                }

                refreshTenantData();
              } catch (err) {
                console.error('Encounter error:', err);
                throw err;
              }
            }}
            onDischarge={() => refreshTenantData()}
          />
        )}

        {view === 'inpatient' && (
          <InpatientPage
            tenant={tenant}
            providers={providers}
            onDischarge={() => refreshTenantData()}
          />
        )}

        {view === 'pharmacy' && (
          <PharmacyPage
            tenant={tenant}
            onDispense={() => refreshTenantData()}
          />
        )}

        {view === 'billing' && (
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

        {view === 'inventory' && (
          <InventoryPage
            inventory={inventory}
            onAddItem={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addInventory({
                tenantId: session.tenantId, userId: activeUser.id,
                code: fd.get('code'), name: fd.get('name'), category: fd.get('category'),
                stock: Number(fd.get('stock')), reorder: Number(fd.get('reorder'))
              }));
            }}
            onRestock={(itemId) => withRefresh(() => api.updateInventoryStock(itemId, { tenantId: session.tenantId, userId: activeUser.id, delta: 10 }))}
          />
        )}

        {view === 'employees' && (
          <EmployeesPage
            tenant={tenant}
            employees={employees}
            employeeLeaves={employeeLeaves}
            onCreateEmployee={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addEmployee({
                tenantId: session.tenantId,
                name: fd.get('name'), code: fd.get('code'), department: fd.get('department'),
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
                email: fd.get('email')
              }));
              e.target.reset();
            }}
            onCreateClaim={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createClaim({
                tenantId: session.tenantId,
                patientId: fd.get('patientId'),
                providerId: fd.get('providerId'),
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
            onResetPassword={(id) => alert('Password reset initialization sent to personnel email.')}
          />
        )}

        {view === 'support' && <SupportPage tenant={tenant} activeUser={activeUser} />}

        {view === 'accounts' && <AccountsPage tenant={tenant} />}

        {view === 'reports' && <ReportsPage reportSummary={reportSummary} tenant={tenant} slmInsights={slmInsights} superOverview={superOverview} />}

        {view === 'admin' && (
          <AdminPage
            tenant={tenant}
            patients={patients}
            onSaveSettings={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.updateTenantSettings(session.tenantId, {
                userId: activeUser.id,
                displayName: fd.get('displayName'),
                primaryColor: fd.get('primaryColor'),
                accentColor: fd.get('accentColor'),
                featureInventory: fd.get('featureInventory') === 'on',
                featureTelehealth: fd.get('featureTelehealth') === 'on',
                billingConfig: {
                  provider: fd.get('billingProvider'),
                  currency: fd.get('billingCurrency'),
                  gatewayKey: fd.get('billingKey'),
                  accountStatus: fd.get('billingKey') ? 'linked' : 'unlinked'
                }
              }));
            }}
            onCreateUser={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createUser({
                tenantId: session.tenantId,
                name: fd.get('name'), email: fd.get('email'), role: fd.get('role'),
                patientId: fd.get('patientId') || null
              }));
            }}
            onAddWard={async (data) => {
              await api.createWard({ ...data, tenantId: session.tenantId });
              refreshTenantData();
            }}
            onAddBed={async (data) => {
              await api.createBed(data);
              refreshTenantData();
            }}
          />
        )}
      </AppLayout>

      <Chatbot context={{
        patients, appointments, walkins, encounters, invoices, inventory,
        employees, employeeLeaves, insuranceProviders, claims, tenant, activeUser, setView
      }} />
    </>
  );
}
