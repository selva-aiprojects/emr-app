const { query } = require('./server/db/connection.js');

async function checkTableStructure() {
  console.log('🔍 Checking table structures...');
  
  try {
    // Check actual table structures
    const tables = await Promise.all([
      // Invoices table structure
      query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'emr' AND table_name = 'invoices'
        ORDER BY ordinal_position
      `),
      
      // Pharmacy inventory table structure  
      query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'emr' AND table_name LIKE '%pharmacy%inventory%'
        ORDER BY table_name, ordinal_position
      `),
      
      // Beds table structure
      query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'emr' AND table_name = 'beds'
        ORDER BY ordinal_position
      `)
    ]);
    
    console.log('📋 Invoices table structure:');
    tables[0].rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    console.log('\n📋 Pharmacy inventory tables:');
    tables[1].rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    console.log('\n📋 Beds table structure:');
    tables[2].rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking table structures:', error);
    process.exit(1);
  }
}

checkTableStructure();
