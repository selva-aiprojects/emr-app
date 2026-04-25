import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Checking key table structures for patient journey flow...\n');
    
    // Check patients table
    const patients = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log('PATIENTS table:');
    console.log(JSON.stringify(patients.rows, null, 2));
    
    // Check appointments table
    const appointments = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log('\nAPPOINTMENTS table:');
    console.log(JSON.stringify(appointments.rows, null, 2));
    
    // Check encounters table
    const encounters = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'encounters' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log('\nENCOUNTERS table:');
    console.log(JSON.stringify(encounters.rows, null, 2));
    
    // Check users table
    const users = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log('\nUSERS table:');
    console.log(JSON.stringify(users.rows, null, 2));
    
    // Check departments table
    const departments = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'departments' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log('\nDEPARTMENTS table:');
    console.log(JSON.stringify(departments.rows, null, 2));
    
    // Check beds table
    const beds = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'beds' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log('\nBEDS table:');
    console.log(JSON.stringify(beds.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
