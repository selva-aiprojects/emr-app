import { query } from '../server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function createNotificationDataSimple() {
  console.log(' Creating Dynamic Notification Data (Simple Version)...\n');

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
      query('SELECT id, first_name, last_name FROM patients WHERE tenant_id = $1 LIMIT 50', [tenantId]),
      query('SELECT id, name FROM departments WHERE tenant_id = $1', [tenantId])
    ]);

    console.log(` Found ${patients.rows.length} patients, ${departments.rows.length} departments`);

    // 1. Create Low Stock Medicine Data
    console.log(' 1. Creating Low Stock Medicine Data...');
    
    const lowStockItems = [
      { name: 'Paracetamol 500mg', category: 'Analgesics', current_stock: 15, reorder_level: 50, unit: 'tablets', code: 'PAR001' },
      { name: 'Ibuprofen 400mg', category: 'Analgesics', current_stock: 8, reorder_level: 30, unit: 'tablets', code: 'IBU001' },
      { name: 'Amoxicillin 500mg', category: 'Antibiotics', current_stock: 12, reorder_level: 40, unit: 'capsules', code: 'AMX001' },
      { name: 'Insulin Glardine', category: 'Diabetes', current_stock: 3, reorder_level: 20, unit: 'vials', code: 'INS001' },
      { name: 'Albuterol Inhaler', category: 'Respiratory', current_stock: 5, reorder_level: 25, unit: 'inhalers', code: 'ALB001' },
      { name: 'Omeprazole 20mg', category: 'GI Drugs', current_stock: 10, reorder_level: 35, unit: 'capsules', code: 'OME001' },
      { name: 'Metformin 500mg', category: 'Diabetes', current_stock: 18, reorder_level: 60, unit: 'tablets', code: 'MET001' },
      { name: 'Amlodipine 5mg', category: 'Cardiovascular', current_stock: 7, reorder_level: 30, unit: 'tablets', code: 'AML001' }
    ];

    for (const item of lowStockItems) {
      try {
        await query(
          `INSERT INTO emr.inventory_items 
           (tenant_id, name, category, current_stock, reorder_level, unit, item_code, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            tenantId, item.name, item.category, item.current_stock, item.reorder_level,
            item.unit, item.code
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 2. Create Fleet Availability Data
    console.log(' 2. Creating Fleet Availability Data...');
    
    const ambulanceData = [
      { vehicle_number: 'AMB-001', status: 'maintenance' },
      { vehicle_number: 'AMB-002', status: 'available' },
      { vehicle_number: 'AMB-003', status: 'busy' },
      { vehicle_number: 'AMB-004', status: 'available' },
      { vehicle_number: 'AMB-005', status: 'maintenance' },
      { vehicle_number: 'AMB-006', status: 'available' },
      { vehicle_number: 'AMB-007', status: 'busy' },
      { vehicle_number: 'AMB-008', status: 'available' }
    ];

    for (const ambulance of ambulanceData) {
      try {
        await query(
          `INSERT INTO emr.ambulances 
           (tenant_id, vehicle_number, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [
            tenantId,
            ambulance.vehicle_number,
            ambulance.status
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 3. Create Critical Lab Results Data
    console.log(' 3. Creating Critical Lab Results Data...');
    
    const criticalPatients = patients.rows.slice(0, 5);
    
    for (const patient of criticalPatients) {
      try {
        await query(
          `INSERT INTO emr.diagnostic_reports 
           (tenant_id, patient_id, status, category, conclusion, issued_datetime, created_at, updated_at)
           VALUES ($1, $2, 'completed', 'Laboratory', $3, $4, NOW(), NOW())`,
          [
            tenantId,
            patient.id,
            JSON.stringify({
              normal: false,
              findings: 'Critical values detected',
              recommendations: 'Immediate medical attention required',
              criticalFlag: true,
              testDate: new Date().toISOString(),
              performedBy: 'Dr. Rajesh Kumar'
            }),
            new Date().toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 4. Create Missed Appointments Data
    console.log(' 4. Creating Missed Appointments Data...');
    
    for (let i = 0; i < 3; i++) {
      const patient = patients.rows[i];
      const missedDate = new Date();
      missedDate.setHours(missedDate.getHours() - getRandomInt(2, 4)); // 2-4 hours ago
      
      try {
        await query(
          `INSERT INTO emr.appointments 
           (tenant_id, patient_id, scheduled_start, scheduled_end, status, reason, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'missed', $5, NOW(), NOW())`,
          [
            tenantId,
            patient.id,
            missedDate.toISOString(),
            new Date(missedDate.getTime() + 30 * 60 * 1000).toISOString(),
            'General Consultation'
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 5. Create Employee Attendance Data
    console.log(' 5. Creating Employee Attendance Data...');
    
    // Create some employees first if they don't exist
    const employeeData = [
      { name: 'Dr. Rajesh Kumar', designation: 'Senior Doctor', department: 'General Medicine', email: 'rajesh@demo.hospital', phone: '+91-9876543201', salary: 120000 },
      { name: 'Dr. Priya Sharma', designation: 'Consultant Doctor', department: 'Cardiology', email: 'priya@demo.hospital', phone: '+91-9876543202', salary: 150000 },
      { name: 'Nurse Anita Desai', designation: 'Head Nurse', department: 'General Medicine', email: 'anita@demo.hospital', phone: '+91-9876543203', salary: 60000 },
      { name: 'Nurse Ravi Patel', designation: 'Staff Nurse', department: 'Emergency', email: 'ravi@demo.hospital', phone: '+91-9876543204', salary: 45000 }
    ];

    for (const emp of employeeData) {
      try {
        await query(
          `INSERT INTO emr.employees 
           (tenant_id, name, designation, department, email, phone, salary, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
          [
            tenantId, emp.name, emp.designation, emp.department, emp.email, 
            emp.phone, emp.salary
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // Create attendance records
    const employeesResult = await query('SELECT id, name, designation FROM employees WHERE tenant_id = $1', [tenantId]);
    const doctors = employeesResult.rows.filter(emp => emp.designation.toLowerCase().includes('doctor'));
    
    for (const doctor of doctors) {
      // Create attendance for today with some absences
      const isAbsent = Math.random() > 0.75; // 25% chance of being absent
      const status = isAbsent ? 'Absent' : 'Present';
      
      try {
        await query(
          `INSERT INTO emr.attendance 
           (tenant_id, employee_id, date, status, created_at, updated_at)
           VALUES ($1, $2, CURRENT_DATE, $3, NOW(), NOW())`,
          [
            tenantId,
            doctor.id,
            status
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    console.log('\n Dynamic notification data created successfully!');
    console.log('\n Data Created for Dynamic Notifications:');
    console.log(` Low Stock Medicine: ${lowStockItems.length} items below reorder level`);
    console.log(` Fleet Availability: ${ambulanceData.length} vehicles with status tracking`);
    console.log(` Critical Lab Results: ${criticalPatients.length} critical results`);
    console.log(` Missed Appointments: 3 missed appointments created`);
    console.log(` Employee Attendance: ${doctors.length} doctors with attendance records`);

    // Create a summary of current notification triggers
    console.log('\n=== NOTIFICATION TRIGGERS SUMMARY ===');
    
    // Check low stock items
    const lowStockCheck = await query(
      'SELECT name, current_stock, reorder_level FROM inventory_items WHERE tenant_id = $1 AND current_stock <= reorder_level',
      [tenantId]
    );
    console.log(`\n Low Stock Items (${lowStockCheck.rows.length}):`);
    lowStockCheck.rows.forEach(item => {
      const severity = item.current_stock <= 5 ? 'CRITICAL' : 'WARNING';
      console.log(`  ${severity}: ${item.name} - ${item.current_stock}/${item.reorder_level} ${item.unit}`);
    });

    // Check absent doctors
    const absentDoctors = await query(
      `SELECT e.name, e.designation FROM employees e 
       JOIN attendance a ON e.id = a.employee_id 
       WHERE e.tenant_id = $1 AND a.date = CURRENT_DATE AND a.status = 'Absent' AND e.designation ILIKE '%doctor%'`,
      [tenantId]
    );
    console.log(`\n Absent Doctors (${absentDoctors.rows.length}):`);
    absentDoctors.rows.forEach(doctor => {
      console.log(`  ${doctor.name} (${doctor.designation})`);
    });

    // Check fleet status
    const fleetStatus = await query(
      'SELECT vehicle_number, status FROM ambulances WHERE tenant_id = $1 AND status = \'maintenance\'',
      [tenantId]
    );
    console.log(`\n Ambulances Under Maintenance (${fleetStatus.rows.length}):`);
    fleetStatus.rows.forEach(ambulance => {
      console.log(`  ${ambulance.vehicle_number} - ${ambulance.status.toUpperCase()}`);
    });

    // Check missed appointments
    const missedAppointments = await query(
      'SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND status = \'missed\' AND DATE(scheduled_start) = CURRENT_DATE',
      [tenantId]
    );
    console.log(`\n Missed Appointments Today: ${missedAppointments.rows[0].count}`);

    return {
      success: true,
      lowStockItems: lowStockCheck.rows.length,
      absentDoctors: absentDoctors.rows.length,
      fleetMaintenance: fleetStatus.rows.length,
      missedAppointments: missedAppointments.rows[0].count
    };

  } catch (error) {
    console.error(' Error creating notification data:', error);
    return { success: false, error: error.message };
  }
}

// Run the script
createNotificationDataSimple().then(result => {
  if (result.success) {
    console.log('\n Dynamic notification data created successfully!');
    console.log(' The dashboard can now generate real-time notifications based on actual data.');
    process.exit(0);
  } else {
    console.log('\n Dynamic notification data creation failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Script execution failed:', error);
  process.exit(1);
});
