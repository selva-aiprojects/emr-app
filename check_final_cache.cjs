const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Final Cache State After Trigger Installation ===');
    
    // Check the cache state for NHSL and Starlight
    const cacheCheck = await query(`
      SELECT tenant_id, tenant_name, patients_count, doctors_count, available_beds, available_ambulances, updated_at
      FROM emr.management_tenant_metrics 
      WHERE tenant_id::text IN (SELECT id::text FROM emr.management_tenants WHERE schema_name IN ('nhsl', 'smcmega'))
      ORDER BY updated_at DESC
    `);
    
    console.log('Final cache state:');
    cacheCheck.rows.forEach(c => {
      console.log(`- ${c.tenant_name}:`);
      console.log(`  Patients: ${c.patients_count}`);
      console.log(`  Doctors: ${c.doctors_count}`);
      console.log(`  Beds: ${c.available_beds}`);
      console.log(`  Ambulances: ${c.available_ambulances}`);
      console.log(`  Updated: ${c.updated_at}`);
    });
    
    // Test the superadmin overview function
    console.log('\n=== Testing Superadmin Overview Function ===');
    const { getSuperadminOverview } = require('./server/services/superadminMetrics.service.js');
    const overview = await getSuperadminOverview();
    
    console.log('Superadmin Overview Results:');
    console.log('Total Tenants:', overview.totals.tenants);
    console.log('Total Doctors:', overview.totals.doctors);
    console.log('Total Patients:', overview.totals.patients);
    console.log('Available Beds:', overview.totals.bedsAvailable);
    console.log('Available Ambulances:', overview.totals.ambulancesAvailable);
    
    console.log('\nTarget Tenant Details:');
    overview.tenants.forEach(tenant => {
      if (tenant.name?.toLowerCase().includes('nitra') || tenant.name?.toLowerCase().includes('starlight')) {
        console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
      }
    });
    
    // Test a manual trigger by inserting a test patient
    console.log('\n=== Testing Trigger with Manual Insert ===');
    try {
      const testPatientId = crypto.randomUUID();
      const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
      
      // Insert a test patient to trigger the sync
      await query(`
        INSERT INTO nhsl.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, ethnicity, language, birth_place, is_archived, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        testPatientId,
        nhslTenantId,
        `NHSL_TEST_${Date.now()}`,
        'Test',
        'Patient',
        new Date(1990, 0, 1),
        'Male',
        '9876543210',
        'test@nhsl.local',
        'Test Address',
        'A+',
        'Emergency Contact',
        'Test Insurance',
        JSON.stringify({ conditions: [], medications: [], allergies: [] }),
        'Asian',
        'English',
        'Test City',
        false,
        new Date(),
        new Date()
      ]);
      
      console.log('Test patient inserted, checking if trigger fired...');
      
      // Check if the cache was updated
      setTimeout(async () => {
        const updatedCache = await query(`
          SELECT patients_count, doctors_count, updated_at 
          FROM emr.management_tenant_metrics 
          WHERE tenant_id = $1
        `, [nhslTenantId]);
        
        if (updatedCache.rows.length > 0) {
          console.log('Cache after trigger test:');
          console.log(`  Patients: ${updatedCache.rows[0].patients_count}`);
          console.log(`  Updated: ${updatedCache.rows[0].updated_at}`);
        }
        
        // Clean up test patient
        await query('DELETE FROM nhsl.patients WHERE id = $1', [testPatientId]);
        console.log('Test patient cleaned up');
        
        process.exit(0);
      }, 2000);
      
    } catch (error) {
      console.error('Trigger test failed:', error.message);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
