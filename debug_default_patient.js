import { query } from './server/db/connection.js';

async function debugDefaultPatient() {
  try {
    console.log('=== DEBUG DEFAULT PATIENT ISSUE ===');
    
    // 1. Check all patients in the system
    console.log('\n--- STEP 1: Check All Patients ---');
    
    const allPatients = await query(`
      SELECT id, tenant_id, mrn, first_name, last_name, email, created_at, updated_at
      FROM emr.patients 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Total patients found: ${allPatients.rowCount}`);
    allPatients.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.first_name} ${patient.last_name} (${patient.mrn})`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Tenant: ${patient.tenant_id}`);
      console.log(`   Email: ${patient.email}`);
      console.log(`   Created: ${patient.created_at}`);
      console.log(`   Updated: ${patient.updated_at}`);
    });
    
    // 2. Check for any test or default patients
    console.log('\n--- STEP 2: Check for Test Patients ---');
    
    const testPatients = await query(`
      SELECT id, tenant_id, mrn, first_name, last_name, email, created_at
      FROM emr.patients 
      WHERE first_name ILIKE '%test%' 
         OR last_name ILIKE '%test%'
         OR email ILIKE '%test%'
         OR mrn ILIKE '%test%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Test patients found: ${testPatients.rowCount}`);
    testPatients.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.first_name} ${patient.last_name} (${patient.mrn})`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Tenant: ${patient.tenant_id}`);
      console.log(`   Email: ${patient.email}`);
      console.log(`   Created: ${patient.created_at}`);
    });
    
    // 3. Check patients by tenant to see if there's a specific tenant with default patients
    console.log('\n--- STEP 3: Check Patients by Tenant ---');
    
    const tenantsWithPatients = await query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        COUNT(p.id) as patient_count,
        MAX(p.created_at) as latest_patient_created
      FROM emr.tenants t
      LEFT JOIN emr.patients p ON t.id::text = p.tenant_id::text
      GROUP BY t.id, t.name
      ORDER BY patient_count DESC
    `);
    
    console.log('Tenants with patients:');
    tenantsWithPatients.rows.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.tenant_name} (${tenant.tenant_id})`);
      console.log(`   Patient Count: ${tenant.patient_count}`);
      console.log(`   Latest Patient: ${tenant.latest_patient_created}`);
    });
    
    // 4. Check if there are any recently created patients (last 24 hours)
    console.log('\n--- STEP 4: Check Recently Created Patients ---');
    
    const recentPatients = await query(`
      SELECT id, tenant_id, mrn, first_name, last_name, email, created_at
      FROM emr.patients 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `);
    
    console.log(`Recent patients (last 24 hours): ${recentPatients.rowCount}`);
    recentPatients.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.first_name} ${patient.last_name} (${patient.mrn})`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Tenant: ${patient.tenant_id}`);
      console.log(`   Created: ${patient.created_at}`);
    });
    
    // 5. Check for any auto-creation triggers
    console.log('\n--- STEP 5: Check for Auto-Creation Patterns ---');
    
    // Check if there are any seed scripts that might be running
    const potentialAutoPatients = await query(`
      SELECT id, tenant_id, mrn, first_name, last_name, email, created_at
      FROM emr.patients 
      WHERE (
        first_name ILIKE '%direct%' 
        OR first_name ILIKE '%default%'
        OR first_name ILIKE '%test%'
        OR mrn ILIKE '%default%'
        OR mrn ILIKE '%test%'
      )
      AND created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `);
    
    console.log(`Potential auto-created patients (last 7 days): ${potentialAutoPatients.rowCount}`);
    potentialAutoPatients.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.first_name} ${patient.last_name} (${patient.mrn})`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Tenant: ${patient.tenant_id}`);
      console.log(`   Email: ${patient.email}`);
      console.log(`   Created: ${patient.created_at}`);
    });
    
    // 6. Check if there are any duplicate MRNs
    console.log('\n--- STEP 6: Check for Duplicate MRNs ---');
    
    const duplicateMrns = await query(`
      SELECT mrn, COUNT(*) as count, STRING_AGG(id, ', ') as patient_ids
      FROM emr.patients 
      WHERE mrn IS NOT NULL
      GROUP BY mrn
      HAVING COUNT(*) > 1
    `);
    
    console.log(`Duplicate MRNs found: ${duplicateMrns.rowCount}`);
    duplicateMrns.rows.forEach((dup, index) => {
      console.log(`${index + 1}. MRN: ${dup.mrn}`);
      console.log(`   Count: ${dup.count}`);
      console.log(`   Patient IDs: ${dup.patient_ids}`);
    });
    
    // 7. Final diagnosis
    console.log('\n--- FINAL DIAGNOSIS ---');
    
    console.log('POSSIBLE CAUSES FOR DEFAULT PATIENT REAPPEARING:');
    console.log('1. Auto-creation script running periodically');
    console.log('2. Seed data being re-inserted');
    console.log('3. Frontend state not clearing properly');
    console.log('4. Backend creating default patient on load');
    console.log('5. Test data being restored from backup');
    
    console.log('\nRECOMMENDATIONS:');
    console.log('1. Check for any cron jobs or scheduled tasks');
    console.log('2. Verify seed scripts are not running in production');
    console.log('3. Check frontend state management for patient selection');
    console.log('4. Verify database triggers or default values');
    console.log('5. Check if patient deletion is actually working');
    
    if (potentialAutoPatients.rowCount > 0) {
      console.log('\n🔍 LIKELY ISSUE: Auto-creation detected!');
      console.log('There are patients that appear to be auto-created.');
      console.log('Check for any background processes or seed scripts.');
    }
    
    if (recentPatients.rowCount > 0) {
      console.log('\n🔍 LIKELY ISSUE: Recent creation detected!');
      console.log('Patients are being created recently.');
      console.log('Check for any automated processes.');
    }
    
  } catch (error) {
    console.error('Error debugging default patient:', error.message);
  }
}

debugDefaultPatient().then(() => process.exit(0));
