import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Checking emr schema structure (likely shared tenant schema)...\n');
    
    // Check tables in emr schema
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in emr schema:');
    console.log(JSON.stringify(tables.rows, null, 2));
    
    // Check patients table structure in emr schema
    if (tables.rows.some(t => t.table_name === 'patients')) {
      const patientsColumns = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'patients' AND table_schema = 'emr'
        ORDER BY ordinal_position
      `);
      
      console.log('\n👥 Patients table structure in emr schema:');
      console.log(JSON.stringify(patientsColumns.rows, null, 2));
      
      // Check if there are any existing patients
      const existingPatients = await query('SELECT COUNT(*) as count FROM emr.patients');
      console.log(`\n📊 Existing patients in emr schema: ${existingPatients.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
