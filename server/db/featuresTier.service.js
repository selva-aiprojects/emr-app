import { query } from './connection.js';

const TIERS = [
  { key: 'basic', label: 'Tier 1 (OP Only)' },
  { key: 'professional', label: 'Tier 2 (OP+IP)' },
  { key: 'enterprise', label: 'Tier 3 (ERP)' },
];

const XLSX_FEATURES = [
  { key: 'compliances', name: 'Compliances (HIPAA, HL7, ICD-10, DPDP, GDPR)', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: [] },
  { key: 'rbac', name: 'RBAC (Role Based Access Control)', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['admin', 'users'] },
  { key: 'patient_management', name: 'Patient Management', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['patients'] },
  { key: 'doctor_management', name: 'Doctor Management', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['users'] },
  { key: 'opd_appointment_scheduling', name: 'OPD Appointment / Scheduling', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['appointments'] },
  { key: 'opd_consultation', name: 'OPD Consultation', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['emr'] },
  { key: 'prescription_management', name: 'Prescription Management', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['pharmacy'] },
  { key: 'electronic_medical_records', name: 'Electronic Medical Records (EMR)', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['emr'] },
  { key: 'pharmacy', name: 'Pharmacy', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['pharmacy'] },
  { key: 'pharmacy_drug_inventory', name: 'Pharmacy / Drug Inventory', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['inventory'] },
  { key: 'lab_management', name: 'Lab Management', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['lab'] },
  { key: 'billing_only', name: 'Billing Only', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['billing'] },
  { key: 'reports_clinical_financial', name: 'Reports (Clinical & Financial)', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['reports'] },
  { key: 'bulk_data_import', name: 'Bulk Data Import', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['admin'] },
  { key: 'audit_trails_access', name: 'Audit Trails Access', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['admin'] },
  { key: 'facility_settings', name: 'Facility Settings', tiers: { basic: true, professional: true, enterprise: true }, moduleKeys: ['hospital_settings'] },
  { key: 'billing_with_insurance', name: 'Billing with Insurance', tiers: { basic: false, professional: true, enterprise: true }, moduleKeys: ['insurance'] },
  { key: 'revenue_management_institutional', name: 'Revenue Management - Institutional', tiers: { basic: false, professional: true, enterprise: true }, moduleKeys: ['accounts'] },
  { key: 'bed_management', name: 'Bed Management', tiers: { basic: false, professional: true, enterprise: true }, moduleKeys: ['bed_management'] },
  { key: 'theatres_surgery', name: 'Theatres / Surgery', tiers: { basic: false, professional: true, enterprise: true }, moduleKeys: ['inpatient'] },
  { key: 'general_stores_stock_inventory', name: 'General Stores / Stock Inventory', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['inventory'] },
  { key: 'emergency_fleet_control_ambulance', name: 'Emergency Fleet Control (Ambulance)', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['ambulance'] },
  { key: 'blood_bank_hub', name: 'Blood Bank Hub', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['donor'] },
  { key: 'communication_center', name: 'Communication Center', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['communication'] },
  { key: 'records_library', name: 'Records Library', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['documents', 'document_vault'] },
  { key: 'staff_management_hr_payroll', name: 'Staff Management (HR & Payroll)', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['employees', 'hr', 'payroll'] },
  { key: 'financial_accounting', name: 'Financial Accounting', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['accounts', 'accounts_receivable', 'accounts_payable'] },
  { key: 'help_desk_ticketing', name: 'Help Desk / Ticketing', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['support'] },
  { key: 'advanced_analytics', name: 'Advanced Analytics', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['reports'] },
  { key: 'multi_location_support', name: 'Multi-Location Support', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['departments'] },
  { key: 'advanced_security', name: 'Advanced Security', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['admin'] },
  { key: 'api_access', name: 'API Access', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['admin'] },
  { key: 'custom_workflows', name: 'Custom Workflows', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['service_catalog'] },
  { key: 'data_exports', name: 'Data Exports', tiers: { basic: false, professional: false, enterprise: true }, moduleKeys: ['reports'] },
  { key: 'feature_flag_management', name: 'Feature Flag Management', tiers: { basic: false, professional: true, enterprise: true }, moduleKeys: ['feature_flags'] },
  { key: 'system_settings', name: 'System Settings', tiers: { basic: false, professional: true, enterprise: true }, moduleKeys: ['system_settings'] },
];

let _ensured = false;

