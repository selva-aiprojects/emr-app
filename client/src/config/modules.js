export const moduleMeta = {
  superadmin: { title: 'Superadmin', subtitle: 'Platform-wide control center' },
  dashboard: { title: 'Dashboard', subtitle: 'Operational overview' },
  patients: { title: 'Patients', subtitle: 'Registration and health records' },
  appointments: { title: 'Appointments', subtitle: 'Scheduling, self-booking and walk-ins' },
  emr: { title: 'EMR', subtitle: 'Encounter and charting' },
  inpatient: { title: 'Inpatient', subtitle: 'Admissions and bed management' },
  pharmacy: { title: 'Pharmacy', subtitle: 'Medication dispensing' },
  billing: { title: 'Financial Logistics', subtitle: 'Revenue & Accounts' },
  insurance: { title: 'Insurance Registry', subtitle: 'Claims & Providers' },
  inventory: { title: 'Asset Logistics', subtitle: 'Pharmacy & Supply Chain' },
  employees: { title: 'Employees', subtitle: 'HR, shift, salary and leave' },
  reports: { title: 'Reports', subtitle: 'Periodical and monthly analytics' },
  admin: { title: 'Admin', subtitle: 'Tenant and user management' },
  accounts: { title: 'Accounts Payable', subtitle: 'Expenses and cash flow' },
  lab: { title: 'Laboratory', subtitle: 'Test results and diagnostics' },
  support: { title: 'Support', subtitle: 'Facility assistance and maintenance' },
  users: { title: 'Users', subtitle: 'Global Identity & Access' }
};

export const fallbackPermissions = {
  Superadmin: ['superadmin', 'dashboard', 'reports'],
  Admin: ['dashboard', 'appointments', 'patients', 'emr', 'billing', 'insurance', 'inventory', 'pharmacy', 'lab', 'employees', 'accounts', 'reports', 'admin', 'users'],
  Doctor: ['dashboard', 'appointments', 'patients', 'emr', 'reports'],
  Nurse: ['dashboard', 'appointments', 'patients', 'emr', 'inventory'],
  Lab: ['dashboard', 'patients', 'lab', 'reports'],
  Pharmacy: ['dashboard', 'pharmacy', 'inventory', 'reports'],
  'Support Staff': ['dashboard', 'inventory', 'support'],
  'Front Office': ['dashboard', 'appointments', 'patients', 'billing'],
  Billing: ['dashboard', 'billing', 'accounts', 'insurance', 'reports'],
  Insurance: ['dashboard', 'insurance', 'reports'],
  HR: ['dashboard', 'employees', 'reports'],
  Accounts: ['dashboard', 'billing', 'accounts', 'insurance', 'reports'],
  Management: ['dashboard', 'reports', 'employees', 'billing', 'accounts', 'insurance'],
  Inventory: ['dashboard', 'inventory', 'pharmacy', 'reports'],
  Auditor: ['dashboard', 'reports'],
  Patient: ['dashboard', 'appointments', 'patients']
};
