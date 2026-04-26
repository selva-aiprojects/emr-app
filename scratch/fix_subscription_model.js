import fs from 'fs';
import path from 'path';
import { query } from '../server/db/connection.js';

async function updateSubscriptionEngine() {
  const filePath = path.join(process.cwd(), 'client/src/components/superadmin/SubscriptionEngine.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace PLAN_ICONS and PLAN_COLORS
  content = content.replace(
    /const PLAN_ICONS = \{[^\}]+\};/,
    "const PLAN_ICONS = { basic: Box, standard: ShieldCheck, professional: Zap, enterprise: Crown };"
  );
  content = content.replace(
    /const PLAN_COLORS = \{[^\}]+\};/,
    "const PLAN_COLORS = { basic: 'slate', standard: 'blue', professional: 'indigo', enterprise: 'emerald' };"
  );

  // Replace FALLBACK_PLANS
  const fallbackMatch = content.match(/const FALLBACK_PLANS = \[([\s\S]*?)\];/);
  if (fallbackMatch) {
    const newFallback = `const FALLBACK_PLANS = [
  { id: 'basic',        name: 'Basic',        cost: '1999', period: 'per mo', color: 'slate',   moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','hospital_settings'], features: ['Community Support','Standard Reports','Up to 5 Users'] },
  { id: 'standard',     name: 'Standard',     cost: '4999', period: 'per mo', color: 'blue',    moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','hospital_settings','departments'], features: ['Email Support','Advanced Analytics','Up to 25 Users'] },
  { id: 'professional', name: 'Professional', cost: '7999', period: 'per mo', color: 'indigo',  moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','insurance','service_catalog','hospital_settings','departments','bed_management'], features: ['24/7 Support','Custom Branding','Unlimited Users'] },
  { id: 'enterprise',   name: 'Enterprise',   cost: '14999', period: 'per mo', color: 'emerald', moduleKeys: ['dashboard','patients','appointments','emr','reports','admin','users','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','accounts_receivable','accounts_payable','insurance','service_catalog','hospital_settings','departments','bed_management','employees','hr','payroll','donor','ai_analysis','document_vault'], features: ['Dedicated Server','AI Assistance Matrix','99.9% SLA Guarantee'] },
];`;
    content = content.replace(fallbackMatch[0], newFallback);
  }

  // Fix totalRevenue reduce
  content = content.replace(
    /t\.subscription_tier\?\.toLowerCase\(\) \|\| 'free'/g,
    "t.subscription_tier?.toLowerCase() || 'basic'"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated SubscriptionEngine.jsx');
}

async function updateSubscriptionCatalogService() {
  const filePath = path.join(process.cwd(), 'server/db/subscriptionCatalog.service.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace DEFAULT_CATALOG
  const defaultCatalogMatch = content.match(/export const DEFAULT_CATALOG = \[([\s\S]*?)\];/);
  if (defaultCatalogMatch) {
    const newDefaultCatalog = `export const DEFAULT_CATALOG = [
  { id: 'basic', name: 'Basic', cost: '1999', period: 'per mo', color: 'slate', features: ['Community Support', 'Standard Reports', 'Up to 5 Users'], moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','hospital_settings'] },
  { id: 'standard', name: 'Standard', cost: '4999', period: 'per mo', color: 'blue', features: ['Email Support', 'Advanced Analytics', 'Up to 25 Users'], moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','hospital_settings','departments'] },
  { id: 'professional', name: 'Professional', cost: '7999', period: 'per mo', color: 'indigo', features: ['24/7 Support', 'Custom Branding', 'Unlimited Users'], moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','insurance','service_catalog','hospital_settings','departments','bed_management', 'feature_flags', 'system_settings'] },
  { id: 'enterprise', name: 'Enterprise', cost: '14999', period: 'per mo', color: 'emerald', features: ['Dedicated Server', 'AI Assistance Matrix', '99.9% SLM Guarantee'], moduleKeys: ['dashboard','patients','appointments','emr','reports','admin','users','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','accounts_receivable','accounts_payable','insurance','service_catalog','hospital_settings','departments','bed_management','employees','hr','payroll','donor','ai_analysis','document_vault', 'feature_flags', 'system_settings'] },
];`;
    content = content.replace(defaultCatalogMatch[0], newDefaultCatalog);
  }

  // Update SQL query sorting
  content = content.replace(/WHEN 'free'\s+THEN 0/, "WHEN 'basic'        THEN 0");
  content = content.replace(/WHEN 'basic'\s+THEN 1/, "WHEN 'standard'     THEN 1");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated subscriptionCatalog.service.js');
}

async function clearDB() {
  try {
    await query('TRUNCATE TABLE nexus.subscription_catalog RESTART IDENTITY CASCADE');
    console.log('✅ Cleared old subscription_catalog table from DB so new defaults can load.');
  } catch (e) {
    console.log('⚠️ subscription_catalog not found or could not be truncated (may not exist yet).');
  }
}

async function run() {
  await updateSubscriptionEngine();
  await updateSubscriptionCatalogService();
  await clearDB();
  process.exit(0);
}

run();
