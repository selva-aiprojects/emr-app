// Debug the 500 error in patient API
import { query } from './server/db/connection.js';

async function debugPatient500Error() {
  console.log('=== DEBUGGING PATIENT 500 ERROR ===\n');
  
  try {
    const tenantId = '1b13b360-1f8d-4a10-a2c7-bc10cc4cae37';
    
    // 1. Test the exact query that the repository uses
    console.log('1. Testing repository query:');
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
      
      console.log('✅ Repository query successful:', patientsResult.rows.length, 'patients');
      
    } catch (queryError) {
      console.log('❌ Repository query failed:', queryError.message);
      console.log('Stack:', queryError.stack);
    }
    
    // 2. Test the repository function directly
    console.log('\n2. Testing repository function:');
    try {
      const { getPatients } = await import('./server/db/repository.js');
      const repoResult = await getPatients(tenantId, 'Admin', 50, 0, false, {});
      console.log('✅ Repository function successful:', repoResult.length, 'patients');
      
    } catch (repoError) {
      console.log('❌ Repository function failed:', repoError.message);
      console.log('Stack:', repoError.stack);
    }
    
    // 3. Test the middleware chain
    console.log('\n3. Testing middleware requirements:');
    
    // Check if tenant exists and has proper tier
    try {
      const tenantResult = await query(`
        SELECT id, name, code, subscription_tier, status 
        FROM nexus.tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      if (tenantResult.rows.length > 0) {
        const tenant = tenantResult.rows[0];
        console.log('✅ Tenant exists:', tenant);
        
        // Check if tenant has patients module enabled
        try {
          const moduleResult = await query(`
            SELECT tier_key, feature_key, enabled 
            FROM nexus.features_tiers 
            WHERE tier_key = $1 
            AND feature_key = 'patients' 
            AND enabled = true
          `, [tenant.subscription_tier.toLowerCase()]);
          
          if (moduleResult.rows.length > 0) {
            console.log('✅ Patients module enabled for', tenant.subscription_tier);
          } else {
            console.log('❌ Patients module NOT enabled for', tenant.subscription_tier);
            
            // Show what modules are enabled
            const enabledModules = await query(`
              SELECT feature_key, feature_name 
              FROM nexus.features_tiers 
              WHERE tier_key = $1 
              AND enabled = true
            `, [tenant.subscription_tier.toLowerCase()]);
            
            console.log('Enabled modules for', tenant.subscription_tier, ':');
            enabledModules.rows.forEach(row => {
              console.log(`  - ${row.feature_key}: ${row.feature_name}`);
            });
          }
        } catch (moduleError) {
          console.log('❌ Module check failed:', moduleError.message);
        }
      } else {
        console.log('❌ Tenant not found');
      }
    } catch (tenantError) {
      console.log('❌ Tenant check failed:', tenantError.message);
    }
    
    // 4. Test the actual API endpoint
    console.log('\n4. Testing API endpoint simulation:');
    try {
      // Simulate the middleware chain
      const mockReq = {
        tenantId,
        user: { role: 'Admin' },
        query: { limit: 50, offset: 0, includeArchived: 'false' }
      };
      
      const mockRes = {
        json: (data) => console.log('✅ API would return:', data),
        status: (code) => console.log('❌ API would return status:', code)
      };
      
      // Test the actual route handler
      const { default: patientRoutes } = await import('./server/routes/patient.routes.js');
      console.log('✅ Patient routes loaded');
      
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugPatient500Error();
