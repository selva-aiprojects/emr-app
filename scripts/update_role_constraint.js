import { query } from '../server/db/connection.js';

async function updateConstraints() {
  try {
    console.log('🔄 Updating users_role_check constraint...');
    
    // 1. Drop existing constraint
    await query('ALTER TABLE emr.users DROP CONSTRAINT IF EXISTS users_role_check');
    
    // 2. Add comprehensive constraint
    const sql = `
      ALTER TABLE emr.users ADD CONSTRAINT users_role_check 
      CHECK (role IN (
        'Superadmin', 'Admin', 'Doctor', 'Nurse', 'Front Office', 
        'Billing', 'Inventory', 'Patient', 'Accountant', 'Supervisor', 
        'Lab', 'Pharmacy', 'Insurance', 'Support Staff',
        'Lab Assistant', 'Pharmacist', 'Insurance Clerk', 'Auditor',
        'HR', 'Accounts', 'Management'
      ))
    `;
    await query(sql);
    
    console.log('✅ Constraint updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update constraint:', err);
    process.exit(1);
  }
}

updateConstraints();
