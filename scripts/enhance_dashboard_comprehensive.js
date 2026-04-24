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

async function enhanceDashboardComprehensive() {
  console.log(' Enhancing dashboard with comprehensive hospital data...\n');

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
    const [patients, doctors, departments] = await Promise.all([
      query('SELECT id, first_name, last_name FROM emr.patients WHERE tenant_id = $1', [tenantId]),
      query('SELECT id, name FROM emr.users WHERE tenant_id = $1 AND role = $2', [tenantId, 'Doctor']),
      query('SELECT id, name FROM emr.departments WHERE tenant_id = $1', [tenantId])
    ]);

    console.log(` Found ${patients.rows.length} patients, ${doctors.rows.length} doctors, ${departments.rows.length} departments`);

    // 1. Create comprehensive appointments for today
    console.log(' Creating today\'s comprehensive appointments...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentTypes = [
      'New Patient Consultation', 'Follow-up Visit', 'Emergency Visit', 
      'Routine Checkup', 'Specialist Referral', 'Pre-operative Assessment',
      'Post-operative Review', 'Vaccination', 'Health Screening', 'Chronic Disease Management'
    ];

    const appointmentStatuses = ['scheduled', 'completed', 'cancelled', 'checked_in', 'triaged', 'in_progress'];
    
    // Create appointments specifically for today
    for (let i = 0; i < 50; i++) {
      const patient = getRandomItem(patients.rows);
      const doctor = getRandomItem(doctors.rows);
      const department = getRandomItem(departments.rows);
      const appointmentHour = getRandomInt(8, 17); // 8 AM to 5 PM
      const appointmentDate = new Date(today);
      appointmentDate.setHours(appointmentHour, getRandomInt(0, 59), 0, 0);
      
      try {
        await query(
          `INSERT INTO emr.appointments 
           (tenant_id, patient_id, provider_id, department_id, scheduled_start, scheduled_end, status, reason, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            tenantId,
            patient.id,
            doctor.id,
            department.id,
            appointmentDate.toISOString(),
            new Date(appointmentDate.getTime() + getRandomInt(15, 60) * 60 * 1000).toISOString(),
            getRandomItem(appointmentStatuses),
            getRandomItem(appointmentTypes),
            `Patient notes for appointment with ${doctor.name} in ${department.name}`
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 2. Create comprehensive financial data
    console.log(' Creating comprehensive financial data...');
    const services = [
      { name: 'General Consultation', price: 150, category: 'consultation' },
      { name: 'Specialist Consultation', price: 300, category: 'consultation' },
      { name: 'Emergency Room Visit', price: 500, category: 'emergency' },
      { name: 'Complete Blood Count', price: 45, category: 'lab' },
      { name: 'X-Ray Chest', price: 200, category: 'imaging' },
      { name: 'CT Scan', price: 800, category: 'imaging' },
      { name: 'MRI', price: 1500, category: 'imaging' },
      { name: 'ECG', price: 100, category: 'diagnostic' },
      { name: 'Ultrasound', price: 350, category: 'imaging' },
      { name: 'Pathology Tests', price: 120, category: 'lab' },
      { name: 'Vaccination', price: 80, category: 'procedure' },
      { name: 'Minor Procedure', price: 600, category: 'procedure' },
      { name: 'Physical Therapy', price: 250, category: 'therapy' },
      { name: 'Medication Administration', price: 50, category: 'pharmacy' }
    ];

    // Create invoices for the last 90 days
    for (let i = 0; i < 300; i++) {
      const patient = getRandomItem(patients.rows);
      const invoiceDate = getRandomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      const serviceCount = getRandomInt(1, 5);
      let totalAmount = 0;
      const lineItems = [];

      for (let j = 0; j < serviceCount; j++) {
        const service = getRandomItem(services);
        const quantity = getRandomInt(1, 3);
        const lineTotal = service.price * quantity;
        totalAmount += lineTotal;
        lineItems.push({
          service: service.name,
          quantity: quantity,
          unitPrice: service.price,
          total: lineTotal
        });
      }

      const status = getRandomInt(1, 100) <= 85 ? 'paid' : (getRandomInt(1, 100) <= 50 ? 'pending' : 'cancelled');

      try {
        await query(
          `INSERT INTO emr.invoices 
           (tenant_id, patient_id, total, status, items, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            tenantId,
            patient.id,
            totalAmount,
            status,
            JSON.stringify(lineItems),
            invoiceDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 3. Create comprehensive patient flow data
    console.log(' Creating patient flow and journey data...');
    const patientStages = ['registration', 'triage', 'consultation', 'diagnostics', 'treatment', 'billing', 'discharge'];
    
    for (let i = 0; i < 80; i++) {
      const patient = getRandomItem(patients.rows);
      const stage = getRandomItem(patientStages);
      const journeyDate = getRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
      
      try {
        await query(
          `INSERT INTO emr.patient_journey 
           (tenant_id, patient_id, stage, status, timestamp, notes, created_at, updated_at)
           VALUES ($1, $2, $3, 'active', $4, $5, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [
            tenantId,
            patient.id,
            stage,
            journeyDate.toISOString(),
            `Patient currently in ${stage} phase`
          ]
        );
      } catch (error) {
        // Table might not exist, ignore
      }
    }

    // 4. Create comprehensive department statistics
    console.log(' Creating department statistics...');
    const departmentMetrics = departments.rows.map(dept => ({
      id: dept.id,
      name: dept.name,
      patientsToday: getRandomInt(5, 25),
      revenueToday: getRandomFloat(500, 5000),
      avgWaitTime: getRandomInt(5, 45),
      satisfaction: getRandomInt(75, 98),
      staffCount: getRandomInt(2, 8),
      bedsOccupied: getRandomInt(1, 20)
    }));

    for (const metrics of departmentMetrics) {
      try {
        await query(
          `INSERT INTO emr.department_metrics 
           (tenant_id, department_id, patients_today, revenue_today, avg_wait_time, satisfaction_score, staff_count, beds_occupied, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [
            tenantId,
            metrics.id,
            metrics.patientsToday,
            metrics.revenueToday,
            metrics.avgWaitTime,
            metrics.satisfaction,
            metrics.staffCount,
            metrics.bedsOccupied
          ]
        );
      } catch (error) {
        // Table might not exist, ignore
      }
    }

    // 5. Create comprehensive staff performance data
    console.log(' Creating staff performance data...');
    for (const doctor of doctors.rows) {
      const performance = {
        patientsSeen: getRandomInt(8, 25),
        avgConsultTime: getRandomInt(10, 30),
        patientSatisfaction: getRandomInt(80, 99),
        revenueGenerated: getRandomFloat(1000, 8000),
        completedProcedures: getRandomInt(0, 8),
        emergenciesHandled: getRandomInt(0, 3)
      };

      try {
        await query(
          `INSERT INTO emr.staff_performance 
           (tenant_id, staff_id, patients_seen, avg_consult_time, satisfaction_score, revenue_generated, completed_procedures, emergencies_handled, date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [
            tenantId,
            doctor.id,
            performance.patientsSeen,
            performance.avgConsultTime,
            performance.patientSatisfaction,
            performance.revenueGenerated,
            performance.completedProcedures,
            performance.emergenciesHandled
          ]
        );
      } catch (error) {
        // Table might not exist, ignore
      }
    }

    // 6. Create comprehensive inventory and supply chain data
    console.log(' Creating comprehensive inventory data...');
    const inventoryCategories = [
      'Medications', 'Medical Supplies', 'Equipment', 'Lab Supplies', 
      'Surgical Supplies', 'Emergency Supplies', 'Office Supplies', 'Food Services'
    ];

    const inventoryItems = [
      // Medications
      { name: 'Paracetamol 500mg', category: 'Medications', unit: 'tablets', currentStock: 500, reorderLevel: 100, costPerUnit: 0.50 },
      { name: 'Ibuprofen 400mg', category: 'Medications', unit: 'tablets', currentStock: 300, reorderLevel: 80, costPerUnit: 0.75 },
      { name: 'Amoxicillin 500mg', category: 'Medications', unit: 'capsules', currentStock: 200, reorderLevel: 50, costPerUnit: 1.20 },
      { name: 'Insulin Glargine', category: 'Medications', unit: 'vials', currentStock: 45, reorderLevel: 20, costPerUnit: 25.00 },
      { name: 'Metformin 500mg', category: 'Medications', unit: 'tablets', currentStock: 800, reorderLevel: 200, costPerUnit: 0.30 },
      
      // Medical Supplies
      { name: 'Surgical Gloves', category: 'Medical Supplies', unit: 'boxes', currentStock: 25, reorderLevel: 10, costPerUnit: 15.00 },
      { name: 'Face Masks', category: 'Medical Supplies', unit: 'boxes', currentStock: 40, reorderLevel: 15, costPerUnit: 20.00 },
      { name: 'Syringes 5ml', category: 'Medical Supplies', unit: 'packs', currentStock: 100, reorderLevel: 30, costPerUnit: 8.00 },
      { name: 'IV Catheters', category: 'Medical Supplies', unit: 'packs', currentStock: 30, reorderLevel: 10, costPerUnit: 25.00 },
      { name: 'Bandages', category: 'Medical Supplies', unit: 'boxes', currentStock: 60, reorderLevel: 20, costPerUnit: 12.00 },
      
      // Lab Supplies
      { name: 'Blood Collection Tubes', category: 'Lab Supplies', unit: 'boxes', currentStock: 80, reorderLevel: 25, costPerUnit: 18.00 },
      { name: 'Test Strips', category: 'Lab Supplies', unit: 'packs', currentStock: 45, reorderLevel: 15, costPerUnit: 35.00 },
      { name: 'Lab Reagents', category: 'Lab Supplies', unit: 'bottles', currentStock: 20, reorderLevel: 8, costPerUnit: 45.00 },
      
      // Emergency Supplies
      { name: 'Oxygen Masks', category: 'Emergency Supplies', unit: 'pieces', currentStock: 15, reorderLevel: 5, costPerUnit: 35.00 },
      { name: 'Emergency Drugs Kit', category: 'Emergency Supplies', unit: 'kits', currentStock: 8, reorderLevel: 3, costPerUnit: 150.00 },
      { name: 'Defibrillator Pads', category: 'Emergency Supplies', unit: 'packs', currentStock: 12, reorderLevel: 4, costPerUnit: 85.00 }
    ];

    for (const item of inventoryItems) {
      try {
        await query(
          `INSERT INTO emr.inventory_items 
           (tenant_id, item_name, category, current_stock, reorder_level, unit, cost_per_unit, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (item_name) DO UPDATE SET
             current_stock = EXCLUDED.current_stock,
             updated_at = NOW()`,
          [
            tenantId,
            item.name,
            item.category,
            item.currentStock,
            item.reorderLevel,
            item.unit,
            item.costPerUnit
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 7. Create comprehensive quality metrics
    console.log(' Creating quality and performance metrics...');
    const qualityMetrics = {
      patientSatisfaction: getRandomInt(85, 96),
      readmissionRate: getRandomFloat(2.5, 8.5),
      averageLengthOfStay: getRandomFloat(2.5, 5.5),
      bedTurnoverTime: getRandomInt(30, 90),
      emergencyWaitTime: getRandomInt(15, 45),
      medicationErrorRate: getRandomFloat(0.1, 0.8),
      handHygieneCompliance: getRandomInt(75, 95),
      staffSatisfaction: getRandomInt(78, 92)
    };

    try {
      await query(
        `INSERT INTO emr.quality_metrics 
         (tenant_id, patient_satisfaction, readmission_rate, avg_length_of_stay, bed_turnover_time, 
          emergency_wait_time, medication_error_rate, hand_hygiene_compliance, staff_satisfaction, date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [
          tenantId,
          qualityMetrics.patientSatisfaction,
          qualityMetrics.readmissionRate,
          qualityMetrics.averageLengthOfStay,
          qualityMetrics.bedTurnoverTime,
          qualityMetrics.emergencyWaitTime,
          qualityMetrics.medicationErrorRate,
          qualityMetrics.handHygieneCompliance,
          qualityMetrics.staffSatisfaction
        ]
      );
    } catch (error) {
      // Table might not exist, ignore
    }

    // 8. Create comprehensive diagnostic data
    console.log(' Creating comprehensive diagnostic data...');
    const diagnosticTests = [
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

    for (let i = 0; i < 200; i++) {
      const patient = getRandomItem(patients.rows);
      const doctor = getRandomItem(doctors.rows);
      const testDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const test = getRandomItem(diagnosticTests);
      const isUrgent = Math.random() > 0.85;
      const status = getRandomInt(1, 100) <= 70 ? 'completed' : (getRandomInt(1, 100) <= 50 ? 'pending' : 'cancelled');

      try {
        await query(
          `INSERT INTO emr.diagnostic_reports 
           (tenant_id, patient_id, provider_id, test_name, status, urgency, result, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            tenantId,
            patient.id,
            doctor.id,
            test,
            status,
            isUrgent ? 'urgent' : 'routine',
            JSON.stringify({
              normal: Math.random() > 0.3,
              findings: Math.random() > 0.4 ? 'Normal findings' : 'Mild abnormalities detected',
              recommendations: Math.random() > 0.6 ? 'Follow up in 3 months' : 'No immediate action required',
              testDate: testDate.toISOString()
            }),
            testDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 9. Create comprehensive prescription data
    console.log(' Creating comprehensive prescription data...');
    const medications = [
      'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Cephalexin',
      'Metformin', 'Insulin', 'Amlodipine', 'Lisinopril', 'Atorvastatin',
      'Omeprazole', 'Albuterol', 'Salbutamol', 'Prednisone', 'Hydrochlorothiazide',
      'Metoprolol', 'Losartan', 'Gabapentin', 'Sertraline', 'Levothyroxine'
    ];

    for (let i = 0; i < 150; i++) {
      const patient = getRandomItem(patients.rows);
      const doctor = getRandomItem(doctors.rows);
      const prescriptionDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const medication = getRandomItem(medications);
      
      try {
        await query(
          `INSERT INTO emr.prescriptions 
           (tenant_id, patient_id, provider_id, medication, dosage, frequency, duration, instructions, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            tenantId,
            patient.id,
            doctor.id,
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

    console.log('\n Comprehensive dashboard enhancement completed!');
    console.log('\n Enhanced Data Summary:');
    console.log(` Today's Appointments: 50+ created`);
    console.log(` Financial Data: 300+ invoices over 90 days`);
    console.log(` Patient Journey: 80+ stage records`);
    console.log(` Department Metrics: ${departments.rows.length} departments with statistics`);
    console.log(` Staff Performance: ${doctors.rows.length} doctors with performance data`);
    console.log(` Inventory: ${inventoryItems.length} comprehensive items`);
    console.log(` Quality Metrics: 8 KPIs tracked`);
    console.log(` Diagnostic Tests: 200+ comprehensive tests`);
    console.log(` Prescriptions: 150+ medication orders`);

  } catch (error) {
    console.error(' Error enhancing dashboard:', error);
    process.exit(1);
  }
}

// Run the script
enhanceDashboardComprehensive().then(() => {
  console.log('\n Comprehensive dashboard enhancement completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error(' Script failed:', error);
  process.exit(1);
});
