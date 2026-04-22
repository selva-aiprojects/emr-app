import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:4005/api';

async function fetchJson(request, url, options = {}) {
  const res = await request.fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { res, body };
}

async function getTenantMap(request) {
  const { res, body } = await fetchJson(request, `${API_BASE}/tenants`);
  expect(res.ok()).toBeTruthy();
  const tenants = Array.isArray(body?.value || body) ? (body?.value || body) : [];
  return {
    all: tenants,
    city: tenants.find((t) => /city general hospital|kidz clinic/i.test(t.name) || /city_general|kc/i.test(t.code)),
    valley: tenants.find((t) => /valley health clinic|new age hospital/i.test(t.name) || /valley|nah/i.test(t.code)),
    ehs: tenants.find((t) => /enterprise hospital systems|new age/i.test(t.name) || /ehs|nah/i.test(t.code)),
  };
}

async function login(request, tenantId, email, password) {
  const { res, body } = await fetchJson(request, `${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, email, password }),
  });
  expect(res.ok(), `Login failed for ${email}`).toBeTruthy();
  expect(body?.token).toBeTruthy();
  expect(body?.user?.id).toBeTruthy();
  return body;
}

test.describe('FRD Security Regression', () => {
  test('FR-02: cross-tenant bootstrap is denied', async ({ request }) => {
    const tenants = await getTenantMap(request);
    expect(tenants.city?.id).toBeTruthy();
    expect(tenants.valley?.id).toBeTruthy();

    const session = await login(request, tenants.city.id, 'emily.chen@citygen.local', 'Test@123');

    const { res, body } = await fetchJson(
      request,
      `${API_BASE}/bootstrap?tenantId=${tenants.valley.id}&userId=${session.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'x-tenant-id': tenants.valley.id,
        },
      }
    );

    expect(res.status()).toBe(403);
    expect(body?.error).toBe('Forbidden');
  });

  test('FR-03: role without billing permission cannot create invoice', async ({ request }) => {
    const tenants = await getTenantMap(request);
    expect(tenants.city?.id).toBeTruthy();

    const session = await login(request, tenants.city.id, 'jessica.taylor@citygen.local', 'Test@123');

    const { res, body } = await fetchJson(request, `${API_BASE}/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'x-tenant-id': tenants.city.id,
      },
      data: {
        tenantId: tenants.city.id,
        patientId: '00000000-0000-0000-0000-000000000000',
        amount: 150,
      },
    });

    expect(res.status()).toBe(403);
    expect(body?.error).toBe('Forbidden');
  });

  test('FR-02/FR-06: superadmin tenant access requires break-glass headers', async ({ request }) => {
    const tenants = await getTenantMap(request);
    expect(tenants.city?.id).toBeTruthy();

    const superadmin = await login(request, 'superadmin', 'superadmin@emr.local', 'Admin@123');

    const noBreakGlass = await fetchJson(request, `${API_BASE}/tenants/${tenants.city.id}/features`, {
      headers: {
        Authorization: `Bearer ${superadmin.token}`,
      },
    });

    expect(noBreakGlass.res.status()).toBe(403);
    expect(noBreakGlass.body?.code).toBe('REQUIRES_BREAK_GLASS');

    const withBreakGlass = await fetchJson(request, `${API_BASE}/tenants/${tenants.city.id}/features`, {
      headers: {
        Authorization: `Bearer ${superadmin.token}`,
        'x-break-glass': 'true',
        'x-break-glass-reason': 'FRD regression validation',
      },
    });

    expect(withBreakGlass.res.ok()).toBeTruthy();
  });

  test('FR-03: role without reports permission is blocked from reports API', async ({ request }) => {
    const tenants = await getTenantMap(request);
    expect(tenants.city?.id).toBeTruthy();

    const nurse = await login(request, tenants.city.id, 'sarah.jones@citygen.local', 'Test@123');

    const { res, body } = await fetchJson(request, `${API_BASE}/reports/summary?tenantId=${tenants.city.id}`, {
      headers: {
        Authorization: `Bearer ${nurse.token}`,
        'x-tenant-id': tenants.city.id,
      },
    });

    expect(res.status()).toBe(403);
    expect(body?.error).toBe('Forbidden');
  });
});
