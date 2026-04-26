// Debug patient API issues
import { query } from './server/db/connection.js';

async function debugPatientAPI() {
  console.log('=== DEBUGGING PATIENT API ISSUES ===\n');
  
  try {
    // 1. Check if patients table exists for this tenant
    const tenantId = '1b13b360-1f8d-4a10-a2c7-bc10cc4cae37';
    console.log('1. Checking patients table for tenant:', tenantId);
    
    try {
      const result = await query(`
        SELECT COUNT(*) as patient_count
        FROM patients 
        WHERE tenant_id::text = $1::text
      `, [tenantId]);
      
      console.log('✅ Patients table exists, count:', result.rows[0].patient_count);
      
      // 2. Test the actual query that's failing
      console.log('\n2. Testing the failing query:');
      try {
        const patientsResult = await query(`
          SELECT 
            p.id, 
            p.first_name as "firstName", 
            p.last_name as "lastName", 
            p.date_of_birth as "dateOfBirth", 
            p.gender, p.phone, p.email, p.address, p.mrn, p.blood_group, 
            p.medical_history as "medicalHistory", 
            p.emergency_contact as "emergencyContact", 
            p.insurance, p.created_at as "createdAt", 
            p.updated_at as "updatedAt", 
            p.is_archived as "isArchived",
            EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age
          FROM patients p
          WHERE p.tenant_id::text = $1::text
          AND p.is_archived = $2
          ORDER BY p.created_at DESC 
          LIMIT $3 OFFSET $4
        `, [tenantId, false, 50, 0]);
        
        console.log('✅ Query successful, returned:', patientsResult.rows.length, 'patients');
        
      } catch (queryError) {
        console.log('❌ Query failed:', queryError.message);
        
        // Check if the issue is with column names
        console.log('\n3. Checking table structure:');
        const structureResult = await query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'patients' 
          ORDER BY ordinal_position
        `);
        
        console.log('Patients table columns:');
        structureResult.rows.forEach(row => {
          console.log(`  ${row.column_name}: ${row.data_type}`);
        });
      }
      
    } catch (tableError) {
      console.log('❌ Patients table error:', tableError.message);
    }
    
    // 3. Check if tenant exists
    console.log('\n4. Checking tenant existence:');
    try {
      const tenantResult = await query(`
        SELECT id, name, code, status 
        FROM nexus.tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      if (tenantResult.rows.length > 0) {
        console.log('✅ Tenant exists:', tenantResult.rows[0]);
      } else {
        console.log('❌ Tenant not found');
      }
    } catch (tenantError) {
      console.log('❌ Tenant check failed:', tenantError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugPatientAPI();
