// Debug script to check patient creation error
import { query } from './server/db/connection.js';

async function debugPatientCreation() {
  console.log('=== DEBUGGING PATIENT CREATION ERROR ===\n');
  
  try {
    // 1. Check if mrn_sequences table exists
    console.log('1. Checking mrn_sequences table:');
    try {
      const result = await query('SELECT COUNT(*) as count FROM mrn_sequences');
      console.log('✅ mrn_sequences table exists, records:', result.rows[0].count);
    } catch (error) {
      console.log('❌ mrn_sequences table does not exist:', error.message);
    }
    
    // 2. Check patients table structure
    console.log('\n2. Checking patients table structure:');
    try {
      const result = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        ORDER BY ordinal_position
      `);
      console.log('Patients table columns:');
      result.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } catch (error) {
      console.log('❌ Error checking patients table:', error.message);
    }
    
    // 3. Test MRN generation
    console.log('\n3. Testing MRN generation:');
    try {
      const { generateMRN } = await import('./server/db/tenant.service.js');
      const testTenantId = '7e05aa09-5c7c-43e8-8ca9-f5a9d5a47345'; // HSHL tenant
      const mrn = await generateMRN(testTenantId);
      console.log('✅ MRN generation successful:', mrn);
    } catch (error) {
      console.log('❌ MRN generation failed:', error.message);
    }
    
    // 4. Test patient creation
    console.log('\n4. Testing patient creation:');
    try {
      const { createPatient } = await import('./server/db/patient.service.js');
      const testPatient = await createPatient({
        tenantId: '7e05aa09-5c7c-43e8-8ca9-f5a9d5a47345',
        firstName: 'Test',
        lastName: 'Patient',
        dob: '1990-01-01',
        gender: 'Male',
        phone: '1234567890',
        email: 'test@example.com',
        address: '123 Test St',
        bloodGroup: 'A+',
        emergencyContact: 'Test Contact',
        insurance: 'Test Insurance',
        medicalHistory: {}
      });
      console.log('✅ Patient creation successful:', testPatient.mrn);
    } catch (error) {
      console.log('❌ Patient creation failed:', error.message);
      console.log('Error details:', error.stack);
    }
    
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugPatientCreation();
