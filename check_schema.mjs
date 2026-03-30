import { query } from './server/db/connection.js';

async function checkAmbulanceSchema() {
  try {
    console.log('🔍 Checking ambulance table schema...');
    
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ambulances' 
      AND table_schema = 'emr'
      ORDER BY ordinal_position
    `);

    console.log('📋 Ambulance table schema:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
  process.exit(0);
}

checkAmbulanceSchema();
