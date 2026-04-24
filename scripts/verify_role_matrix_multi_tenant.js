import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000/api';
const PASSWORD = 'Test@123';

const TENANTS = [
  { code: 'EHS' },
  { code: 'city_general' },
];

const ROLE_TESTS = [
  {
    key: 'admin',
    role: 'Admin',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
      { name: 'Insurance Providers', method: 'GET', path: () => '/insurance/providers', expect: 200 },
      { name: 'Expenses', method: 'GET', path: () => '/expenses', expect: 200 },
    ],
  },
  {
    key: 'nurse',
    role: 'Nurse',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Reports (Forbidden)', method: 'GET', path: () => '/reports/summary', expect: 403 },
      { name: 'Insurance (Forbidden)', method: 'GET', path: () => '/insurance/providers', expect: 403 },
      { name: 'Expenses (Forbidden)', method: 'GET', path: () => '/expenses', expect: 403 },
    ],
  },
  {
    key: 'lab',
    role: 'Lab',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
      { name: 'Insurance (Forbidden)', method: 'GET', path: () => '/insurance/providers', expect: 403 },
      { name: 'Expenses (Forbidden)', method: 'GET', path: () => '/expenses', expect: 403 },
    ],
  },
  {
    key: 'insurance',
    role: 'Insurance',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Insurance Providers', method: 'GET', path: () => '/insurance/providers', expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
      { name: 'Expenses (Forbidden)', method: 'GET', path: () => '/expenses', expect: 403 },
    ],
  },
  {
    key: 'billing',
    role: 'Billing',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Expenses', method: 'GET', path: () => '/expenses', expect: 200 },
      { name: 'Insurance Providers', method: 'GET', path: () => '/insurance/providers', expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
    ],
  },
  {
    key: 'accounts',
    role: 'Accounts',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Expenses', method: 'GET', path: () => '/expenses', expect: 200 },
      { name: 'Insurance Providers', method: 'GET', path: () => '/insurance/providers', expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
    ],
  },
  {
    key: 'auditor',
    role: 'Auditor',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
      { name: 'Expenses (Forbidden)', method: 'GET', path: () => '/expenses', expect: 403 },
      { name: 'Insurance (Forbidden)', method: 'GET', path: () => '/insurance/providers', expect: 403 },
    ],
  },
  {
    key: 'management',
    role: 'Management',
    checks: [
      { name: 'Bootstrap', method: 'GET', path: (ctx) => `/bootstrap?tenantId=${ctx.tenantId}&userId=${ctx.userId}`, expect: 200 },
      { name: 'Reports', method: 'GET', path: () => '/reports/summary', expect: 200 },
      { name: 'Insurance Providers', method: 'GET', path: () => '/insurance/providers', expect: 200 },
      { name: 'Expenses', method: 'GET', path: () => '/expenses', expect: 200 },
    ],
  },
];

async function apiRequest(path, { method = 'GET', token, tenantId, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) payload = await response.json();
  else payload = await response.text();

  return { status: response.status, payload };
}

async function login(tenantId, email) {
  const res = await apiRequest('/login', {
    method: 'POST',
    body: { tenantId, email, password: PASSWORD },
  });

  if (res.status !== 200 || !res.payload?.token) {
    const detail = typeof res.payload === 'string' ? res.payload : JSON.stringify(res.payload);
    throw new Error(`Login failed for ${email} (${res.status}): ${detail}`);
  }

  return res.payload;
}

async function run() {
  const results = [];

  for (const t of TENANTS) {
    for (const rt of ROLE_TESTS) {
      const email = `${rt.key}.${t.code.toLowerCase()}@emr.local`;
      try {
        const session = await login(t.code, email);
        const context = {
          tenantCode: t.code,
          tenantId: session.tenantId,
          userId: session.user.id,
          role: rt.role,
          email,
        };

        const checkRows = [];
        for (const check of rt.checks) {
          const path = check.path(context);
          const call = await apiRequest(path, {
            method: check.method,
            token: session.token,
            tenantId: session.tenantId,
          });
          const pass = call.status === check.expect;
          checkRows.push({
            check: check.name,
            expected: check.expect,
            actual: call.status,
            pass,
          });
        }

        const passed = checkRows.every((x) => x.pass);
        results.push({
          tenant: t.code,
          role: rt.role,
          email,
          status: passed ? 'PASS' : 'FAIL',
          passedChecks: checkRows.filter((x) => x.pass).length,
          totalChecks: checkRows.length,
          checks: checkRows,
        });
      } catch (err) {
        results.push({
          tenant: t.code,
          role: rt.role,
          email,
          status: 'FAIL',
          passedChecks: 0,
          totalChecks: rt.checks.length,
          checks: [{ check: 'Login', expected: 200, actual: 500, pass: false, error: err.message }],
        });
      }
    }
  }

  console.log('\nRole Access Matrix Summary\n');
  console.table(
    results.map((r) => ({
      tenant: r.tenant,
      role: r.role,
      status: r.status,
      checks: `${r.passedChecks}/${r.totalChecks}`,
      email: r.email,
    }))
  );

  const failures = results.filter((r) => r.status !== 'PASS');
  if (failures.length > 0) {
    console.log('\nFailure Details:\n');
    for (const f of failures) {
      console.log(`${f.tenant} | ${f.role} | ${f.email}`);
      for (const c of f.checks.filter((x) => !x.pass)) {
        console.log(`  - ${c.check}: expected ${c.expected}, got ${c.actual}${c.error ? ` (${c.error})` : ''}`);
      }
    }
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
