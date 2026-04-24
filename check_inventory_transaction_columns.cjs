const { query } = require('./server/db/connection.js');

async function checkInventoryTransactionColumns() {
  console.log('🔍 Checking inventory_transactions columns...');
  
  try {
    // Check exact column names in inventory_transactions
    const columns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'inventory_transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 inventory_transactions columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking inventory_transactions columns:', error);
    process.exit(1);
  }
}

checkInventoryTransactionColumns();
