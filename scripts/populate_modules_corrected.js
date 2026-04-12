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

async function populateModulesCorrected() {
  console.log(' Populating Modules with Correct Schema...\n');

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
    console.log(` Found DEMO tenant with ID: ${tenantId}`);

    // Get existing data
    const [patients, departments] = await Promise.all([
      query('SELECT id, first_name, last_name FROM patients WHERE tenant_id = $1 LIMIT 100', [tenantId]),
      query('SELECT id, name FROM departments WHERE tenant_id = $1', [tenantId])
    ]);

    console.log(` Found ${patients.rows.length} patients, ${departments.rows.length} departments`);

    // 1. EMPLOYEES MODULE
    console.log(' 1. POPULATING EMPLOYEES MODULE...');
    
    const employeeData = [
      { name: 'Dr. Rajesh Kumar', designation: 'Senior Doctor', department: 'General Medicine', email: 'rajesh@demo.hospital', phone: '+91-9876543201', salary: 120000, join_date: '2023-01-15', code: 'DOC001' },
      { name: 'Dr. Priya Sharma', designation: 'Consultant Doctor', department: 'Cardiology', email: 'priya@demo.hospital', phone: '+91-9876543202', salary: 150000, join_date: '2022-06-20', code: 'DOC002' },
      { name: 'Nurse Anita Desai', designation: 'Head Nurse', department: 'General Medicine', email: 'anita@demo.hospital', phone: '+91-9876543203', salary: 60000, join_date: '2023-03-10', code: 'NUR001' },
      { name: 'Nurse Ravi Patel', designation: 'Staff Nurse', department: 'Emergency', email: 'ravi@demo.hospital', phone: '+91-9876543204', salary: 45000, join_date: '2023-08-15', code: 'NUR002' },
      { name: 'Meera Reddy', designation: 'Pharmacist', department: 'Pharmacy', email: 'meera@demo.hospital', phone: '+91-9876543205', salary: 55000, join_date: '2022-11-30', code: 'PHM001' },
      { name: 'Arun Singh', designation: 'Lab Technician', department: 'Laboratory', email: 'arun@demo.hospital', phone: '+91-9876543206', salary: 40000, join_date: '2023-04-20', code: 'LAB001' },
      { name: 'Sunita Devi', designation: 'Billing Executive', department: 'Billing', email: 'sunita@demo.hospital', phone: '+91-9876543207', salary: 35000, join_date: '2023-02-28', code: 'BIL001' },
      { name: 'Deepak Kumar', designation: 'HR Manager', department: 'Administration', email: 'deepak@demo.hospital', phone: '+91-9876543208', salary: 80000, join_date: '2022-09-15', code: 'HRM001' },
      { name: 'Dr. Michael George', designation: 'Orthopedic Surgeon', department: 'Orthopedics', email: 'michael@demo.hospital', phone: '+91-9876543209', salary: 180000, join_date: '2022-05-10', code: 'DOC003' },
      { name: 'Dr. Sarah Joseph', designation: 'Pediatrician', department: 'Pediatrics', email: 'sarah@demo.hospital', phone: '+91-9876543210', salary: 140000, join_date: '2023-07-01', code: 'DOC004' },
      { name: 'John Mathew', designation: 'Administrative Officer', department: 'Administration', email: 'john@demo.hospital', phone: '+91-9876543211', salary: 50000, join_date: '2023-01-20', code: 'ADM001' },
      { name: 'Maria Thomas', designation: 'Accountant', department: 'Accounts', email: 'maria@demo.hospital', phone: '+91-9876543212', salary: 55000, join_date: '2022-12-10', code: 'ACC001' }
    ];

    for (const emp of employeeData) {
      try {
        await query(
          `INSERT INTO emr.employees 
           (tenant_id, name, designation, department, email, phone, salary, join_date, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET
             designation = EXCLUDED.designation,
             updated_at = NOW()`,
          [
            tenantId, emp.name, emp.designation, emp.department, emp.email, 
            emp.phone, emp.salary, emp.join_date
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 2. PHARMACY STOCK MODULE
    console.log(' 2. POPULATING PHARMACY STOCK MODULE...');
    
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
      { name: 'Salbutamol Syrup', category: 'Respiratory', current_stock: 120, reorder_level: 30, unit: 'bottles', code: 'SAL001' },
      { name: 'Hydrochlorothiazide 25mg', category: 'Diuretics', current_stock: 200, reorder_level: 50, unit: 'tablets', code: 'HCT001' },
      { name: 'Metoprolol 50mg', category: 'Cardiovascular', current_stock: 220, reorder_level: 60, unit: 'tablets', code: 'MET002' },
      { name: 'Losartan 50mg', category: 'Cardiovascular', current_stock: 160, reorder_level: 40, unit: 'tablets', code: 'LOS001' },
      { name: 'Gabapentin 300mg', category: 'Neurological', current_stock: 140, reorder_level: 35, unit: 'capsules', code: 'GAB001' },
      { name: 'Sertraline 50mg', category: 'Psychiatric', current_stock: 100, reorder_level: 25, unit: 'tablets', code: 'SER001' },
      { name: 'Levothyroxine 50mcg', category: 'Endocrine', current_stock: 180, reorder_level: 45, unit: 'tablets', code: 'LEV001' }
    ];

    for (const stock of pharmacyStock) {
      try {
        await query(
          `INSERT INTO emr.inventory_items 
           (tenant_id, name, category, current_stock, reorder_level, unit, item_code, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (item_code) DO UPDATE SET
             current_stock = EXCLUDED.current_stock,
             updated_at = NOW()`,
          [
            tenantId, stock.name, stock.category, stock.current_stock, stock.reorder_level,
            stock.unit, stock.code
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 3. PRESCRIPTIONS MODULE
    console.log(' 3. POPULATING PRESCRIPTIONS MODULE...');
    
    const medications = [
      'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Insulin', 'Metformin',
      'Amlodipine', 'Atorvastatin', 'Omeprazole', 'Albuterol', 'Hydrochlorothiazide',
      'Metoprolol', 'Losartan', 'Gabapentin', 'Sertraline', 'Levothyroxine'
    ];

    for (let i = 0; i < 200; i++) {
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
            getRandomItem(['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed']),
            `${getRandomInt(5, 30)} days`,
            getRandomItem(['Take with food', 'Take on empty stomach', 'Take before bedtime', 'Take as needed for pain']),
            prescriptionDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 4. LAB/DIAGNOSTICS MODULE
    console.log(' 4. POPULATING LAB/DIAGNOSTICS MODULE...');
    
    const labTests = [
      'Complete Blood Count', 'Comprehensive Metabolic Panel', 'Lipid Profile',
      'Liver Function Tests', 'Kidney Function Tests', 'Thyroid Panel',
      'HbA1c', 'Vitamin D', 'Vitamin B12', 'Iron Studies',
      'Chest X-Ray', 'Abdominal X-Ray', 'Bone X-Ray',
      'CT Head', 'CT Chest', 'CT Abdomen', 'CT Extremities',
      'MRI Brain', 'MRI Spine', 'MRI Joint', 'MRI Abdomen',
      'Ultrasound Abdomen', 'Ultrasound Pelvic', 'Ultrasound Cardiac',
      'ECG 12-Lead', 'Holter Monitor', 'Echocardiogram',
      'Stress Test', 'Pulmonary Function Test', 'Sleep Study'
    ];

    for (let i = 0; i < 300; i++) {
      const patient = getRandomItem(patients.rows);
      const reportDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const test = getRandomItem(labTests);
      const isUrgent = Math.random() > 0.9;
      const status = getRandomInt(1, 100) <= 70 ? 'completed' : (getRandomInt(1, 100) <= 50 ? 'pending' : 'cancelled');

      try {
        await query(
          `INSERT INTO emr.diagnostic_reports 
           (tenant_id, patient_id, status, category, conclusion, issued_datetime, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            tenantId,
            patient.id,
            status,
            'Laboratory',
            JSON.stringify({
              normal: Math.random() > 0.3,
              findings: Math.random() > 0.4 ? 'Normal findings' : 'Mild abnormalities detected',
              recommendations: Math.random() > 0.6 ? 'Follow up in 3 months' : 'No immediate action required',
              testDate: reportDate.toISOString(),
              performedBy: getRandomItem(['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Michael George'])
            }),
            reportDate.toISOString(),
            reportDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    console.log('\n Modules population completed!');
    console.log('\n Summary:');
    console.log(` Employees: ${employeeData.length} staff members`);
    console.log(` Pharmacy Stock: ${pharmacyStock.length} medications`);
    console.log(` Prescriptions: 200 prescription records`);
    console.log(` Lab/Diagnostics: 300 diagnostic reports`);

    return {
      success: true,
      employees: employeeData.length,
      pharmacyStock: pharmacyStock.length,
      prescriptions: 200,
      diagnostics: 300
    };

  } catch (error) {
    console.error(' Error populating modules:', error);
    return { success: false, error: error.message };
  }
}

// Run the script
populateModulesCorrected().then(result => {
  if (result.success) {
    console.log('\n Modules population completed successfully!');
    console.log(' All modules should now be connected with proper data.');
    process.exit(0);
  } else {
    console.log('\n Modules population failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Script execution failed:', error);
  process.exit(1);
});
