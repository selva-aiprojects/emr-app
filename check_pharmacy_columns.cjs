const { query } = require('./server/db/connection.js');

async function checkPharmacyColumns() {
  console.log('🔍 Checking pharmacy inventory columns...');
  
  try {
    // Check exact column names in pharmacy_inventory
    const columns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'pharmacy_inventory'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 pharmacy_inventory columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking pharmacy columns:', error);
    process.exit(1);
  }
}

checkPharmacyColumns();
