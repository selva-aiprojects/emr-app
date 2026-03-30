const { query } = require('./server/db/connection.js');

async function checkAdmissionTables() {
  console.log('🔍 Checking admission-related tables...');
  
  try {
    // Check for any admission-related tables
    const admissionTables = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'emr' AND (
        table_name ILIKE '%admission%' OR 
        table_name ILIKE '%encounter%' OR
        table_name ILIKE '%visit%'
      )
      ORDER BY table_name
    `);
    
    console.log('🏥 Admission-related tables:');
    admissionTables.rows.forEach(table => {
      console.log(`  ${table.table_name}: ${table.table_type}`);
    });
    
    // Check if encounters table exists and its structure
    const encounterStruct = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'encounters'
      ORDER BY ordinal_position
    `);
    
    if (encounterStruct.rows.length > 0) {
      console.log('\n📋 Encounters table structure:');
      encounterStruct.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking admission tables:', error);
    process.exit(1);
  }
}

checkAdmissionTables();
