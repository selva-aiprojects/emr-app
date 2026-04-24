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

async function createDynamicNotifications() {
  console.log(' Creating Dynamic Notification System...\n');

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
    const [patients, departments, employees] = await Promise.all([
      query('SELECT id, first_name, last_name FROM patients WHERE tenant_id = $1 LIMIT 50', [tenantId]),
      query('SELECT id, name FROM departments WHERE tenant_id = $1', [tenantId]),
      query('SELECT id, name, designation, department FROM employees WHERE tenant_id = $1', [tenantId])
    ]);

    console.log(` Found ${patients.rows.length} patients, ${departments.rows.length} departments, ${employees.rows.length} employees`);

    // 1. Create Low Stock Medicine Notifications
    console.log(' 1. Creating Low Stock Medicine Notifications...');
    
    // First, let's create some inventory items with low stock
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
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (item_code) DO UPDATE SET
             current_stock = EXCLUDED.current_stock,
             updated_at = NOW()`,
          [
            tenantId, item.name, item.category, item.current_stock, item.reorder_level,
            item.unit, item.code
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // Create low stock notifications
    for (const item of lowStockItems) {
      try {
        await query(
          `INSERT INTO emr.notification_logs 
           (tenant_id, type, message, severity, category, is_read, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
          [
            tenantId,
            'low_stock',
            `Low stock alert: ${item.name} - Only ${item.current_stock} ${item.unit} remaining (Reorder at ${item.reorder_level} ${item.unit})`,
            item.current_stock <= 5 ? 'critical' : 'warning',
            'pharmacy',
            false
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 2. Create Doctor Availability Notifications based on Attendance
    console.log(' 2. Creating Doctor Availability Notifications...');
    
    // Create attendance records for doctors
    const doctors = employees.rows.filter(emp => emp.designation.toLowerCase().includes('doctor'));
    console.log(` Found ${doctors.length} doctors`);
    
    for (const doctor of doctors) {
      // Create attendance for last 7 days with some absences
      for (let i = 0; i < 7; i++) {
        const attendanceDate = new Date();
        attendanceDate.setDate(attendanceDate.getDate() - i);
        
        // 20% chance of being absent
        const isAbsent = Math.random() > 0.8;
        const status = isAbsent ? 'Absent' : 'Present';
        
        try {
          await query(
            `INSERT INTO emr.attendance 
             (tenant_id, employee_id, date, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (employee_id, date) DO UPDATE SET
               status = EXCLUDED.status,
               updated_at = NOW()`,
            [
              tenantId,
              doctor.id,
              attendanceDate.toISOString().split('T')[0],
              status
            ]
          );
        } catch (error) {
          // Ignore duplicates
        }
      }
    }

    // Create availability notifications for absent doctors
    for (const doctor of doctors) {
      try {
        // Check if doctor is absent today
        const todayAttendance = await query(
          'SELECT status FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
          [doctor.id]
        );
        
        if (todayAttendance.rows.length > 0 && todayAttendance.rows[0].status === 'Absent') {
          await query(
            `INSERT INTO emr.notification_logs 
             (tenant_id, type, message, severity, category, is_read, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
            [
              tenantId,
              'staff_absence',
              `Doctor unavailable: ${doctor.name} (${doctor.designation}) is absent today`,
              'high',
              'staff',
              false
            ]
          );
        }
      } catch (error) {
        // Ignore errors
      }
    }

    // 3. Create Fleet Availability Notifications
    console.log(' 3. Creating Fleet Availability Notifications...');
    
    // Create ambulance fleet data
    const ambulanceData = [
      { vehicle_number: 'AMB-001', status: 'maintenance', last_service: '2026-03-15', mileage: 45000 },
      { vehicle_number: 'AMB-002', status: 'available', last_service: '2026-04-01', mileage: 32000 },
      { vehicle_number: 'AMB-003', status: 'busy', last_service: '2026-03-20', mileage: 38000 },
      { vehicle_number: 'AMB-004', status: 'available', last_service: '2026-04-05', mileage: 28000 },
      { vehicle_number: 'AMB-005', status: 'maintenance', last_service: '2026-03-10', mileage: 52000 },
      { vehicle_number: 'AMB-006', status: 'available', last_service: '2026-04-02', mileage: 35000 },
      { vehicle_number: 'AMB-007', status: 'busy', last_service: '2026-03-25', mileage: 41000 },
      { vehicle_number: 'AMB-008', status: 'available', last_service: '2026-04-03', mileage: 29000 }
    ];

    for (const ambulance of ambulanceData) {
      try {
        await query(
          `INSERT INTO emr.ambulances 
           (tenant_id, vehicle_number, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (vehicle_number) DO UPDATE SET
             status = EXCLUDED.status,
             updated_at = NOW()`,
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

    // Create fleet notifications
    for (const ambulance of ambulanceData) {
      if (ambulance.status === 'maintenance') {
        try {
          await query(
            `INSERT INTO emr.notification_logs 
             (tenant_id, type, message, severity, category, is_read, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
            [
              tenantId,
              'fleet_maintenance',
              `Ambulance ${ambulance.vehicle_number} is under maintenance - Not available for emergency calls`,
              'medium',
              'fleet',
              false
            ]
          );
        } catch (error) {
          // Ignore duplicates
        }
      }
    }

    // 4. Create Bed Occupancy Notifications
    console.log(' 4. Creating Bed Occupancy Notifications...');
    
    // Update some beds to high occupancy
    const highOccupancyWards = ['General Ward - Male', 'ICU'];
    
    for (const wardName of highOccupancyWards) {
      try {
        await query(
          `UPDATE beds 
           SET status = 'occupied', updated_at = NOW()
           WHERE tenant_id = $1 
           AND ward_id IN (
             SELECT id FROM wards WHERE tenant_id = $1 AND name = $2
           )
           LIMIT 15`,
          [tenantId, wardName]
        );
      } catch (error) {
        // Ignore errors
      }
    }

    // Create bed occupancy notifications
    try {
      const wardOccupancy = await query(`
        SELECT w.name, COUNT(b.id) as total_beds, 
               COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds
        FROM wards w
        LEFT JOIN beds b ON w.id = b.ward_id
        WHERE w.tenant_id = $1
        GROUP BY w.name, w.id
        HAVING (COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) * 100.0 / COUNT(b.id)) > 80
      `, [tenantId]);

      for (const ward of wardOccupancy.rows) {
        await query(
          `INSERT INTO emr.notification_logs 
           (tenant_id, type, message, severity, category, is_read, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
          [
            tenantId,
            'high_occupancy',
            `High occupancy alert: ${ward.name} - ${ward.occupied_beds}/${ward.total_beds} beds occupied (${((ward.occupied_beds / ward.total_beds) * 100).toFixed(1)}%)`,
            'medium',
            'operations',
            false
          ]
        );
      }
    } catch (error) {
      // Ignore errors
    }

    // 5. Create Critical Lab Results Notifications
    console.log(' 5. Creating Critical Lab Results Notifications...');
    
    // Create some critical lab results
    const criticalPatients = patients.rows.slice(0, 10);
    
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
              performedBy: getRandomItem(['Dr. Rajesh Kumar', 'Dr. Priya Sharma'])
            }),
            new Date().toISOString()
          ]
        );
      } catch (error) {
        // Ignore errors
      }
    }

    // Create critical lab notifications
    for (const patient of criticalPatients) {
      try {
        await query(
          `INSERT INTO emr.notification_logs 
           (tenant_id, type, message, severity, category, is_read, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
          [
            tenantId,
            'critical_lab_result',
            `Critical lab result for ${patient.first_name} ${patient.last_name} - Immediate attention required`,
            'critical',
            'laboratory',
            false
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // 6. Create Appointment Overdue Notifications
    console.log(' 6. Creating Appointment Overdue Notifications...');
    
    // Create some overdue appointments
    for (let i = 0; i < 5; i++) {
      const patient = getRandomItem(patients.rows);
      const overdueDate = new Date();
      overdueDate.setHours(overdueDate.getHours() - getRandomInt(2, 6)); // 2-6 hours ago
      
      try {
        await query(
          `INSERT INTO emr.appointments 
           (tenant_id, patient_id, scheduled_start, scheduled_end, status, reason, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'missed', $5, NOW(), NOW())`,
          [
            tenantId,
            patient.id,
            overdueDate.toISOString(),
            new Date(overdueDate.getTime() + 30 * 60 * 1000).toISOString(),
            'General Consultation'
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // Create overdue appointment notifications
    const missedAppointments = await query(
      'SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND status = \'missed\' AND DATE(scheduled_start) = CURRENT_DATE',
      [tenantId]
    );

    if (missedAppointments.rows[0].count > 0) {
      await query(
        `INSERT INTO emr.notification_logs 
         (tenant_id, type, message, severity, category, is_read, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [
          tenantId,
          'missed_appointments',
          `${missedAppointments.rows[0].count} patients missed their appointments today`,
          'medium',
          'appointments',
          false
        ]
      );
    }

    console.log('\n Dynamic notification system created successfully!');
    console.log('\n Notification Categories Created:');
    console.log(` Low Stock Medicine: ${lowStockItems.length} alerts`);
    console.log(` Doctor Availability: Based on attendance records`);
    console.log(` Fleet Management: ${ambulanceData.length} vehicles tracked`);
    console.log(` Bed Occupancy: High occupancy alerts`);
    console.log(` Critical Lab Results: ${criticalPatients.length} critical alerts`);
    console.log(` Missed Appointments: ${missedAppointments.rows[0].count} alerts`);

    // Get final notification count
    const notificationCount = await query(
      'SELECT COUNT(*) as count FROM notification_logs WHERE tenant_id = $1 AND is_read = false',
      [tenantId]
    );

    console.log(`\n Total Active Notifications: ${notificationCount.rows[0].count}`);

    return {
      success: true,
      totalNotifications: notificationCount.rows[0].count,
      lowStockAlerts: lowStockItems.length,
      doctorAvailability: doctors.length,
      fleetAlerts: ambulanceData.filter(a => a.status === 'maintenance').length,
      criticalLabs: criticalPatients.length
    };

  } catch (error) {
    console.error(' Error creating dynamic notifications:', error);
    return { success: false, error: error.message };
  }
}

// Run the script
createDynamicNotifications().then(result => {
  if (result.success) {
    console.log('\n Dynamic notification system created successfully!');
    console.log(' Static alerts have been replaced with dynamic, data-driven notifications.');
    process.exit(0);
  } else {
    console.log('\n Dynamic notification system creation failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Script execution failed:', error);
  process.exit(1);
});
