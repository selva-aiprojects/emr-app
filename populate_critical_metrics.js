import { query } from './server/db/connection.js';

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

async function populateCriticalMetrics() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== POPULATING CRITICAL DASHBOARD METRICS ===\n');
    
    // 1. Create Wards and Beds (Critical for dashboard)
    console.log('1. Creating Wards and Beds...');
    
    // First, ensure we have wards
    const wardTypes = [
      { name: 'ICU', capacity: 10, type: 'ICU' },
      { name: 'General Ward - Male', capacity: 20, type: 'General' },
      { name: 'General Ward - Female', capacity: 20, type: 'General' },
      { name: 'Private Ward - A', capacity: 8, type: 'Private' },
      { name: 'Private Ward - B', capacity: 8, type: 'Private' },
      { name: 'Maternity Ward', capacity: 12, type: 'Maternity' },
      { name: 'Pediatric Ward', capacity: 15, type: 'Pediatric' },
      { name: 'Emergency Ward', capacity: 6, type: 'Emergency' }
    ];
    
    for (const wardType of wardTypes) {
      try {
        // Create ward
        const wardResult = await query(`
          INSERT INTO demo_emr.wards (tenant_id, name, capacity, type, floor, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (tenant_id, name) DO UPDATE SET
            capacity = EXCLUDED.capacity,
            updated_at = NOW()
          RETURNING id
        `, [
          tenantId,
          wardType.name,
          wardType.capacity,
          wardType.type,
          getRandomInt(1, 4)
        ]);
        
        const wardId = wardResult.rows[0]?.id;
        
        if (wardId) {
          // Create beds for this ward
          for (let i = 1; i <= wardType.capacity; i++) {
            const bedNumber = `${wardType.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
            const isOccupied = Math.random() < 0.7; // 70% occupancy rate
            
            await query(`
              INSERT INTO demo_emr.beds (tenant_id, ward_id, bed_number, status, created_at, updated_at)
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
    
    // 2. Create Today's Appointments (if missing)
    console.log('2. Creating Today\'s Appointments...');
    
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
    const employees = await query('SELECT id, name FROM demo_emr.employees WHERE tenant_id = $1 AND designation ILIKE \'%doctor%\'', [tenantId]);
    
    if (patients.rows.length > 0 && employees.rows.length > 0) {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // Start at 9 AM
      
      for (let i = 0; i < 8; i++) { // Create 8 appointments today
        const appointmentTime = new Date(today);
        appointmentTime.setHours(9 + (i * 2), 0, 0, 0); // Every 2 hours
        
        try {
          await query(`
            INSERT INTO demo_emr.appointments 
            (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [
            tenantId,
            getRandomItem(patients.rows).id,
            getRandomItem(employees.rows).id,
            appointmentTime.toISOString(),
            new Date(appointmentTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            'scheduled',
            ['General Consultation', 'Follow-up', 'Emergency Checkup', 'Routine Check'][i % 4]
          ]);
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
    
    // 3. Create Today's New Patients
    console.log('3. Creating Today\'s New Patients...');
    
    for (let i = 0; i < 3; i++) {
      try {
        const patientResult = await query(`
          INSERT INTO demo_emr.patients 
          (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id
        `, [
          tenantId,
          `MRN${Date.now()}${i}`,
          ['John', 'Jane', 'Michael', 'Sarah', 'David'][i],
          ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'][i],
          getRandomDate(new Date(1980, 0, 1), new Date(2005, 0, 1)).toISOString().split('T')[0],
          ['Male', 'Female'][i % 2],
          `+91${getRandomInt(9000000000, 9999999999)}`,
          `patient${i}@demo.hospital`,
          `123, Street ${i + 1}, Demo City`
        ]);
        
        // Create today's appointment for new patient
        if (employees.rows.length > 0) {
          await query(`
            INSERT INTO demo_emr.appointments 
            (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `, [
            tenantId,
            patientResult.rows[0].id,
            getRandomItem(employees.rows).id,
            new Date().toISOString(),
            new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            'scheduled',
            'New Patient Registration'
          ]);
        }
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 4. Update some invoice statuses to show pending payments
    console.log('4. Updating Invoice Statuses...');
    
    await query(`
      UPDATE demo_emr.invoices 
      SET status = CASE 
        WHEN random() > 0.8 THEN 'pending'
        WHEN random() > 0.6 THEN 'overdue'
        ELSE 'paid'
      END,
      updated_at = NOW()
      WHERE tenant_id = $1 AND status = 'paid'
    `, [tenantId]);
    
    // 5. Create recent expenses
    console.log('5. Creating Recent Expenses...');
    
    const expenseCategories = ['Salaries', 'Medicines', 'Equipment', 'Utilities', 'Maintenance', 'Supplies'];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const expenseDate = new Date(today);
      expenseDate.setDate(expenseDate.getDate() - getRandomInt(0, 30));
      
      try {
        await query(`
          INSERT INTO demo_emr.expenses 
          (tenant_id, category, amount, description, date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          getRandomItem(expenseCategories),
          getRandomFloat(1000, 50000),
          `Monthly ${getRandomItem(expenseCategories)} payment`,
          expenseDate.toISOString().split('T')[0]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 6. Create recent lab reports
    console.log('6. Creating Recent Lab Reports...');
    
    for (let i = 0; i < 5; i++) {
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - getRandomInt(0, 7));
      
      try {
        await query(`
          INSERT INTO demo_emr.diagnostic_reports 
          (tenant_id, patient_id, status, category, conclusion, issued_datetime, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          getRandomItem(patients.rows).id,
          'completed',
          ['Laboratory', 'Radiology', 'Pathology', 'Cardiology'][i % 4],
          JSON.stringify({
            normal: Math.random() > 0.3,
            findings: 'Routine examination completed',
            recommendations: Math.random() > 0.7 ? 'Follow-up required' : 'No action needed',
            testDate: reportDate.toISOString(),
            performedBy: getRandomItem(employees.rows).name
          }),
          reportDate.toISOString()
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    console.log('\n=== CRITICAL METRICS POPULATION COMPLETED ===');
    console.log('All dashboard cards should now show data!');
    
    // Verify the results
    const verification = await query(`
      SELECT 
        (SELECT COUNT(*) FROM demo_emr.beds WHERE tenant_id = $1) as total_beds,
        (SELECT COUNT(*) FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'occupied') as occupied_beds,
        (SELECT COUNT(*) FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE) as today_appointments,
        (SELECT COUNT(*) FROM demo_emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE) as today_patients,
        (SELECT COUNT(*) FROM demo_emr.invoices WHERE tenant_id = $1 AND status = 'pending') as pending_invoices,
        (SELECT COUNT(*) FROM demo_emr.expenses WHERE tenant_id = $1 AND date >= CURRENT_DATE - INTERVAL \'30 days\') as recent_expenses
    `, [tenantId]);
    
    const results = verification.rows[0];
    console.log('\nUpdated Metrics:');
    console.log(` Total Beds: ${results.total_beds}`);
    console.log(` Occupied Beds: ${results.occupied_beds}`);
    console.log(` Bed Occupancy Rate: ${results.total_beds > 0 ? ((results.occupied_beds / results.total_beds) * 100).toFixed(1) : 0}%`);
    console.log(` Today\'s Appointments: ${results.today_appointments}`);
    console.log(` Today\'s New Patients: ${results.today_patients}`);
    console.log(` Pending Invoices: ${results.pending_invoices}`);
    console.log(` Recent Expenses: ${results.recent_expenses}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

populateCriticalMetrics();
