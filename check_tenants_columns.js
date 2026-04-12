import { query } from './server/db/connection.js';

async function checkTenantsColumns() {
  try {
    const result = await query('SELECT column_name FROM information_schema.columns WHERE table_name = \'tenants\' AND table_schema = \'emr\' ORDER BY column_name');
    
    console.log('Available columns in emr.tenants:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}`);
    });
    
    console.log('\n=== ANALYSIS ===');
    const columns = result.rows.map(row => row.column_name);
    
    if (columns.includes('shortcode')) {
      console.log('SUCCESS: shortcode column exists');
    } else if (columns.includes('code')) {
      console.log('INFO: Using code column instead of shortcode');
    } else {
      console.log('ISSUE: Neither shortcode nor code column found');
      console.log('Available columns:', columns.join(', '));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTenantsColumns();
