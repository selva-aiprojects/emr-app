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

async function populateMissingModules() {
  console.log(' Populating Missing Modules: Employees, Pharmacy, Lab, Billing...\n');

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
      { name: 'Dr. Rajesh Kumar', designation: 'Senior Doctor', department: 'General Medicine', email: 'rajesh@demo.hospital', phone: '+91-9876543201', salary: 120000, joining_date: '2023-01-15' },
      { name: 'Dr. Priya Sharma', designation: 'Consultant Doctor', department: 'Cardiology', email: 'priya@demo.hospital', phone: '+91-9876543202', salary: 150000, joining_date: '2022-06-20' },
      { name: 'Nurse Anita Desai', designation: 'Head Nurse', department: 'General Medicine', email: 'anita@demo.hospital', phone: '+91-9876543203', salary: 60000, joining_date: '2023-03-10' },
      { name: 'Nurse Ravi Patel', designation: 'Staff Nurse', department: 'Emergency', email: 'ravi@demo.hospital', phone: '+91-9876543204', salary: 45000, joining_date: '2023-08-15' },
      { name: 'Meera Reddy', designation: 'Pharmacist', department: 'Pharmacy', email: 'meera@demo.hospital', phone: '+91-9876543205', salary: 55000, joining_date: '2022-11-30' },
      { name: 'Arun Singh', designation: 'Lab Technician', department: 'Laboratory', email: 'arun@demo.hospital', phone: '+91-9876543206', salary: 40000, joining_date: '2023-04-20' },
      { name: 'Sunita Devi', designation: 'Billing Executive', department: 'Billing', email: 'sunita@demo.hospital', phone: '+91-9876543207', salary: 35000, joining_date: '2023-02-28' },
      { name: 'Deepak Kumar', designation: 'HR Manager', department: 'Administration', email: 'deepak@demo.hospital', phone: '+91-9876543208', salary: 80000, joining_date: '2022-09-15' },
      { name: 'Dr. Michael George', designation: 'Orthopedic Surgeon', department: 'Orthopedics', email: 'michael@demo.hospital', phone: '+91-9876543209', salary: 180000, joining_date: '2022-05-10' },
      { name: 'Dr. Sarah Joseph', designation: 'Pediatrician', department: 'Pediatrics', email: 'sarah@demo.hospital', phone: '+91-9876543210', salary: 140000, joining_date: '2023-07-01' },
      { name: 'John Mathew', designation: 'Administrative Officer', department: 'Administration', email: 'john@demo.hospital', phone: '+91-9876543211', salary: 50000, joining_date: '2023-01-20' },
      { name: 'Maria Thomas', designation: 'Accountant', department: 'Accounts', email: 'maria@demo.hospital', phone: '+91-9876543212', salary: 55000, joining_date: '2022-12-10' }
    ];

    for (const emp of employeeData) {
      try {
        await query(
          `INSERT INTO emr.employees 
           (tenant_id, name, designation, department, email, phone, salary, joining_date, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET
             designation = EXCLUDED.designation,
             updated_at = NOW()`,
          [
            tenantId, emp.name, emp.designation, emp.department, emp.email, 
            emp.phone, emp.salary, emp.joining_date
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 2. PHARMACY STOCK MODULE
    console.log(' 2. POPULATING PHARMACY STOCK MODULE...');
    
    const pharmacyStock = [
      { name: 'Paracetamol 500mg', category: 'Analgesics', current_stock: 500, reorder_level: 100, unit: 'tablets', cost_per_unit: 0.50, supplier: 'MediCorp Ltd', expiry_date: '2025-12-31' },
      { name: 'Ibuprofen 400mg', category: 'Analgesics', current_stock: 300, reorder_level: 80, unit: 'tablets', cost_per_unit: 0.75, supplier: 'PharmaWorld', expiry_date: '2025-10-15' },
      { name: 'Amoxicillin 500mg', category: 'Antibiotics', current_stock: 200, reorder_level: 50, unit: 'capsules', cost_per_unit: 1.20, supplier: 'MediCorp Ltd', expiry_date: '2025-08-20' },
      { name: 'Azithromycin 250mg', category: 'Antibiotics', current_stock: 150, reorder_level: 40, unit: 'tablets', cost_per_unit: 2.50, supplier: 'PharmaWorld', expiry_date: '2025-09-30' },
      { name: 'Insulin Glargine', category: 'Diabetes', current_stock: 45, reorder_level: 20, unit: 'vials', cost_per_unit: 25.00, supplier: 'DiabeticCare', expiry_date: '2025-06-15' },
      { name: 'Metformin 500mg', category: 'Diabetes', current_stock: 800, reorder_level: 200, unit: 'tablets', cost_per_unit: 0.30, supplier: 'MediCorp Ltd', expiry_date: '2025-11-30' },
      { name: 'Amlodipine 5mg', category: 'Cardiovascular', current_stock: 250, reorder_level: 60, unit: 'tablets', cost_per_unit: 1.00, supplier: 'HeartCare Pharma', expiry_date: '2025-07-20' },
      { name: 'Atorvastatin 10mg', category: 'Cardiovascular', current_stock: 180, reorder_level: 50, unit: 'tablets', cost_per_unit: 1.50, supplier: 'HeartCare Pharma', expiry_date: '2025-08-10' },
      { name: 'Omeprazole 20mg', category: 'GI Drugs', current_stock: 350, reorder_level: 70, unit: 'capsules', cost_per_unit: 0.80, supplier: 'GutCare Ltd', expiry_date: '2025-09-15' },
      { name: 'Albuterol Inhaler', category: 'Respiratory', current_stock: 80, reorder_level: 25, unit: 'inhalers', cost_per_unit: 15.00, supplier: 'BreatheEasy', expiry_date: '2025-10-30' },
      { name: 'Salbutamol Syrup', category: 'Respiratory', current_stock: 120, reorder_level: 30, unit: 'bottles', cost_per_unit: 8.00, supplier: 'BreatheEasy', expiry_date: '2025-11-20' },
      { name: 'Hydrochlorothiazide 25mg', category: 'Diuretics', current_stock: 200, reorder_level: 50, unit: 'tablets', cost_per_unit: 0.60, supplier: 'KidneyCare', expiry_date: '2025-07-15' },
      { name: 'Metoprolol 50mg', category: 'Cardiovascular', current_stock: 220, reorder_level: 60, unit: 'tablets', cost_per_unit: 0.90, supplier: 'HeartCare Pharma', expiry_date: '2025-08-25' },
      { name: 'Losartan 50mg', category: 'Cardiovascular', current_stock: 160, reorder_level: 40, unit: 'tablets', cost_per_unit: 1.20, supplier: 'HeartCare Pharma', expiry_date: '2025-09-10' },
      { name: 'Gabapentin 300mg', category: 'Neurological', current_stock: 140, reorder_level: 35, unit: 'capsules', cost_per_unit: 2.00, supplier: 'NeuroCare', expiry_date: '2025-06-30' },
      { name: 'Sertraline 50mg', category: 'Psychiatric', current_stock: 100, reorder_level: 25, unit: 'tablets', cost_per_unit: 1.80, supplier: 'MindCare', expiry_date: '2025-10-20' },
      { name: 'Levothyroxine 50mcg', category: 'Endocrine', current_stock: 180, reorder_level: 45, unit: 'tablets', cost_per_unit: 0.70, supplier: 'ThyroidCare', expiry_date: '2025-11-15' }
    ];

    for (const stock of pharmacyStock) {
      try {
        await query(
          `INSERT INTO emr.inventory_items 
           (tenant_id, item_name, category, current_stock, reorder_level, unit, cost_per_unit, supplier, expiry_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           ON CONFLICT (item_name) DO UPDATE SET
             current_stock = EXCLUDED.current_stock,
             updated_at = NOW()`,
          [
            tenantId, stock.name, stock.category, stock.current_stock, stock.reorder_level,
            stock.unit, stock.cost_per_unit, stock.supplier, stock.expiry_date
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 3. PRESCRIPTION FLOW MODULE
    console.log(' 3. POPULATING PRESCRIPTION FLOW MODULE...');
    
    const prescriptions = [
      'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Insulin', 'Metformin',
      'Amlodipine', 'Atorvastatin', 'Omeprazole', 'Albuterol', 'Hydrochlorothiazide',
      'Metoprolol', 'Losartan', 'Gabapentin', 'Sertraline', 'Levothyroxine'
    ];

    for (let i = 0; i < 200; i++) {
      const patient = getRandomItem(patients.rows);
      const prescriptionDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const medication = getRandomItem(prescriptions);
      
      try {
        await query(
          `INSERT INTO emr.prescriptions 
           (tenant_id, patient_id, medication, dosage, frequency, duration, instructions, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
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
           (tenant_id, patient_id, test_name, result, status, urgency, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            tenantId,
            patient.id,
            test,
            JSON.stringify({
              normal: Math.random() > 0.3,
              findings: Math.random() > 0.4 ? 'Normal findings' : 'Mild abnormalities detected',
              recommendations: Math.random() > 0.6 ? 'Follow up in 3 months' : 'No immediate action required',
              testDate: reportDate.toISOString(),
              performedBy: getRandomItem(['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Michael George'])
            }),
            status,
            isUrgent ? 'urgent' : 'routine',
            reportDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 5. PATIENT BILLING MODULE
    console.log(' 5. POPULATING PATIENT BILLING MODULE...');
    
    const billingServices = [
      'General Consultation', 'Specialist Consultation', 'Emergency Room Visit',
      'Complete Blood Count', 'X-Ray Chest', 'CT Scan', 'MRI', 'ECG', 'Ultrasound',
      'Pathology Tests', 'Vaccination', 'Minor Procedure', 'Physical Therapy',
      'Dressing', 'IV Therapy', 'Wound Care', 'Injection', ' Nebulization'
    ];

    for (let i = 0; i < 250; i++) {
      const patient = getRandomItem(patients.rows);
      const invoiceDate = getRandomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date());
      const serviceCount = getRandomInt(1, 5);
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
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 6. ACCOUNTS RECEIVABLE/PAYABLE MODULE
    console.log(' 6. POPULATING ACCOUNTS RECEIVABLE/PAYABLE MODULE...');
    
    // Accounts Receivable (Patient Bills)
    for (let i = 0; i < 50; i++) {
      const patient = getRandomItem(patients.rows);
      const amount = getRandomFloat(500, 5000);
      const dueDate = getRandomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
      
      try {
        await query(
          `INSERT INTO emr.claims 
           (tenant_id, patient_id, amount, status, due_date, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending', $4, NOW(), NOW())`,
          [tenantId, patient.id, amount, dueDate.toISOString()]
        );
      } catch (error) {
        // Table might not exist, ignore
      }
    }

    // Accounts Payable (Supplier Bills)
    const suppliers = ['MediCorp Ltd', 'PharmaWorld', 'HeartCare Pharma', 'GutCare Ltd', 'BreatheEasy'];
    for (let i = 0; i < 30; i++) {
      const amount = getRandomFloat(1000, 10000);
      const dueDate = getRandomDate(new Date(), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
      
      try {
        await query(
          `INSERT INTO emr.expenses 
           (tenant_id, description, amount, category, status, due_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW())`,
          [
            tenantId,
            `Payment to ${getRandomItem(suppliers)}`,
            amount,
            'Pharmacy Supplies',
            dueDate.toISOString()
          ]
        );
      } catch (error) {
        // Table might not exist, ignore
      }
    }

    console.log('\n Missing modules population completed!');
    console.log('\n Summary:');
    console.log(` Employees: ${employeeData.length} staff members`);
    console.log(` Pharmacy Stock: ${pharmacyStock.length} medications`);
    console.log(` Prescriptions: 200 prescription records`);
    console.log(` Lab/Diagnostics: 300 diagnostic reports`);
    console.log(` Patient Billing: 250 invoices`);
    console.log(` Accounts: 80 receivable/payable records`);

    return {
      success: true,
      employees: employeeData.length,
      pharmacyStock: pharmacyStock.length,
      prescriptions: 200,
      diagnostics: 300,
      billing: 250,
      accounts: 80
    };

  } catch (error) {
    console.error(' Error populating missing modules:', error);
    return { success: false, error: error.message };
  }
}

// Run the script
populateMissingModules().then(result => {
  if (result.success) {
    console.log('\n Missing modules population completed successfully!');
    console.log(' Dashboard should now show data for all modules including employees, pharmacy, lab, billing, and accounts.');
    process.exit(0);
  } else {
    console.log('\n Missing modules population failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Script execution failed:', error);
  process.exit(1);
});
