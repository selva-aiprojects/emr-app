import { query } from './server/db/connection.js';
import { hashPassword } from './server/services/auth.service.js';

/**
 * Formal Patient Journey Data Seeding
 * Follows proper patient flow: Registration -> Appointment -> Encounter -> Treatment
 * Only uses existing table structures without modifications
 */

async function seedPatientJourney() {
  console.log('🏥 Starting formal patient journey seeding...\n');

  try {
    // Get tenant ID for Basic Health Clinic
    const tenantResult = await query('SELECT id FROM nexus.tenants WHERE code = $1', ['BHC']);
    if (tenantResult.rows.length === 0) {
      console.log('❌ Basic Health Clinic tenant not found');
      return;
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Working with tenant ID: ${tenantId}`);

    // 1. Create Clinical Staff (Doctors, Nurses, Admin)
    console.log('\n👨‍⚕️ Creating clinical staff...');
    const staffData = [
      { name: 'Dr. Robert Chen', email: 'dr.chen@bhc.com', role: 'Doctor', specialization: 'Internal Medicine' },
      { name: 'Dr. Sarah Williams', email: 'dr.williams@bhc.com', role: 'Doctor', specialization: 'Pediatrics' },
      { name: 'Nurse Jennifer Brown', email: 'nurse.brown@bhc.com', role: 'Nurse', specialization: 'General Nursing' },
      { name: 'Admin Mary Davis', email: 'admin.davis@bhc.com', role: 'Admin', specialization: 'Administration' }
    ];

    const staffMap = new Map();
    for (const staff of staffData) {
      const passwordHash = await hashPassword('Test@123');
      const result = await query(`
        INSERT INTO nexus.users (tenant_id, name, email, password_hash, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        RETURNING id
      `, [tenantId, staff.name, staff.email, passwordHash, staff.role]);
      
      staffMap.set(staff.email, result.rows[0].id);
      console.log(`  ✅ Created staff: ${staff.name} (${staff.role})`);
    }

    // 2. Register Patients (following formal registration process)
    console.log('\n👥 Registering patients...');
    const patientData = [
      {
        name: 'John Smith',
        email: 'john.smith@bhc.com',
        phone: '+1-555-0101',
        address: '123 Main St, Anytown, USA',
        emergency_contact: 'Jane Smith - +1-555-0102',
        insurance: 'BlueCross BlueShield'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@bhc.com',
        phone: '+1-555-0103',
        address: '456 Oak Ave, Anytown, USA',
        emergency_contact: 'Mike Johnson - +1-555-0104',
        insurance: 'Aetna'
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@bhc.com',
        phone: '+1-555-0105',
        address: '789 Pine Rd, Anytown, USA',
        emergency_contact: 'Lisa Brown - +1-555-0106',
        insurance: 'UnitedHealth'
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@bhc.com',
        phone: '+1-555-0107',
        address: '321 Elm St, Anytown, USA',
        emergency_contact: 'Robert Davis - +1-555-0108',
        insurance: 'Cigna'
      }
    ];

    const patientMap = new Map();
    for (const patient of patientData) {
      // Generate MRN
      const mrn = `BHC-${Date.now().toString(36).substr(2, 9).toUpperCase()}`;
      
      const result = await query(`
        INSERT INTO nexus.patients (tenant_id, name, email, phone, address, mrn, insurance, emergency_contact, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `, [tenantId, patient.name, patient.email, patient.phone, patient.address, mrn, patient.insurance, patient.emergency_contact]);
      
      patientMap.set(patient.email, result.rows[0].id);
      console.log(`  ✅ Registered patient: ${patient.name} (MRN: ${mrn})`);
    }

    // 3. Create Departments (clinical structure)
    console.log('\n🏥 Creating clinical departments...');
    const departments = [
      { name: 'Emergency', description: 'Emergency medical services 24/7', head: 'Dr. Robert Chen' },
      { name: 'Internal Medicine', description: 'General medical care and consultations', head: 'Dr. Robert Chen' },
      { name: 'Pediatrics', description: 'Children healthcare and pediatric services', head: 'Dr. Sarah Williams' },
      { name: 'Cardiology', description: 'Heart and cardiovascular care', head: 'Dr. External Specialist' }
    ];

    const departmentMap = new Map();
    for (const dept of departments) {
      const result = await query(`
        INSERT INTO nexus.departments (tenant_id, name, description, head, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id
      `, [tenantId, dept.name, dept.description, dept.head]);
      
      departmentMap.set(dept.name, result.rows[0].id);
      console.log(`  ✅ Created department: ${dept.name}`);
    }

    // 4. Setup Beds (infrastructure)
    console.log('\n🛏️ Setting up beds...');
    const bedSetup = [
      { department: 'Emergency', beds: 10, type: 'Emergency' },
      { department: 'Internal Medicine', beds: 15, type: 'Standard' },
      { department: 'Pediatrics', beds: 8, type: 'Pediatric' },
      { department: 'Cardiology', type: 'ICU' }
    ];

    for (const setup of bedSetup) {
      const deptId = departmentMap.get(setup.department);
      if (deptId) {
        for (let i = 1; i <= setup.beds; i++) {
          const bedNumber = `${setup.department.substring(0, 2).toUpperCase()}-${i.toString().padStart(3, '0')}`;
          const bedType = setup.type || 'Standard';
          
          await query(`
            INSERT INTO nexus.beds (tenant_id, number, type, department, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'available', NOW(), NOW())
          `, [tenantId, bedNumber, bedType, deptId]);
        }
        console.log(`  ✅ Created ${setup.beds} ${setup.type} beds for ${setup.department}`);
      }
    }

    // 5. Schedule Appointments (patient journey starts here)
    console.log('\n📅 Scheduling appointments...');
    const appointments = [
      {
        patientEmail: 'john.smith@bhc.com',
        doctorEmail: 'dr.chen@bhc.com',
        type: 'Initial Consultation',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '09:00',
        reason: 'Annual health checkup'
      },
      {
        patientEmail: 'sarah.johnson@bhc.com',
        doctorEmail: 'dr.williams@bhc.com',
        type: 'Pediatric Checkup',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:30',
        reason: 'Child wellness examination'
      },
      {
        patientEmail: 'michael.brown@bhc.com',
        doctorEmail: 'dr.chen@bhc.com',
        type: 'Follow-up',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00',
        reason: 'Chronic condition review'
      },
      {
        patientEmail: 'emily.davis@bhc.com',
        doctorEmail: 'dr.williams@bhc.com',
        type: 'New Patient',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '15:30',
        reason: 'Initial consultation'
      }
    ];

    for (const appointment of appointments) {
      await query(`
        INSERT INTO nexus.appointments (tenant_id, patient_id, doctor_id, date, time, type, status, reason, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, NOW(), NOW())
      `, [
        tenantId,
        patientMap.get(appointment.patientEmail),
        staffMap.get(appointment.doctorEmail),
        appointment.date,
        appointment.time,
        appointment.type,
        appointment.reason
      ]);
      console.log(`  ✅ Scheduled: ${appointment.type} for ${appointment.patientEmail}`);
    }

    // 6. Create Encounters (clinical visits)
    console.log('\n🏥 Creating clinical encounters...');
    const encounters = [
      {
        patientEmail: 'john.smith@bhc.com',
        doctorEmail: 'dr.chen@bhc.com',
        type: 'Consultation',
        date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Annual health checkup',
        diagnosis: 'Healthy - No issues found',
        treatment_plan: 'Continue current lifestyle, return in 1 year'
      },
      {
        patientEmail: 'sarah.johnson@bhc.com',
        doctorEmail: 'dr.williams@bhc.com',
        type: 'Pediatric',
        date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Routine checkup',
        diagnosis: 'Healthy child, normal development',
        treatment_plan: 'Continue routine vaccinations'
      }
    ];

    for (const encounter of encounters) {
      await query(`
        INSERT INTO nexus.encounters (tenant_id, patient_id, doctor_id, date, type, chief_complaint, diagnosis, treatment_plan, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        tenantId,
        patientMap.get(encounter.patientEmail),
        staffMap.get(encounter.doctorEmail),
        encounter.date,
        encounter.type,
        encounter.chief_complaint,
        encounter.diagnosis,
        encounter.treatment_plan
      ]);
      console.log(`  ✅ Created ${encounter.type} encounter for ${encounter.patientEmail}`);
    }

    // 7. Update some bed occupancy (realistic occupancy)
    console.log('\n🛏️ Updating bed occupancy (realistic 60% occupancy)...');
    const availableBeds = await query('SELECT id FROM nexus.beds WHERE tenant_id = $1 AND status = $2', [tenantId, 'available']);
    
    const bedsToOccupy = Math.floor(availableBeds.rows.length * 0.6);
    const patientIds = Array.from(patientMap.values());
    
    for (let i = 0; i < bedsToOccupy; i++) {
      const patientId = patientIds[i % patientIds.length];
      const bedId = availableBeds.rows[i].id;
      
      await query(`
        UPDATE nexus.beds 
        SET patient_id = $1, status = 'occupied' 
        WHERE id = $2
      `, [patientId, bedId]);
    }
    console.log(`  ✅ Updated ${bedsToOccupy} beds to occupied status`);

    console.log('\n✅ Patient journey seeding completed successfully!');
    console.log('\n📊 Patient Journey Summary:');
    console.log(`  - Registered Patients: ${patientMap.size}`);
    console.log(`  - Clinical Staff: ${staffMap.size}`);
    console.log(`  - Departments: ${departmentMap.size}`);
    console.log(`  - Total Beds: ${bedSetup.reduce((sum, d) => sum + d.beds, 0)}`);
    console.log(`  - Scheduled Appointments: ${appointments.length}`);
    console.log(`  - Clinical Encounters: ${encounters.length}`);
    console.log(`  - Bed Occupancy: ${bedsToOccupy}/${availableBeds.rows.length} (${Math.round(bedsToOccupy/availableBeds.rows.length*100)}%)`);

  } catch (error) {
    console.error('❌ Error seeding patient journey:', error.message);
  }
}

// Run the seeding
seedPatientJourney();
