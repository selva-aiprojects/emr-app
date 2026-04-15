/**
 * Subscription Catalog Service
 * Manages plan definitions: pricing, enabled modules, and feature labels.
 * Persists to emr.subscription_catalog if the table exists; falls back to
 * in-memory defaults so the UI is never blocked.
 */

import { query } from './connection.js';

// ─── Canonical module keys that appear in App.jsx allowedViews ───────────────
const ALL_MODULES = [
  { key: 'dashboard',          label: 'Dashboard' },
  { key: 'patients',           label: 'Patient Registry' },
  { key: 'appointments',       label: 'Appointments' },
  { key: 'emr',                label: 'Clinical EMR' },
  { key: 'inpatient',          label: 'Inpatient / IPD' },
  { key: 'pharmacy',           label: 'Pharmacy' },
  { key: 'lab',                label: 'Laboratory' },
  { key: 'billing',            label: 'Billing' },
  { key: 'accounts',           label: 'Accounts' },
  { key: 'accounts_receivable',label: 'Accounts Receivable' },
  { key: 'accounts_payable',   label: 'Accounts Payable' },
  { key: 'insurance',          label: 'Insurance' },
  { key: 'inventory',          label: 'Inventory' },
  { key: 'employees',          label: 'Employees' },
  { key: 'hr',                 label: 'HR Management' },
  { key: 'payroll',            label: 'Payroll' },
  { key: 'reports',            label: 'Reports & Analytics' },
  { key: 'service_catalog',    label: 'Service Catalog' },
  { key: 'ambulance',          label: 'Ambulance' },
  { key: 'donor',              label: 'Blood Bank / Donors' },
  { key: 'bed_management',     label: 'Bed Management' },
  { key: 'departments',        label: 'Departments' },
  { key: 'hospital_settings',  label: 'Hospital Settings' },
  { key: 'communication',      label: 'Communication' },
  { key: 'document_vault',     label: 'Document Vault' },
  { key: 'ai_analysis',        label: 'AI Image Analysis' },
  { key: 'support',            label: 'Support' },
  { key: 'users',              label: 'User Management' },
  { key: 'admin',              label: 'Admin Console' },
];

export { ALL_MODULES };

// ─── Default Catalog (in-memory fallback) ────────────────────────────────────
export const DEFAULT_CATALOG = [
  {
    id: 'free',
    name: 'Starter',
    cost: '0',
    period: 'Forever',
    color: 'slate',
    features: ['Community Support', 'Standard Reports', 'Up to 5 Users'],
    moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','hospital_settings'],
  },
  {
    id: 'basic',
    name: 'Basic',
    cost: '199',
    period: 'per mo',
    color: 'blue',
    features: ['Email Support', 'Advanced Analytics', 'Up to 25 Users'],
    moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','hospital_settings','departments'],
  },
  {
    id: 'professional',
    name: 'Professional',
    cost: '499',
    period: 'per mo',
    color: 'indigo',
    features: ['24/7 Support', 'Custom Branding', 'Unlimited Users'],
    moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','insurance','service_catalog','hospital_settings','departments','bed_management'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    cost: '1299',
    period: 'per mo',
    color: 'emerald',
    features: ['Dedicated Server', 'AI Assistance Matrix', '99.9% SLM Guarantee'],
    moduleKeys: ['dashboard','patients','appointments','emr','reports','admin','users','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','accounts_receivable','accounts_payable','insurance','service_catalog','hospital_settings','departments','bed_management','employees','hr','payroll','donor','ai_analysis','document_vault'],
  },
];

// ─── In-memory cache (survives restarts if DB table missing) ─────────────────
let _memoryCache = null;

export async function getSubscriptionCatalog() {
  try {
    const result = await query(`
      SELECT plan_id as id, name, cost, period, color,
             module_keys  as "moduleKeys",
             features,
             updated_at
      FROM emr.subscription_catalog
      ORDER BY CASE plan_id
        WHEN 'free'         THEN 0
        WHEN 'basic'        THEN 1
        WHEN 'professional' THEN 2
        WHEN 'enterprise'   THEN 3
        ELSE 4
      END
    `);
    if (result.rows.length > 0) {
      _memoryCache = result.rows;
      return result.rows;
    }
  } catch (e) {
    console.warn('[CATALOG] emr.subscription_catalog table not found, using in-memory defaults. Run DB migration to persist.', e.message);
  }
  return _memoryCache || DEFAULT_CATALOG;
}

export async function upsertSubscriptionPlan(plan) {
  const { id, name, cost, period, moduleKeys, features, color } = plan;

  // Always update in-memory cache immediately so UI reflects change this session
  if (_memoryCache) {
    const idx = _memoryCache.findIndex(p => p.id === id);
    if (idx >= 0) _memoryCache[idx] = { ...plan };
    else _memoryCache.push({ ...plan });
  }

  try {
    const sql = `
      INSERT INTO emr.subscription_catalog (plan_id, name, cost, period, module_keys, features, color, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, NOW())
      ON CONFLICT (plan_id) DO UPDATE SET
        name        = EXCLUDED.name,
        cost        = EXCLUDED.cost,
        period      = EXCLUDED.period,
        module_keys = EXCLUDED.module_keys,
        features    = EXCLUDED.features,
        color       = EXCLUDED.color,
        updated_at  = NOW()
      RETURNING *
    `;
    const result = await query(sql, [
      id, name, cost, period,
      JSON.stringify(moduleKeys || []),
      JSON.stringify(features   || []),
      color || 'slate',
    ]);
    return result.rows[0];
  } catch (e) {
    console.warn('[CATALOG] DB persist failed (table missing?) — saved to memory only:', e.message);
    return { id, name, cost, period, moduleKeys, features, color };
  }
}
