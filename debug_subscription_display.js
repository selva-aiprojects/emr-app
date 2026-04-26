// Debug script to check subscription display issues
import { query } from './server/db/connection.js';
import { getSubscriptionCatalog } from './server/db/subscriptionCatalog.service.js';

async function debugSubscriptionDisplay() {
  console.log('=== DEBUGGING SUBSCRIPTION DISPLAY ISSUE ===\n');
  
  try {
    // 1. Check if subscription catalog API would work
    console.log('1. Testing Subscription Catalog Service:');
    const catalog = await getSubscriptionCatalog();
    console.log('Catalog returned:', catalog.length, 'plans');
    catalog.forEach(plan => {
      console.log(`  - ${plan.id}: ${plan.name} ($${plan.cost}/${plan.period})`);
    });
    
    // 2. Check if the public endpoint would work
    console.log('\n2. Testing Public Endpoint Data:');
    const publicData = {
      plans: catalog,
      modules: [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'patients', label: 'Patient Registry' },
        { key: 'appointments', label: 'Appointments' },
        { key: 'emr', label: 'Clinical EMR' },
        { key: 'inpatient', label: 'Inpatient / IPD' },
        { key: 'pharmacy', label: 'Pharmacy' },
        { key: 'lab', label: 'Laboratory' },
        { key: 'billing', label: 'Billing' },
        { key: 'accounts', label: 'Accounts' },
        { key: 'accounts_receivable', label: 'Accounts Receivable' },
        { key: 'accounts_payable', label: 'Accounts Payable' },
        { key: 'insurance', label: 'Insurance' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'employees', label: 'Employees' },
        { key: 'hr', label: 'HR Management' },
        { key: 'payroll', label: 'Payroll' },
        { key: 'reports', label: 'Reports & Analytics' },
        { key: 'service_catalog', label: 'Service Catalog' },
        { key: 'ambulance', label: 'Ambulance' },
        { key: 'donor', label: 'Blood Bank / Donors' },
        { key: 'bed_management', label: 'Bed Management' },
        { key: 'departments', label: 'Departments' },
        { key: 'hospital_settings', label: 'Hospital Settings' },
        { key: 'communication', label: 'Communication' },
        { key: 'document_vault', label: 'Document Vault' },
        { key: 'ai_analysis', label: 'AI Image Analysis' },
        { key: 'support', label: 'Support' },
        { key: 'users', label: 'User Management' },
        { key: 'admin', label: 'Admin Console' },
        { key: 'feature_flags', label: 'Feature Flag Management' },
        { key: 'system_settings', label: 'System Settings' },
      ]
    };
    
    console.log('Public endpoint would return:', publicData);
    console.log('Plans count:', publicData.plans.length);
    console.log('Modules count:', publicData.modules.length);
    
    // 3. Check what the frontend expects
    console.log('\n3. Frontend Expectations:');
    console.log('Expected plans: basic, standard, professional, enterprise');
    console.log('Actual plans:', catalog.map(p => p.id));
    
    // 4. Check for data consistency issues
    console.log('\n4. Data Consistency Check:');
    const expectedPlans = ['basic', 'standard', 'professional', 'enterprise'];
    const actualPlans = catalog.map(p => p.id);
    const missingPlans = expectedPlans.filter(p => !actualPlans.includes(p));
    const extraPlans = actualPlans.filter(p => !expectedPlans.includes(p));
    
    if (missingPlans.length > 0) {
      console.log('Missing plans:', missingPlans);
    }
    if (extraPlans.length > 0) {
      console.log('Extra plans:', extraPlans);
    }
    if (missingPlans.length === 0 && extraPlans.length === 0) {
      console.log('✅ Plans match expectations');
    }
    
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugSubscriptionDisplay();
