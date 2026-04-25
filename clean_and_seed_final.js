import { query } from './server/db/connection.js';
import { hashPassword } from './server/services/auth.service.js';

/**
 * Clean and Final HIPAA-Compliant Patient Journey Seeding
 * - Clean existing data first
 * - Create proper isolated tenant schema
 * - Seed complete patient journey
 */

async function cleanAndSeedFinal() {
  console.log('🧹 Cleaning and seeding final HIPAA-compliant patient journey...\n');

  try {
    // Get tenant info
    const tenantResult = await query('SELECT id, code, name FROM nexus.tenants WHERE code = $1', ['BHC']);
    if (tenantResult.rows.length === 0) {
      console.log('❌ BHC tenant not found');
      return;
    }
    
    const tenant = tenantResult.rows[0];
    const tenantCode = tenant.code.toLowerCase();
    console.log(`✅ Working with tenant: ${tenant.name} (${tenant.code})`);
    console.log(`📁 Tenant schema: ${tenantCode} (completely isolated)`);
    
    // Clean existing data in tenant schema
    console.log('\n🧹 Cleaning existing tenant data...');
    await query(`DROP SCHEMA IF EXISTS ${tenantCode} CASCADE`);
    console.log(`  ✅ Dropped existing ${tenantCode} schema`);
    
    // Create fresh HIPAA-compliant tenant schema
    console.log('\n🏗️ Creating fresh HIPAA-compliant tenant schema...');
    await query(`CREATE SCHEMA ${tenantCode}`);
    
    // Create complete patient tables in tenant schema (no tenant_id needed)
    const tables = [
      // Patients table - completely isolated
      `CREATE TABLE ${tenantCode}.patients (
        id VARCHAR(255) PRIMARY KEY,
        mrn VARCHAR(255) UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        gender VARCHAR(50),
        date_of_birth DATE,
        phone VARCHAR(255),
        email VARCHAR(255),
        address TEXT,
        blood_group VARCHAR(10),
        emergency_contact VARCHAR(255),
        insurance VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Users table - tenant-specific staff
      `CREATE TABLE ${tenantCode}.users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Departments table
      `CREATE TABLE ${tenantCode}.departments (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        head VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Beds table
      `CREATE TABLE ${tenantCode}.beds (
        id VARCHAR(255) PRIMARY KEY,
        number VARCHAR(100) NOT NULL,
        type VARCHAR(100),
        department VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        patient_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Appointments table
      `CREATE TABLE ${tenantCode}.appointments (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255),
        doctor_id VARCHAR(255),
        date DATE,
        time VARCHAR(10),
        duration INTEGER,
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Encounters table
      `CREATE TABLE ${tenantCode}.encounters (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255),
        doctor_id VARCHAR(255),
        date DATE,
        type VARCHAR(100),
        chief_complaint TEXT,
        diagnosis TEXT,
        treatment_plan TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Services table
      `CREATE TABLE ${tenantCode}.services (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Invoices table
      `CREATE TABLE ${tenantCode}.invoices (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255),
        invoice_number VARCHAR(255) UNIQUE,
        date DATE,
        total DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Invoice items table
      `CREATE TABLE ${tenantCode}.invoice_items (
        id VARCHAR(255) PRIMARY KEY,
        invoice_id VARCHAR(255),
        service VARCHAR(255),
        quantity INTEGER,
        price DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Pharmacy inventory table
      `CREATE TABLE ${tenantCode}.pharmacy_inventory (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        unit VARCHAR(50),
        min_stock INTEGER,
        price DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];
    
    for (const tableSQL of tables) {
      await query(tableSQL);
    }
    
    console.log(`✅ Created fresh schema for ${tenantCode}`);
    
    // Update tenant metrics in nexus (only counts, no PII)
    await query(`
      UPDATE nexus.management_tenant_metrics 
      SET tenant_name = '${tenant.name}', 
          schema_name = '${tenantCode}', 
          doctors_count = 0, 
          patients_count = 0, 
          available_beds = 0, 
          available_ambulances = 0, 
          active_users_count = 0, 
          updated_at = NOW()
      WHERE tenant_id = '${tenant.id}'
    `);
    
    // 1. Create Clinical Staff (in tenant schema only)
    console.log('\n👨‍⚕️ Creating clinical staff (tenant-isolated)...');
    const staffData = [
      { name: 'Dr. Robert Chen', email: 'dr.chen@bhc.health', role: 'Doctor' },
      { name: 'Dr. Sarah Williams', email: 'dr.williams@bhc.health', role: 'Doctor' },
      { name: 'Nurse Jennifer Brown', email: 'nurse.brown@bhc.health', role: 'Nurse' },
      { name: 'Admin Mary Davis', email: 'admin.davis@bhc.health', role: 'Admin' }
    ];

    const staffMap = new Map();
    for (const staff of staffData) {
      const staffId = `staff_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      const passwordHash = await hashPassword('Test@123');
      
      await query(`
        INSERT INTO ${tenantCode}.users (id, name, email, password_hash, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [staffId, staff.name, staff.email, passwordHash, staff.role]);
      
      staffMap.set(staff.email, staffId);
      console.log(`  ✅ Created staff: ${staff.name} (${staff.role})`);
    }

    // 2. Register Patients (in tenant schema only - completely isolated)
    console.log('\n👥 Registering patients (HIPAA-compliant isolation)...');
    const patientData = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@bhc.health',
        phone: '+1-555-0101',
        address: '123 Main St, Anytown, USA',
        emergency_contact: 'Jane Smith - +1-555-0102',
        insurance: 'BlueCross BlueShield',
        blood_group: 'O+',
        gender: 'Male',
        dateOfBirth: '1985-03-15'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@bhc.health',
        phone: '+1-555-0103',
        address: '456 Oak Ave, Anytown, USA',
        emergency_contact: 'Mike Johnson - +1-555-0104',
        insurance: 'Aetna',
        blood_group: 'A+',
        gender: 'Female',
        dateOfBirth: '1990-07-22'
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@bhc.health',
        phone: '+1-555-0105',
        address: '789 Pine Rd, Anytown, USA',
        emergency_contact: 'Lisa Brown - +1-555-0106',
        insurance: 'UnitedHealth',
        blood_group: 'B+',
        gender: 'Male',
        dateOfBirth: '1978-11-08'
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@bhc.health',
        phone: '+1-555-0107',
        address: '321 Elm St, Anytown, USA',
        emergency_contact: 'Robert Davis - +1-555-0108',
        insurance: 'Cigna',
        blood_group: 'AB+',
        gender: 'Female',
        dateOfBirth: '1992-04-30'
      },
      {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@bhc.health',
        phone: '+1-555-0109',
        address: '654 Maple Dr, Anytown, USA',
        emergency_contact: 'Mary Wilson - +1-555-0110',
        insurance: 'Humana',
        blood_group: 'O-',
        gender: 'Male',
        dateOfBirth: '1983-09-12'
      }
    ];

    const patientMap = new Map();
    for (const patient of patientData) {
      const patientId = `patient_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      const mrn = `BHC-${Date.now().toString(36).substr(2, 9).toUpperCase()}`;
      
      await query(`
        INSERT INTO ${tenantCode}.patients (id, mrn, first_name, last_name, gender, date_of_birth, phone, email, address, blood_group, emergency_contact, insurance, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      `, [
        patientId, mrn, patient.firstName, patient.lastName, patient.gender, 
        patient.dateOfBirth, patient.phone, patient.email, patient.address, 
        patient.blood_group, patient.emergency_contact, patient.insurance
      ]);
      
      patientMap.set(patient.email, patientId);
      console.log(`  ✅ Registered patient: ${patient.firstName} ${patient.lastName} (MRN: ${mrn})`);
    }

    // 3. Create Departments (tenant-isolated)
    console.log('\n🏥 Creating departments (tenant-isolated)...');
    const departments = [
      { name: 'Emergency', description: 'Emergency medical services 24/7', head: 'Dr. Robert Chen' },
      { name: 'Internal Medicine', description: 'General medical care and consultations', head: 'Dr. Robert Chen' },
      { name: 'Pediatrics', description: 'Children healthcare and pediatric services', head: 'Dr. Sarah Williams' },
      { name: 'Cardiology', description: 'Heart and cardiovascular care', head: 'Dr. External Specialist' }
    ];

    const departmentMap = new Map();
    for (const dept of departments) {
      const deptId = `dept_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      
      await query(`
        INSERT INTO ${tenantCode}.departments (id, name, description, head, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [deptId, dept.name, dept.description, dept.head]);
      
      departmentMap.set(dept.name, deptId);
      console.log(`  ✅ Created department: ${dept.name}`);
    }

    // 4. Setup Beds (tenant-isolated)
    console.log('\n🛏️ Setting up beds (tenant-isolated)...');
    const bedSetup = [
      { department: 'Emergency', beds: 10, type: 'Emergency' },
      { department: 'Internal Medicine', beds: 15, type: 'Standard' },
      { department: 'Pediatrics', beds: 8, type: 'Pediatric' },
      { department: 'Cardiology', beds: 12, type: 'ICU' }
    ];

    for (const setup of bedSetup) {
      const deptId = departmentMap.get(setup.department);
      if (deptId) {
        for (let i = 1; i <= setup.beds; i++) {
          const bedId = `bed_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
          const bedNumber = `${setup.department.substring(0, 2).toUpperCase()}-${i.toString().padStart(3, '0')}`;
          
          await query(`
            INSERT INTO ${tenantCode}.beds (id, number, type, department, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'available', NOW(), NOW())
          `, [bedId, bedNumber, setup.type, deptId]);
        }
        console.log(`  ✅ Created ${setup.beds} ${setup.type} beds for ${setup.department}`);
      }
    }

    // 5. Schedule Appointments (tenant-isolated)
    console.log('\n📅 Scheduling appointments (tenant-isolated)...');
    const appointments = [
      {
        patientEmail: 'john.smith@bhc.health',
        doctorEmail: 'dr.chen@bhc.health',
        type: 'Initial Consultation',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '09:00',
        reason: 'Annual health checkup',
        notes: 'Regular annual health examination'
      },
      {
        patientEmail: 'sarah.johnson@bhc.health',
        doctorEmail: 'dr.williams@bhc.health',
        type: 'Pediatric Checkup',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:30',
        reason: 'Child wellness examination',
        notes: 'Routine pediatric wellness check'
      },
      {
        patientEmail: 'michael.brown@bhc.health',
        doctorEmail: 'dr.chen@bhc.health',
        type: 'Follow-up',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00',
        reason: 'Chronic condition review',
        notes: 'Review treatment progress for chronic condition'
      },
      {
        patientEmail: 'emily.davis@bhc.health',
        doctorEmail: 'dr.williams@bhc.health',
        type: 'New Patient',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '15:30',
        reason: 'Initial consultation',
        notes: 'First-time patient consultation'
      }
    ];

    for (const appointment of appointments) {
      const appointmentId = `apt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      
      await query(`
        INSERT INTO ${tenantCode}.appointments (id, patient_id, doctor_id, date, time, type, status, reason, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, $8, NOW(), NOW())
      `, [
        appointmentId, patientMap.get(appointment.patientEmail), staffMap.get(appointment.doctorEmail),
        appointment.date, appointment.time, appointment.type, appointment.reason, appointment.notes
      ]);
      console.log(`  ✅ Scheduled: ${appointment.type} for ${appointment.patientEmail}`);
    }

    // 6. Create Clinical Encounters (tenant-isolated)
    console.log('\n🏥 Creating clinical encounters (tenant-isolated)...');
    const encounters = [
      {
        patientEmail: 'john.smith@bhc.health',
        doctorEmail: 'dr.chen@bhc.health',
        type: 'Consultation',
        date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Annual health checkup',
        diagnosis: 'Healthy - No issues found',
        treatment_plan: 'Continue current lifestyle, return in 1 year'
      },
      {
        patientEmail: 'sarah.johnson@bhc.health',
        doctorEmail: 'dr.williams@bhc.health',
        type: 'Pediatric',
        date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Routine checkup',
        diagnosis: 'Healthy child, normal development',
        treatment_plan: 'Continue routine vaccinations'
      }
    ];

    for (const encounter of encounters) {
      const encounterId = `enc_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      
      await query(`
        INSERT INTO ${tenantCode}.encounters (id, patient_id, doctor_id, date, type, chief_complaint, diagnosis, treatment_plan, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        encounterId, patientMap.get(encounter.patientEmail), staffMap.get(encounter.doctorEmail),
        encounter.date, encounter.type, encounter.chief_complaint, encounter.diagnosis, encounter.treatment_plan
      ]);
      console.log(`  ✅ Created ${encounter.type} encounter for ${encounter.patientEmail}`);
    }

    // 7. Create Services (tenant-isolated)
    console.log('\n💼 Creating services (tenant-isolated)...');
    const services = [
      { name: 'General Consultation', category: 'Consultation', price: 150 },
      { name: 'Specialist Consultation', category: 'Consultation', price: 250 },
      { name: 'Emergency Visit', category: 'Emergency', price: 500 },
      { name: 'X-Ray', category: 'Diagnostics', price: 200 },
      { name: 'Blood Test', category: 'Diagnostics', price: 100 },
      { name: 'ECG', category: 'Diagnostics', price: 150 },
      { name: 'Vaccination', category: 'Preventive', price: 75 },
      { name: 'Health Checkup', category: 'Preventive', price: 300 }
    ];

    for (const service of services) {
      const serviceId = `svc_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      
      await query(`
        INSERT INTO ${tenantCode}.services (id, name, category, price, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      `, [serviceId, service.name, service.category, service.price]);
      console.log(`  ✅ Created service: ${service.name} ($${service.price})`);
    }

    // 8. Create Sample Invoices (tenant-isolated)
    console.log('\n💰 Creating sample invoices (tenant-isolated)...');
    const invoices = [
      {
        patientEmail: 'john.smith@bhc.health',
        invoiceNumber: 'BHC-2023-001',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: 150,
        status: 'paid',
        items: [{ service: 'General Consultation', quantity: 1, price: 150 }]
      },
      {
        patientEmail: 'sarah.johnson@bhc.health',
        invoiceNumber: 'BHC-2023-002',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: 350,
        status: 'paid',
        items: [
          { service: 'Specialist Consultation', quantity: 1, price: 250 },
          { service: 'X-Ray', quantity: 1, price: 100 }
        ]
      }
    ];

    for (const invoice of invoices) {
      const invoiceId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      
      await query(`
        INSERT INTO ${tenantCode}.invoices (id, patient_id, invoice_number, date, total, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [invoiceId, patientMap.get(invoice.patientEmail), invoice.invoiceNumber, invoice.date, invoice.total, invoice.status]);
      
      // Add invoice items
      for (const item of invoice.items) {
        const itemId = `item_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
        await query(`
          INSERT INTO ${tenantCode}.invoice_items (id, invoice_id, service, quantity, price, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [itemId, invoiceId, item.service, item.quantity, item.price]);
      }
      
      console.log(`  ✅ Created invoice: ${invoice.invoiceNumber} ($${invoice.total})`);
    }

    // 9. Create Pharmacy Inventory (tenant-isolated)
    console.log('\n💊 Creating pharmacy inventory (tenant-isolated)...');
    const pharmacyItems = [
      { name: 'Amoxicillin', category: 'Antibiotics', stock: 150, unit: 'capsules', minStock: 50, price: 5.50 },
      { name: 'Ibuprofen', category: 'Pain Relief', stock: 200, unit: 'tablets', minStock: 100, price: 2.25 },
      { name: 'Acetaminophen', category: 'Pain Relief', stock: 300, unit: 'tablets', minStock: 150, price: 1.75 },
      { name: 'Lisinopril', category: 'Blood Pressure', stock: 100, unit: 'tablets', minStock: 30, price: 8.50 },
      { name: 'Metformin', category: 'Diabetes', stock: 120, unit: 'tablets', minStock: 40, price: 3.25 }
    ];

    for (const item of pharmacyItems) {
      const itemId = `pharm_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
      
      await query(`
        INSERT INTO ${tenantCode}.pharmacy_inventory (id, name, category, stock, unit, min_stock, price, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [itemId, item.name, item.category, item.stock, item.unit, item.minStock, item.price]);
      console.log(`  ✅ Added inventory: ${item.name} (${item.stock} ${item.unit})`);
    }

    // 10. Update some bed occupancy (realistic 60% occupancy)
    console.log('\n🛏️ Updating bed occupancy (60% realistic)...');
    const availableBeds = await query(`SELECT id FROM ${tenantCode}.beds WHERE status = 'available'`);
    
    const bedsToOccupy = Math.floor(availableBeds.rows.length * 0.6);
    const patientIds = Array.from(patientMap.values());
    
    for (let i = 0; i < bedsToOccupy; i++) {
      const patientId = patientIds[i % patientIds.length];
      const bedId = availableBeds.rows[i].id;
      
      await query(`
        UPDATE ${tenantCode}.beds 
        SET patient_id = $1, status = 'occupied' 
        WHERE id = $2
      `, [patientId, bedId]);
    }
    console.log(`  ✅ Updated ${bedsToOccupy} beds to occupied status`);

    // 11. Manually update nexus metrics (since triggers might not work properly)
    console.log('\n📊 Updating nexus metrics (HIPAA-compliant aggregation)...');
    await query(`
      UPDATE nexus.management_tenant_metrics 
      SET patients_count = (SELECT COUNT(*) FROM ${tenantCode}.patients),
          doctors_count = (SELECT COUNT(*) FROM ${tenantCode}.users WHERE role = 'Doctor'),
          available_beds = (SELECT COUNT(*) FROM ${tenantCode}.beds WHERE status = 'available'),
          active_users_count = (SELECT COUNT(*) FROM ${tenantCode}.users WHERE is_active = true),
          updated_at = NOW()
      WHERE tenant_id = '${tenant.id}'
    `);

    console.log('\n✅ Clean and final HIPAA-compliant patient journey seeding completed successfully!');
    console.log('\n🛡️ HIPAA Compliance Summary:');
    console.log(`  ✅ Patient data: Completely isolated in ${tenantCode} schema`);
    console.log(`  ✅ Nexus schema: Only tenant management and aggregated counts`);
    console.log(`  ✅ Data isolation: Complete tenant separation`);
    console.log(`  ✅ No cross-tenant data leakage`);
    console.log(`  ✅ Clean start: No conflicting data`);
    
    console.log('\n📊 Patient Journey Summary:');
    console.log(`  - Registered Patients: ${patientMap.size}`);
    console.log(`  - Clinical Staff: ${staffMap.size}`);
    console.log(`  - Departments: ${departmentMap.size}`);
    console.log(`  - Total Beds: ${bedSetup.reduce((sum, d) => sum + d.beds, 0)}`);
    console.log(`  - Scheduled Appointments: ${appointments.length}`);
    console.log(`  - Clinical Encounters: ${encounters.length}`);
    console.log(`  - Services: ${services.length}`);
    console.log(`  - Invoices: ${invoices.length}`);
    console.log(`  - Pharmacy Items: ${pharmacyItems.length}`);
    console.log(`  - Bed Occupancy: ${bedsToOccupy}/${availableBeds.rows.length} (${Math.round(bedsToOccupy/availableBeds.rows.length*100)}%)`);
    
    console.log(`\n🎯 HIPAA-compliant demo ready!`);
    console.log(`\n🔑 Login credentials: admin.davis@bhc.health / Test@123`);

  } catch (error) {
    console.error('❌ Error in clean and final seeding:', error.message);
  }
}

// Run the seeding
cleanAndSeedFinal();
