import { query } from '../server/db/connection.js';

async function checkSpecificModules() {
  console.log(' Checking Specific Modules Status...\n');

  try {
    // Get tenant ID
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

    console.log('=== SPECIFIC MODULES STATUS ===');
    
    // Check Employees
    try {
      const employees = await query('SELECT COUNT(*) as count FROM employees WHERE tenant_id = $1', [tenantId]);
      console.log(` Employees: ${employees.rows[0].count} staff members`);
      
      const employeeDetails = await query('SELECT name, designation, department FROM employees WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log('  Sample staff:');
      employeeDetails.rows.forEach(emp => {
        console.log(`    - ${emp.name} (${emp.designation} - ${emp.department})`);
      });
    } catch (e) {
      console.log(' Employees: Table not found');
    }
    
    // Check Pharmacy Stock
    try {
      const inventory = await query('SELECT COUNT(*) as count FROM inventory_items WHERE tenant_id = $1', [tenantId]);
      console.log(`\n Pharmacy Stock: ${inventory.rows[0].count} medications`);
      
      const stockDetails = await query('SELECT item_name, category, current_stock, reorder_level FROM inventory_items WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log('  Sample medications:');
      stockDetails.rows.forEach(item => {
        console.log(`    - ${item.name} (${item.category}) - Stock: ${item.current_stock}, Reorder at: ${item.reorder_level}`);
      });
    } catch (e) {
      console.log('\n Pharmacy Stock: Table not found');
    }
    
    // Check Prescriptions
    try {
      const prescriptions = await query('SELECT COUNT(*) as count FROM prescriptions WHERE tenant_id = $1', [tenantId]);
      console.log(`\n Prescriptions: ${prescriptions.rows[0].count} prescription records`);
      
      const prescriptionDetails = await query('SELECT medication, dosage, frequency FROM prescriptions WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log('  Sample prescriptions:');
      prescriptionDetails.rows.forEach(rx => {
        console.log(`    - ${rx.medication} (${rx.dosage} - ${rx.frequency})`);
      });
    } catch (e) {
      console.log('\n Prescriptions: Table not found');
    }
    
    // Check Lab/Diagnostics
    try {
      const diagnostics = await query('SELECT COUNT(*) as count FROM diagnostic_reports WHERE tenant_id = $1', [tenantId]);
      console.log(`\n Lab/Diagnostics: ${diagnostics.rows[0].count} diagnostic reports`);
      
      const labDetails = await query('SELECT test_name, status FROM diagnostic_reports WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log('  Sample lab tests:');
      labDetails.rows.forEach(lab => {
        console.log(`    - ${lab.test_name} (${lab.status})`);
      });
    } catch (e) {
      console.log('\n Lab/Diagnostics: Table not found');
    }
    
    // Check Patient Billing
    try {
      const invoices = await query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices WHERE tenant_id = $1', [tenantId]);
      console.log(`\n Patient Billing: ${invoices.rows[0].count} invoices, Total: $${invoices.rows[0].total}`);
      
      const billingDetails = await query('SELECT total, status FROM invoices WHERE tenant_id = $1 LIMIT 5', [tenantId]);
      console.log('  Sample invoices:');
      billingDetails.rows.forEach(inv => {
        console.log(`    - $${inv.total} (${inv.status})`);
      });
    } catch (e) {
      console.log('\n Patient Billing: Table not found');
    }
    
    // Check Accounts Receivable
    try {
      const claims = await query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM claims WHERE tenant_id = $1', [tenantId]);
      console.log(`\n Accounts Receivable: ${claims.rows[0].count} claims, Total: $${claims.rows[0].total}`);
    } catch (e) {
      console.log('\n Accounts Receivable: Table not found');
    }
    
    // Check Accounts Payable
    try {
      const expenses = await query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM expenses WHERE tenant_id = $1', [tenantId]);
      console.log(` Accounts Payable: ${expenses.rows[0].count} expenses, Total: $${expenses.rows[0].total}`);
    } catch (e) {
      console.log(' Accounts Payable: Table not found');
    }

    console.log('\n=== MODULE CONNECTIVITY STATUS ===');
    
    const moduleStatus = {
      employees: false,
      pharmacy: false,
      prescriptions: false,
      diagnostics: false,
      billing: false,
      accounts_receivable: false,
      accounts_payable: false
    };

    // Check each module
    try {
      await query('SELECT COUNT(*) FROM employees WHERE tenant_id = $1', [tenantId]);
      moduleStatus.employees = true;
    } catch (e) {}

    try {
      await query('SELECT COUNT(*) FROM inventory_items WHERE tenant_id = $1', [tenantId]);
      moduleStatus.pharmacy = true;
    } catch (e) {}

    try {
      await query('SELECT COUNT(*) FROM prescriptions WHERE tenant_id = $1', [tenantId]);
      moduleStatus.prescriptions = true;
    } catch (e) {}

    try {
      await query('SELECT COUNT(*) FROM diagnostic_reports WHERE tenant_id = $1', [tenantId]);
      moduleStatus.diagnostics = true;
    } catch (e) {}

    try {
      await query('SELECT COUNT(*) FROM invoices WHERE tenant_id = $1', [tenantId]);
      moduleStatus.billing = true;
    } catch (e) {}

    try {
      await query('SELECT COUNT(*) FROM claims WHERE tenant_id = $1', [tenantId]);
      moduleStatus.accounts_receivable = true;
    } catch (e) {}

    try {
      await query('SELECT COUNT(*) FROM expenses WHERE tenant_id = $1', [tenantId]);
      moduleStatus.accounts_payable = true;
    } catch (e) {}

    console.log(' Employees Module:', moduleStatus.employees ? 'Connected' : 'Disconnected');
    console.log(' Pharmacy Stock Module:', moduleStatus.pharmacy ? 'Connected' : 'Disconnected');
    console.log(' Prescriptions Module:', moduleStatus.prescriptions ? 'Connected' : 'Disconnected');
    console.log(' Lab/Diagnostics Module:', moduleStatus.diagnostics ? 'Connected' : 'Disconnected');
    console.log(' Patient Billing Module:', moduleStatus.billing ? 'Connected' : 'Disconnected');
    console.log(' Accounts Receivable Module:', moduleStatus.accounts_receivable ? 'Connected' : 'Disconnected');
    console.log(' Accounts Payable Module:', moduleStatus.accounts_payable ? 'Connected' : 'Disconnected');

    const connectedModules = Object.values(moduleStatus).filter(Boolean).length;
    const totalModules = Object.keys(moduleStatus).length;
    const connectivityScore = (connectedModules / totalModules) * 100;

    console.log(`\n Overall Module Connectivity: ${connectivityScore.toFixed(1)}%`);
    console.log(` Connected Modules: ${connectedModules}/${totalModules}`);

    return {
      success: true,
      moduleStatus: moduleStatus,
      connectivityScore: connectivityScore
    };

  } catch (error) {
    console.error(' Error checking specific modules:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkSpecificModules().then(result => {
  if (result.success) {
    console.log('\n Specific modules check completed!');
    process.exit(0);
  } else {
    console.log('\n Specific modules check failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Check execution failed:', error);
  process.exit(1);
});
