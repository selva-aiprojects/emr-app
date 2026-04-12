import { query } from './server/db/connection.js';

async function checkActualSchema() {
  try {
    console.log('=== CHECKING ACTUAL DEMO_EMR SCHEMA ===\n');
    
    // Get all tables in demo_emr schema
    const tables = await query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'demo_emr'
      ORDER BY table_name, ordinal_position
    `);
    
    // Group by table
    const tableStructure = {};
    tables.rows.forEach(row => {
      if (!tableStructure[row.table_name]) {
        tableStructure[row.table_name] = [];
      }
      tableStructure[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      });
    });
    
    console.log('Tables found in demo_emr schema:');
    Object.keys(tableStructure).sort().forEach(tableName => {
      console.log(`\n📋 ${tableName}:`);
      tableStructure[tableName].forEach(col => {
        console.log(`   ${col.column}: ${col.type} (${col.nullable ? 'nullable' : 'not null'})`);
      });
    });
    
    // Check critical tables that should exist
    const requiredTables = [
      'patients', 'employees', 'appointments', 'wards', 'beds', 'admissions', 'discharges',
      'invoices', 'expenses', 'inventory_items', 'prescriptions', 'diagnostic_reports',
      'lab_tests', 'ambulances', 'ambulance_dispatch', 'donors', 'blood_units', 'blood_requests',
      'attendance', 'pharmacy_alerts'
    ];
    
    console.log('\n=== MISSING TABLES ANALYSIS ===');
    const existingTables = Object.keys(tableStructure);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing critical tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    } else {
      console.log('✅ All critical tables exist');
    }
    
    // Check specific column issues
    console.log('\n=== COLUMN ISSUES ANALYSIS ===');
    
    // Check wards table columns
    if (tableStructure.wards) {
      const wardColumns = tableStructure.wards.map(col => col.column);
      console.log('Wards table columns:', wardColumns.join(', '));
      
      if (!wardColumns.includes('capacity')) {
        console.log('❌ Wards table missing "capacity" column');
      }
      if (!wardColumns.includes('floor')) {
        console.log('❌ Wards table missing "floor" column');
      }
    }
    
    // Check expenses table columns
    if (tableStructure.expenses) {
      const expenseColumns = tableStructure.expenses.map(col => col.column);
      console.log('Expenses table columns:', expenseColumns.join(', '));
      
      if (!expenseColumns.includes('approved_by')) {
        console.log('❌ Expenses table missing "approved_by" column');
      }
    }
    
    // Check beds table columns
    if (tableStructure.beds) {
      const bedColumns = tableStructure.beds.map(col => col.column);
      console.log('Beds table columns:', bedColumns.join(', '));
      
      if (!bedColumns.includes('ward_id')) {
        console.log('❌ Beds table missing "ward_id" column');
      }
      if (!bedColumns.includes('patient_id')) {
        console.log('❌ Beds table missing "patient_id" column');
      }
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. Create missing tables using tenant_base_schema.sql');
    console.log('2. Add missing columns to existing tables');
    console.log('3. Populate data based on actual schema structure');
    console.log('4. Test dashboard with corrected schema');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkActualSchema();
