import { query } from './server/db/connection.js';

async function checkNHGLSchema() {
  try {
    console.log('=== CHECKING NHGL SCHEMA STRUCTURE ===\n');
    
    // Get all tables in both schemas
    const demoTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'demo_emr' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const nhglTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'nhgl' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('DEMO Schema Tables:');
    demoTables.rows.forEach(table => {
      console.log(`  ${table.table_name}`);
    });
    
    console.log(`\nNHGL Schema Tables (${nhglTables.rows.length}):`);
    nhglTables.rows.forEach(table => {
      console.log(`  ${table.table_name}`);
    });
    
    // Find missing tables
    const demoTableNames = demoTables.rows.map(t => t.table_name);
    const nhglTableNames = nhglTables.rows.map(t => t.table_name);
    const missingTables = demoTableNames.filter(table => !nhglTableNames.includes(table));
    
    console.log(`\nMissing Tables in NHGL Schema (${missingTables.length}):`);
    missingTables.forEach(table => {
      console.log(`  ${table}`);
    });
    
    // Check specifically for the tables needed for Reports
    const requiredTables = ['patients', 'appointments', 'invoices', 'beds', 'employees', 'lab_tests', 'blood_units'];
    const missingRequired = requiredTables.filter(table => !nhglTableNames.includes(table));
    
    console.log(`\nMissing Required Tables for Reports:`);
    missingRequired.forEach(table => {
      console.log(`  ${table}`);
    });
    
    if (missingRequired.length > 0) {
      console.log('\n=== RECOMMENDATION ===');
      console.log('NHGL schema is missing critical tables needed for Reports.');
      console.log('Need to create the missing tables in NHGL schema.');
      console.log('The easiest solution is to copy the structure from demo_emr schema.');
    } else {
      console.log('\n=== SUCCESS ===');
      console.log('NHGL schema has all required tables for Reports!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkNHGLSchema();
