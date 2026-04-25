import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Checking nhgl schema structure for reference...\n');
    
    // Check patients table structure in nhgl
    const patientsColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'patients' AND table_schema = 'nhgl'
      ORDER BY ordinal_position
    `);
    
    console.log('👥 Patients table structure in nhgl schema:');
    console.log(JSON.stringify(patientsColumns.rows, null, 2));
    
    // Check users table structure in nhgl
    const usersColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'nhgl'
      ORDER BY ordinal_position
    `);
    
    console.log('\n👥 Users table structure in nhgl schema:');
    console.log(JSON.stringify(usersColumns.rows, null, 2));
    
    // Check sample data in nhgl
    const samplePatients = await query('SELECT * FROM nhgl.patients LIMIT 2');
    console.log('\n📋 Sample patients in nhgl:');
    console.log(JSON.stringify(samplePatients.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