export async function ensureFeaturesTierTable() {
  if (_ensured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS features_tiers (
      id BIGSERIAL PRIMARY KEY,
      feature_key TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      tier_key TEXT NOT NULL,
      tier_label TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT false,
      module_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
      source_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(feature_key, tier_key)
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_features_tiers_tier_enabled ON features_tiers(tier_key, enabled)`);

  const countRes = await query(`SELECT COUNT(*)::int AS c FROM features_tiers`);
  if ((countRes.rows[0]?.c || 0) === 0) {
    for (let i = 0; i < XLSX_FEATURES.length; i++) {
      const feature = XLSX_FEATURES[i];
      for (const tier of TIERS) {
        await query(`
          INSERT INTO features_tiers
            (feature_key, feature_name, tier_key, tier_label, enabled, module_keys, source_order, updated_at)
          VALUES
            ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW())
        `, [
          feature.key,
          feature.name,
          tier.key,
          tier.label,
          Boolean(feature.tiers?.[tier.key]),
          JSON.stringify(feature.moduleKeys || []),
          i + 1,
        ]);
      }
    }
  }

  _ensured = true;
}

export async function getFeatureTierMatrix() {
  await ensureFeaturesTierTable();
  const res = await query(`
    SELECT feature_key, feature_name, tier_key, tier_label, enabled, module_keys, source_order
    FROM features_tiers
    ORDER BY source_order ASC, feature_name ASC, tier_key ASC
  `);

  const byFeature = new Map();
  for (const row of res.rows) {
    if (!byFeature.has(row.feature_key)) {
      byFeature.set(row.feature_key, {
        featureKey: row.feature_key,
        featureName: row.feature_name,
        moduleKeys: Array.isArray(row.module_keys) ? row.module_keys : [],
        sourceOrder: Number(row.source_order || 0),
        tiers: {},
      });
    }
    const entry = byFeature.get(row.feature_key);
    entry.tiers[row.tier_key] = Boolean(row.enabled);
    if (!entry.moduleKeys?.length && Array.isArray(row.module_keys)) {
      entry.moduleKeys = row.module_keys;
    }
  }

  return {
    tiers: TIERS,
    features: Array.from(byFeature.values()).sort((a, b) => a.sourceOrder - b.sourceOrder),
  };
}

export async function saveFeatureTierMatrix(features = []) {
  await ensureFeaturesTierTable();

  for (const feature of features) {
    const featureKey = String(feature.featureKey || '').trim();
    const featureName = String(feature.featureName || '').trim();
    if (!featureKey || !featureName) continue;

    const moduleKeys = Array.isArray(feature.moduleKeys)
      ? Array.from(new Set(feature.moduleKeys.map((k) => String(k || '').trim()).filter(Boolean)))
      : [];

    for (const tier of TIERS) {
      const enabled = Boolean(feature?.tiers?.[tier.key]);
      await query(`
        INSERT INTO features_tiers
          (feature_key, feature_name, tier_key, tier_label, enabled, module_keys, source_order, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW())
        ON CONFLICT (feature_key, tier_key) DO UPDATE SET
          feature_name = EXCLUDED.feature_name,
          tier_label = EXCLUDED.tier_label,
          enabled = EXCLUDED.enabled,
          module_keys = EXCLUDED.module_keys,
          source_order = EXCLUDED.source_order,
          updated_at = NOW()
      `, [
        featureKey,
        featureName,
        tier.key,
        tier.label,
        enabled,
        JSON.stringify(moduleKeys),
        Number(feature.sourceOrder || 0),
      ]);
    }
  }

  return getFeatureTierMatrix();
}

export async function getDerivedTierModuleMap() {
  try {
    await ensureFeaturesTierTable();
    const res = await query(`
      SELECT tier_key, module_keys
      FROM features_tiers
      WHERE enabled = true
    `);

    const map = {};
    for (const row of res.rows) {
      const tierKey = String(row.tier_key || '').toLowerCase();
      if (!tierKey) continue;
      if (!map[tierKey]) map[tierKey] = new Set();
      const moduleKeys = Array.isArray(row.module_keys) ? row.module_keys : [];
      moduleKeys.forEach((k) => {
        const key = String(k || '').trim();
        if (key) map[tierKey].add(key);
      });
    }

    const out = {};
    Object.keys(map).forEach((k) => {
      out[k] = Array.from(map[k]);
    });
    return out;
  } catch (e) {
    return {};
  }
}

