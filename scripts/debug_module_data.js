import { query } from '../server/db/connection.js';

async function debugModuleData() {
  console.log(' Debugging Module Data...\n');

  try {
    const tenantResult = await query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(` Found DEMO tenant with ID: ${tenantId}\n`);

    console.log('=== DEBUGGING MODULE DATA ===');

    // Debug Employees
    console.log('1. EMPLOYEES DEBUG:');
    try {
      const employeeCount = await query('SELECT COUNT(*) as count FROM employees WHERE tenant_id = $1', [tenantId]);
      console.log(`   Employee count: ${employeeCount.rows[0].count}`);
      
      if (employeeCount.rows[0].count > 0) {
        const employeeSample = await query('SELECT name, designation FROM employees WHERE tenant_id = $1 LIMIT 3', [tenantId]);
        console.log('   Sample employees:');
        employeeSample.rows.forEach(emp => {
          console.log(`     - ${emp.name} (${emp.designation})`);
        });
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

    // Debug Pharmacy
    console.log('\n2. PHARMACY STOCK DEBUG:');
    try {
      const pharmacyCount = await query('SELECT COUNT(*) as count FROM inventory_items WHERE tenant_id = $1', [tenantId]);
      console.log(`   Pharmacy stock count: ${pharmacyCount.rows[0].count}`);
      
      if (pharmacyCount.rows[0].count > 0) {
        const pharmacySample = await query('SELECT name, category, current_stock FROM inventory_items WHERE tenant_id = $1 LIMIT 3', [tenantId]);
        console.log('   Sample pharmacy items:');
        pharmacySample.rows.forEach(item => {
          console.log(`     - ${item.name} (${item.category}) - Stock: ${item.current_stock}`);
        });
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

    // Debug Prescriptions
    console.log('\n3. PRESCRIPTIONS DEBUG:');
    try {
      const prescriptionCount = await query('SELECT COUNT(*) as count FROM prescriptions WHERE tenant_id = $1', [tenantId]);
      console.log(`   Prescription count: ${prescriptionCount.rows[0].count}`);
      
      if (prescriptionCount.rows[0].count > 0) {
        const prescriptionSample = await query('SELECT drug_name, dosage FROM prescriptions WHERE tenant_id = $1 LIMIT 3', [tenantId]);
        console.log('   Sample prescriptions:');
        prescriptionSample.rows.forEach(rx => {
          console.log(`     - ${rx.drug_name} (${rx.dosage})`);
        });
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

    // Check if data actually exists
    console.log('\n=== RAW DATA VERIFICATION ===');
    
    try {
      const allEmployees = await query('SELECT * FROM employees WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log(`   Raw employee records: ${allEmployees.rows.length}`);
      if (allEmployees.rows.length > 0) {
        console.log('   First employee record:', allEmployees.rows[0]);
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

    try {
      const allInventory = await query('SELECT * FROM inventory_items WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log(`   Raw inventory records: ${allInventory.rows.length}`);
      if (allInventory.rows.length > 0) {
        console.log('   First inventory record:', allInventory.rows[0]);
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

    try {
      const allPrescriptions = await query('SELECT * FROM prescriptions WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log(`   Raw prescription records: ${allPrescriptions.rows.length}`);
      if (allPrescriptions.rows.length > 0) {
        console.log('   First prescription record:', allPrescriptions.rows[0]);
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

    try {
      const allDiagnostics = await query('SELECT * FROM diagnostic_reports WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log(`   Raw diagnostic records: ${allDiagnostics.rows.length}`);
      if (allDiagnostics.rows.length > 0) {
        console.log('   First diagnostic record:', allDiagnostics.rows[0]);
      }
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }

  } catch (error) {
    console.error(' Debug failed:', error.message);
  }
}

// Run the debug
debugModuleData().then(() => {
  console.log('\n Debug completed!');
  process.exit(0);
}).catch(error => {
  console.error(' Debug execution failed:', error);
  process.exit(1);
});
