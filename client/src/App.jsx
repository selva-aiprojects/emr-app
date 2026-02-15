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
import InventoryPage from './pages/InventoryPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import Chatbot from './components/Chatbot.jsx';

export default function App() {
  const [tenants, setTenants] = useState([]);
  const [session, setSession] = useState(null);
  const [view, setView] = useState('dashboard');
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
  const [superOverview, setSuperOverview] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [activePatientId, setActivePatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tenant = useMemo(() => tenants.find((t) => t.id === session?.tenantId), [tenants, session]);
  const activeUser = session?.user || null;
  const providers = useMemo(() => users.filter((x) => ['Doctor', 'Nurse', 'Admin'].includes(x.role)), [users]);
  const activePatient = useMemo(
    () => patients.find((p) => p.id === activePatientId) || patients[0] || null,
    [patients, activePatientId]
  );

  const allowedViews = useMemo(() => {
    if (!activeUser) {
      return [];
    }
    const roleViews = permissions[activeUser.role] || ['dashboard'];
    return roleViews.filter((item) => !(item === 'inventory' && !tenant?.features?.inventory));
  }, [permissions, activeUser, tenant]);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (!allowedViews.includes(view) && allowedViews.length) {
      setView(allowedViews[0]);
    }
  }, [allowedViews, view]);

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

  async function refreshTenantData(tenantId = session?.tenantId, userId = session?.user?.id) {
    if (!tenantId) {
      return;
    }
    const [bootstrap, tenantUsers, reports] = await Promise.all([
      api.getBootstrap(tenantId, userId),
      api.getUsers(tenantId),
      api.getReportSummary(tenantId)
    ]);
    setPermissions(bootstrap.permissions || fallbackPermissions);
    setUsers(tenantUsers || []);
    setPatients(bootstrap.patients || []);
    setAppointments(bootstrap.appointments || []);
    setWalkins(bootstrap.walkins || []);
    setEncounters(bootstrap.encounters || []);
    setInvoices(bootstrap.invoices || []);
    setInventory(bootstrap.inventory || []);
    setEmployees(bootstrap.employees || []);
    setEmployeeLeaves(bootstrap.employeeLeaves || []);
    setReportSummary(reports || null);
    if (!activePatientId && bootstrap.patients?.length) {
      setActivePatientId(bootstrap.patients[0].id);
    }
  }

  async function refreshSuperadmin() {
    const [overview, allUsers] = await Promise.all([api.getSuperadminOverview(), api.getUsers()]);
    setSuperOverview(overview);
    setUsers(allUsers || []);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const fd = new FormData(e.target);
      const login = await api.login(fd.get('tenantId'), fd.get('email'), fd.get('password'));
      setSession(login);
      if (login.role === 'Superadmin') {
        setView('superadmin');
        await refreshSuperadmin();
      } else {
        setView('dashboard');
        await refreshTenantData(login.tenantId, login.user.id);
      }
    } catch (err) {
      setError(err.message);
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
    setSession(null);
    setView('dashboard');
    setUsers([]);
    setPatients([]);
    setAppointments([]);
    setWalkins([]);
    setEncounters([]);
    setInvoices([]);
    setInventory([]);
    setEmployees([]);
    setEmployeeLeaves([]);
    setSuperOverview(null);
    setReportSummary(null);
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

  const metrics = {
    patients: patients.length,
    appointments: appointments.length,
    walkins: walkins.filter((w) => w.status !== 'converted').length,
    employees: employees.length,
    revenue: invoices.reduce((sum, x) => sum + Number(x.paid || 0), 0)
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
            onCreateTenant={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createTenant({
                name: fd.get('name'), code: fd.get('code'), subdomain: fd.get('subdomain'),
                primaryColor: fd.get('primaryColor'), accentColor: fd.get('accentColor')
              }));
              e.target.reset();
            }}
            onCreateUser={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.createUser({
                tenantId: fd.get('tenantId'), name: fd.get('name'), email: fd.get('email'), role: fd.get('role')
              }));
            }}
          />
        )}

        {view === 'dashboard' && <DashboardPage metrics={metrics} activeUser={activeUser} />}

        {view === 'patients' && (
          <PatientsPage
            activeUser={activeUser}
            session={session}
            patients={patients}
            activePatient={activePatient}
            activePatientId={activePatientId}
            setActivePatientId={setActivePatientId}
            onCreatePatient={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addPatient({
                tenantId: session.tenantId, userId: activeUser.id,
                firstName: fd.get('firstName'), lastName: fd.get('lastName'), dob: fd.get('dob'),
                gender: fd.get('gender'), phone: fd.get('phone'), email: fd.get('email'),
                address: fd.get('address'), bloodGroup: fd.get('bloodGroup'),
                emergencyContact: fd.get('emergencyContact'), insurance: fd.get('insurance'),
                chronicConditions: fd.get('chronicConditions'), allergies: fd.get('allergies'),
                surgeries: fd.get('surgeries'), familyHistory: fd.get('familyHistory')
              }));
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
            onConvertWalkin={(walkinId) => withRefresh(() => api.convertWalkin(walkinId, { tenantId: session.tenantId, userId: activeUser.id }))}
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
            patients={patients}
            providers={providers}
            onCreateEncounter={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addEncounter({
                tenantId: session.tenantId, userId: activeUser.id,
                patientId: fd.get('patientId'), providerId: fd.get('providerId'), type: fd.get('type'),
                complaint: fd.get('complaint'), diagnosis: fd.get('diagnosis'), notes: fd.get('notes')
              }));
            }}
          />
        )}

        {view === 'billing' && (
          <BillingPage
            patients={patients}
            invoices={invoices}
            onIssueInvoice={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addInvoice({
                tenantId: session.tenantId, userId: activeUser.id,
                patientId: fd.get('patientId'), description: fd.get('description'),
                amount: Number(fd.get('amount')), taxPercent: Number(fd.get('taxPercent') || 0)
              }));
            }}
            onMarkPaid={(invoiceId) => withRefresh(() => api.markInvoicePaid(invoiceId, { tenantId: session.tenantId, userId: activeUser.id }))}
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
            onApplyLeave={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              withRefresh(() => api.addEmployeeLeave(fd.get('employeeId'), {
                tenantId: session.tenantId, from: fd.get('from'), to: fd.get('to'), type: fd.get('type')
              }));
            }}
          />
        )}

        {view === 'reports' && <ReportsPage reportSummary={reportSummary} />}

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
                featureTelehealth: fd.get('featureTelehealth') === 'on'
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
          />
        )}
      </AppLayout>

      <Chatbot context={{
        patients, appointments, walkins, encounters, invoices, inventory,
        employees, employeeLeaves, tenant, activeUser, setView
      }} />
    </>
  );
}
