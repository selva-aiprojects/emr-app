import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function populateAllMissingTables() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== POPULATING ALL MISSING MASTER TABLES ===\n');
    
    // 1. Master Tables Configuration
    console.log('1. Creating Master Tables Data...');
    
    // Drug Master
    const drugs = [
      'Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 500mg', 'Insulin Glardine',
      'Albuterol Inhaler', 'Omeprazole 20mg', 'Metformin 500mg', 'Amlodipine 5mg',
      'Aspirin 75mg', 'Lisinopril 10mg', 'Simvastatin 20mg', 'Prednisone 5mg',
      'Ciprofloxacin 500mg', 'Azithromycin 250mg', 'Gabapentin 300mg', 'Tramadol 50mg'
    ];
    
    for (const drug of drugs) {
      try {
        await query(`
          INSERT INTO emr.drug_master (brand_name, generic_name, category, manufacturer, strength, unit, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (brand_name) DO UPDATE SET updated_at = NOW()
        `, [
          drug,
          drug.split(' ')[0],
          ['Antibiotic', 'Analgesic', 'Antidiabetic', 'Cardiovascular', 'Respiratory'][getRandomInt(0, 4)],
          ['PharmaCorp', 'MediTech', 'BioPharm', 'HealthCare Inc'][getRandomInt(0, 3)],
          drug.split(' ')[1] || '500mg',
          ['Tablet', 'Capsule', 'Injection', 'Inhaler'][getRandomInt(0, 3)]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 2. Enhanced Employee Data
    console.log('2. Creating Enhanced Employee Data...');
    
    const departments = ['Emergency', 'ICU', 'General Ward', 'Pharmacy', 'Laboratory', 'Radiology', 'Administration'];
    const designations = [
      'Senior Doctor', 'Junior Doctor', 'Head Nurse', 'Staff Nurse', 'Pharmacist',
      'Lab Technician', 'Radiologist', 'Administrator', 'Accountant', 'Receptionist'
    ];
    
    for (let i = 0; i < 20; i++) {
      try {
        const salary = getRandomInt(25000, 150000);
        await query(`
          INSERT INTO demo_emr.employees 
          (tenant_id, employee_code, name, designation, department, email, phone, salary, joining_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (tenant_id, employee_code) DO UPDATE SET
            name = EXCLUDED.name,
            designation = EXCLUDED.designation,
            department = EXCLUDED.department,
            salary = EXCLUDED.salary,
            updated_at = NOW()
        `, [
          tenantId,
          `EMP${String(i + 1).padStart(4, '0')}`,
          ['Dr. ', 'Mr. ', 'Ms. ', 'Mrs. '][getRandomInt(0, 3)] + 
          ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Vikram Reddy'][i % 5],
          designations[i % designations.length],
          departments[i % departments.length],
          `employee${i}@demo.hospital`,
          `+91${getRandomInt(9000000000, 9999999999)}`,
          salary,
          getRandomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)).toISOString().split('T')[0]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 3. Laboratory Data
    console.log('3. Creating Laboratory Data...');
    
    const labTests = [
      'Complete Blood Count', 'Liver Function Test', 'Kidney Function Test', 'Blood Sugar',
      'Lipid Profile', 'Thyroid Function Test', 'Vitamin D Test', 'COVID-19 Test',
      'X-Ray Chest', 'Ultrasound Abdomen', 'CT Scan Head', 'MRI Brain',
      'ECG', 'Echocardiogram', 'Stress Test', 'Pulmonary Function Test'
    ];
    
    for (const test of labTests) {
      try {
        await query(`
          INSERT INTO demo_emr.lab_tests 
          (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (tenant_id, test_name) DO UPDATE SET updated_at = NOW()
        `, [
          tenantId,
          test,
          ['Hematology', 'Biochemistry', 'Radiology', 'Cardiology', 'Pathology'][getRandomInt(0, 4)],
          `${getRandomFloat(50, 150)} - ${getRandomFloat(151, 300)}`,
          getRandomFloat(200, 2000)
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 4. Enhanced Pharmacy Inventory
    console.log('4. Creating Enhanced Pharmacy Inventory...');
    
    for (let i = 0; i < 50; i++) {
      try {
        const drug = getRandomItem(drugs);
        const currentStock = getRandomInt(10, 500);
        const reorderLevel = getRandomInt(20, 100);
        
        await query(`
          INSERT INTO demo_emr.inventory_items 
          (tenant_id, item_name, category, current_stock, reorder_level, unit_price, supplier, expiry_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (tenant_id, item_name) DO UPDATE SET
            current_stock = EXCLUDED.current_stock,
            unit_price = EXCLUDED.unit_price,
            updated_at = NOW()
        `, [
          tenantId,
          drug,
          ['Medicine', 'Equipment', 'Supply', 'Consumable'][getRandomInt(0, 3)],
          currentStock,
          reorderLevel,
          getRandomFloat(5, 500),
          ['MediSupply', 'PharmaCorp', 'HealthCare Inc', 'BioPharm'][getRandomInt(0, 3)],
          getRandomDate(new Date(), new Date(2026, 11, 31)).toISOString().split('T')[0]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 5. Enhanced Pharmacy Operations
    console.log('5. Creating Pharmacy Operations...');
    
    for (let i = 0; i < 30; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.prescriptions 
          (tenant_id, patient_id, doctor_id, medication, dosage, frequency, duration, instructions, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          `patient-${getRandomInt(1, 296)}`,
          `doctor-${getRandomInt(1, 10)}`,
          getRandomItem(drugs),
          ['1-0-1', '1-1-1', '0-1-0', '2-1-2'][getRandomInt(0, 3)],
          ['Daily', 'Twice daily', 'Three times', 'As needed'][getRandomInt(0, 3)],
          `${getRandomInt(5, 30)} days`,
          ['Take after food', 'Take before food', 'Take with water'][getRandomInt(0, 2)],
          ['active', 'completed', 'dispensed'][getRandomInt(0, 2)],
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 6. Enhanced Billing Data
    console.log('6. Creating Enhanced Billing Data...');
    
    for (let i = 0; i < 100; i++) {
      try {
        const totalAmount = getRandomFloat(500, 10000);
        const paidAmount = Math.random() > 0.2 ? totalAmount * getRandomFloat(0.5, 1) : 0;
        
        await query(`
          INSERT INTO demo_emr.invoices 
          (tenant_id, patient_id, invoice_number, total_amount, paid, status, issue_date, due_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (tenant_id, invoice_number) DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            paid = EXCLUDED.paid,
            status = EXCLUDED.status,
            updated_at = NOW()
        `, [
          tenantId,
          `patient-${getRandomInt(1, 296)}`,
          `INV${Date.now()}${i}`,
          totalAmount,
          paidAmount,
          paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
          getRandomDate(new Date(), new Date(2025, 0, 31)).toISOString().split('T')[0]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 7. Discharge Data
    console.log('7. Creating Discharge Data...');
    
    for (let i = 0; i < 50; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.discharges 
          (tenant_id, patient_id, admission_id, discharge_date, discharge_type, final_diagnosis, outcome, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          `patient-${getRandomInt(1, 296)}`,
          `admission-${getRandomInt(1, 100)}`,
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
          ['Discharged', 'Referred', 'LAMA', 'Expired'][getRandomInt(0, 3)],
          ['Hypertension', 'Diabetes', 'Pneumonia', 'Dengue', 'Malaria'][getRandomInt(0, 4)],
          ['Recovered', 'Improved', 'Stable', 'Critical'][getRandomInt(0, 3)],
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 8. Accounts Data
    console.log('8. Creating Accounts Data...');
    
    for (let i = 0; i < 80; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.expenses 
          (tenant_id, category, amount, description, date, approved_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          ['Salaries', 'Medicines', 'Equipment', 'Utilities', 'Maintenance', 'Supplies', 'Insurance', 'Taxes'][getRandomInt(0, 7)],
          getRandomFloat(1000, 100000),
          `Monthly payment for ${['staff salaries', 'medical supplies', 'equipment maintenance', 'utility bills', 'infrastructure'][getRandomInt(0, 4)]}`,
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
          `manager${getRandomInt(1, 5)}@demo.hospital`,
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 9. Wards and Beds (Critical for dashboard)
    console.log('9. Creating Wards and Beds...');
    
    const wardTypes = [
      { name: 'ICU', type: 'ICU', bedCount: 10 },
      { name: 'General Ward - Male', type: 'General', bedCount: 30 },
      { name: 'General Ward - Female', type: 'General', bedCount: 30 },
      { name: 'Private Ward - A', type: 'Private', bedCount: 15 },
      { name: 'Private Ward - B', type: 'Private', bedCount: 15 },
      { name: 'Maternity Ward', type: 'Maternity', bedCount: 20 },
      { name: 'Pediatric Ward', type: 'Pediatric', bedCount: 25 },
      { name: 'Emergency Ward', type: 'Emergency', bedCount: 15 }
    ];
    
    for (const wardType of wardTypes) {
      try {
        // Create ward
        const wardResult = await query(`
          INSERT INTO demo_emr.wards 
          (tenant_id, name, type, floor, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (tenant_id, name) DO UPDATE SET updated_at = NOW()
          RETURNING id
        `, [
          tenantId,
          wardType.name,
          wardType.type,
          getRandomInt(1, 4)
        ]);
        
        const wardId = wardResult.rows[0]?.id;
        
        if (wardId) {
          // Create beds for this ward
          for (let i = 1; i <= wardType.bedCount; i++) {
            const bedNumber = `${wardType.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
            const isOccupied = Math.random() < 0.75; // 75% occupancy
            
            await query(`
              INSERT INTO demo_emr.beds 
              (tenant_id, ward_id, bed_number, status, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
              ON CONFLICT (tenant_id, bed_number) DO UPDATE SET
                status = EXCLUDED.status,
                updated_at = NOW()
            `, [
              tenantId,
              wardId,
              bedNumber,
              isOccupied ? 'occupied' : 'available'
            ]);
          }
        }
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    console.log('\n=== ALL MISSING TABLES POPULATION COMPLETED ===');
    
    // Verify results
    const verification = await query(`
      SELECT 
        (SELECT COUNT(*) FROM demo_emr.employees WHERE tenant_id = $1) as employees,
        (SELECT COUNT(*) FROM demo_emr.inventory_items WHERE tenant_id = $1) as inventory_items,
        (SELECT COUNT(*) FROM demo_emr.prescriptions WHERE tenant_id = $1) as prescriptions,
        (SELECT COUNT(*) FROM demo_emr.invoices WHERE tenant_id = $1) as invoices,
        (SELECT COUNT(*) FROM demo_emr.expenses WHERE tenant_id = $1) as expenses,
        (SELECT COUNT(*) FROM demo_emr.discharges WHERE tenant_id = $1) as discharges,
        (SELECT COUNT(*) FROM demo_emr.wards WHERE tenant_id = $1) as wards,
        (SELECT COUNT(*) FROM demo_emr.beds WHERE tenant_id = $1) as beds,
        (SELECT COUNT(*) FROM demo_emr.lab_tests WHERE tenant_id = $1) as lab_tests
    `, [tenantId]);
    
    const results = verification.rows[0];
    console.log('\nUpdated Metrics:');
    console.log(` Employees: ${results.employees}`);
    console.log(` Inventory Items: ${results.inventory_items}`);
    console.log(` Prescriptions: ${results.prescriptions}`);
    console.log(` Invoices: ${results.invoices}`);
    console.log(` Expenses: ${results.expenses}`);
    console.log(` Discharges: ${results.discharges}`);
    console.log(` Wards: ${results.wards}`);
    console.log(` Beds: ${results.beds}`);
    console.log(` Lab Tests: ${results.lab_tests}`);
    
    console.log('\n✅ ALL DASHBOARD CARDS SHOULD NOW SHOW DATA!');
    console.log('✅ LOGIN: admin@demo.hospital / Demo@123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

populateAllMissingTables();
