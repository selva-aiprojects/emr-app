import { query } from '../server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fixModuleData() {
  console.log(' Fixing Module Data Issues...\n');

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
    console.log(` Using tenant ID: ${tenantId}`);

    // Get existing data
    const [patients, departments] = await Promise.all([
      query('SELECT id, first_name, last_name FROM patients WHERE tenant_id = $1 LIMIT 100', [tenantId]),
      query('SELECT id, name FROM departments WHERE tenant_id = $1', [tenantId])
    ]);

    console.log(` Found ${patients.rows.length} patients, ${departments.rows.length} departments`);

    // 1. FIX EMPLOYEES MODULE
    console.log(' 1. FIXING EMPLOYEES MODULE...');
    
    const employeeData = [
      { name: 'Dr. Rajesh Kumar', designation: 'Senior Doctor', department: 'General Medicine', email: 'rajesh@demo.hospital', phone: '+91-9876543201', salary: 120000, join_date: '2023-01-15', code: 'DOC001' },
      { name: 'Dr. Priya Sharma', designation: 'Consultant Doctor', department: 'Cardiology', email: 'priya@demo.hospital', phone: '+91-9876543202', salary: 150000, join_date: '2022-06-20', code: 'DOC002' },
      { name: 'Nurse Anita Desai', designation: 'Head Nurse', department: 'General Medicine', email: 'anita@demo.hospital', phone: '+91-9876543203', salary: 60000, join_date: '2023-03-10', code: 'NUR001' },
      { name: 'Nurse Ravi Patel', designation: 'Staff Nurse', department: 'Emergency', email: 'ravi@demo.hospital', phone: '+91-9876543204', salary: 45000, join_date: '2023-08-15', code: 'NUR002' },
      { name: 'Meera Reddy', designation: 'Pharmacist', department: 'Pharmacy', email: 'meera@demo.hospital', phone: '+91-9876543205', salary: 55000, join_date: '2022-11-30', code: 'PHM001' },
      { name: 'Arun Singh', designation: 'Lab Technician', department: 'Laboratory', email: 'arun@demo.hospital', phone: '+91-9876543206', salary: 40000, join_date: '2023-04-20', code: 'LAB001' },
      { name: 'Sunita Devi', designation: 'Billing Executive', department: 'Billing', email: 'sunita@demo.hospital', phone: '+91-9876543207', salary: 35000, join_date: '2023-02-28', code: 'BIL001' },
      { name: 'Deepak Kumar', designation: 'HR Manager', department: 'Administration', email: 'deepak@demo.hospital', phone: '+91-9876543208', salary: 80000, join_date: '2022-09-15', code: 'HRM001' }
    ];

    for (const emp of employeeData) {
      try {
        // Check if employee already exists
        const existingEmp = await query('SELECT id FROM employees WHERE tenant_id = $1 AND email = $2', [tenantId, emp.email]);
        
        if (existingEmp.rows.length === 0) {
          await query(
            `INSERT INTO emr.employees 
             (tenant_id, name, designation, department, email, phone, salary, join_date, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
            [
              tenantId, emp.name, emp.designation, emp.department, emp.email, 
              emp.phone, emp.salary, emp.join_date
            ]
          );
          console.log(`  Created employee: ${emp.name}`);
        } else {
          console.log(`  Employee already exists: ${emp.name}`);
        }
      } catch (error) {
        console.log(`  Error with ${emp.name}: ${error.message}`);
      }
    }

    // 2. FIX PHARMACY STOCK MODULE
    console.log(' 2. FIXING PHARMACY STOCK MODULE...');
    
    const pharmacyStock = [
      { name: 'Paracetamol 500mg', category: 'Analgesics', current_stock: 500, reorder_level: 100, unit: 'tablets', code: 'PAR001' },
      { name: 'Ibuprofen 400mg', category: 'Analgesics', current_stock: 300, reorder_level: 80, unit: 'tablets', code: 'IBU001' },
      { name: 'Amoxicillin 500mg', category: 'Antibiotics', current_stock: 200, reorder_level: 50, unit: 'capsules', code: 'AMX001' },
      { name: 'Azithromycin 250mg', category: 'Antibiotics', current_stock: 150, reorder_level: 40, unit: 'tablets', code: 'AZI001' },
      { name: 'Insulin Glardine', category: 'Diabetes', current_stock: 45, reorder_level: 20, unit: 'vials', code: 'INS001' },
      { name: 'Metformin 500mg', category: 'Diabetes', current_stock: 800, reorder_level: 200, unit: 'tablets', code: 'MET001' },
      { name: 'Amlodipine 5mg', category: 'Cardiovascular', current_stock: 250, reorder_level: 60, unit: 'tablets', code: 'AML001' },
      { name: 'Atorvastatin 10mg', category: 'Cardiovascular', current_stock: 180, reorder_level: 50, unit: 'tablets', code: 'ATO001' },
      { name: 'Omeprazole 20mg', category: 'GI Drugs', current_stock: 350, reorder_level: 70, unit: 'capsules', code: 'OME001' },
      { name: 'Albuterol Inhaler', category: 'Respiratory', current_stock: 80, reorder_level: 25, unit: 'inhalers', code: 'ALB001' },
      { name: 'Salbutamol Syrup', category: 'Status: Respiratory', current_stock: 120, reorder_level: 30, unit: 'bottles', code: 'SAL001' },
      { name: 'Hydrochlorothiazide 25mg', category: 'Diuretics', current_stock: 200, reorder_level: 50, unit: 'tablets', code: 'HCT001' },
      { name: 'Metoprolol 50mg', category: 'Cardiovascular', current_stock: 220, reorder_level: 60, unit: 'tablets', code: 'MET002' },
      { name: 'Losartan 50mg', category: 'Cardiovascular', current_stock: 160, reorder_level: 40, unit: 'tablets', code: 'LOS001' },
      { name: 'Gabapentin 300mg', category: 'Neurological', current_stock: 140, reorder_level: 35, unit: 'capsules', code: 'GAB001' },
      { name: 'Sertraline 50mg', category: 'Psychiatric', current_stock: 100, reorder_level: 25, unit: 'tablets', code: 'SER001' },
      { name: 'Levothyroxine 50mcg', category: 'Endocrine', current_stock: 180, reorder_level: 45, unit: 'tablets', code: 'LEV001' }
    ];

    for (const stock of pharmacyStock) {
      try {
        // Check if item already exists
        const existingItem = await query('SELECT id FROM inventory_items WHERE tenant_id = $1 AND item_code = $2', [tenantId, stock.code]);
        
        if (existingItem.rows.length === 0) {
          await query(
            `INSERT INTO emr.inventory_items 
             (tenant_id, name, category, current_stock, reorder_level, unit, item_code, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [
              tenantId, stock.name, stock.category, stock.current_stock, stock.reorder_level,
              stock.unit, stock.code
            ]
          );
          console.log(`  Created pharmacy item: ${stock.name} (Stock: ${stock.current_stock})`);
        } else {
          console.log(`  Pharmacy item already exists: ${stock.name} (Stock: ${stock.current_stock})`);
        }
      } catch (error) {
        console.log(`  Error with ${stock.name}: ${error.message}`);
      }
    }

    // 3. FIX PRESCRIPTIONS MODULE
    console.log(' 3. FIXING PRESCRIPTIONS MODULE...');
    
    const medications = [
      'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Insulin', 'Metformin',
      'Amlodipine', 'Atorvastatin', 'Omeprazole', 'Albuterol', 'Hydrochlorothiazide',
      'Metoprolol', 'Losartan', 'Gabapentin', 'Sertraline', 'Levothyroxine'
    ];

    for (let i = 0; i < 100; i++) {
      const patient = getRandomItem(patients.rows);
      const prescriptionDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const medication = getRandomItem(medications);
      
      try {
        await query(
          `INSERT INTO emr.prescriptions 
           (tenant_id, patient_id, drug_name, dosage, frequency, duration, instructions, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW())`,
          [
            tenantId,
            patient.id,
            medication,
            `${getRandomInt(50, 500)}mg`,
            getRandomItem(['Once daily', 'Twice daily', 'Three times daily', 'As needed']),
            `${getRandomInt(5, 30)} days`,
            getRandomItem(['Take with food', 'Take on empty stomach', 'Take before bedtime']),
            prescriptionDate.toISOString()
          ]
        );
        console.log(`  Created prescription for patient: ${patient.first_name} ${patient.last_name}`);
      } catch (error) {
        console.log(`  Error with prescription ${i + 1}: ${error.message}`);
      }
    }

    // 4. FIX BILLING MODULE
    console.log(' 4. FIXING BILLING MODULE...');
    
    const billingServices = [
      'General Consultation', 'Specialist Consultation', 'Emergency Room Visit',
      'Complete Blood Count', 'X-Ray Chest', 'CT Scan', 'MRI', 'ECG', 'Ultrasound',
      'Pathology Tests', 'Vaccination', 'Minor Procedure', 'Physical Therapy'
    ];

    for (let i = 0; i < 50; i++) {
      const patient = getRandomItem(patients.rows);
      const invoiceDate = getRandomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date());
      const serviceCount = getRandomInt(1, 4);
      let totalAmount = 0;
      
      for (let j = 0; j < serviceCount; j++) {
        totalAmount += getRandomFloat(100, 2000);
      }

      const status = getRandomInt(1, 100) <= 75 ? 'paid' : (getRandomInt(1, 100) <= 50 ? 'pending' : 'overdue');
      
      try {
        await query(
          `INSERT INTO emr.invoices 
           (tenant_id, patient_id, total, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            tenantId,
            patient.id,
            totalAmount,
            status,
            invoiceDate.toISOString()
          ]
        );
        console.log(`  Created invoice for patient: ${patient.first_name} ${patient.last_name} - $${totalAmount}`);
      } catch (error) {
        console.log(`  Error with invoice ${i + 1}: ${error.message}`);
      }
    }

    console.log('\n Module data fixing completed!');
    console.log('\n Summary:');
    console.log(` Employees: ${employeeData.length} staff members`);
    console.log(` Pharmacy Stock: ${pharmacyStock.length} medications`);
    console.log(` Prescriptions: 100 prescription records`);
    console.log(` Patient Billing: 50 invoices`);

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    
    const [finalEmployees, finalInventory, finalPrescriptions, finalInvoices] = await Promise.all([
      query('SELECT COUNT(*) as count FROM employees WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM inventory_items WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM prescriptions WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1', [tenantId])
    ]);

    console.log(` Final Employee Count: ${finalEmployees.rows[0].count}`);
    console.log(` Final Pharmacy Count: ${finalInventory.rows[0].count}`);
    console.log(` Final Prescription Count: ${finalPrescriptions.rows[0].count}`);
    console.log(` Final Invoice Count: ${finalInvoices.rows[0].count}`);

    return {
      success: true,
      employees: finalEmployees.rows[0].count,
      pharmacyStock: finalInventory.rows[0].count,
      prescriptions: finalPrescriptions.rows[0].count,
      billing: finalInvoices.rows[0].count
    };

  } catch (error) {
    console.error(' Error fixing module data:', error);
    return { success: false, error: error.message };
  }
}

// Run the fix
fixModuleData().then(result => {
  if (result.success) {
    console.log('\n Module data fixing completed successfully!');
    console.log(' All modules should now be properly populated with data.');
    process.exit(0);
  } else {
    console.log('\n Module data fixing failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Fix execution failed:', error);
  process.exit(1);
});
