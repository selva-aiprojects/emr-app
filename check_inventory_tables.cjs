const { query } = require('./server/db/connection.js');

async function checkInventoryTables() {
  console.log('🔍 Checking inventory tables...');
  
  try {
    // Check inventory-related tables
    const inventoryTables = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'emr' AND (
        table_name ILIKE '%inventory%' OR 
        table_name ILIKE '%stock%' OR
        table_name ILIKE '%pharmacy%'
      )
      ORDER BY table_name
    `);
    
    console.log('📦 Inventory-related tables:');
    inventoryTables.rows.forEach(table => {
      console.log(`  ${table.table_name}: ${table.table_type}`);
    });
    
    // Check structure of key inventory tables
    const tablesToCheck = ['inventory_items', 'inventory_transactions', 'pharmacy_inventory'];
    
    for (const tableName of tablesToCheck) {
      try {
        const struct = await query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'emr' AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `);
        
        if (struct.rows.length > 0) {
          console.log(`\n📋 ${tableName} table structure:`);
          struct.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
          });
        }
      } catch (error) {
        console.log(`❌ Table ${tableName} not found or error:`, error.message);
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking inventory tables:', error);
    process.exit(1);
  }
}

checkInventoryTables();
