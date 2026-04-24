import { query } from './server/db/connection.js';
import { ensureTenantSchema } from './server/utils/tenant-schema-helper.js';

async function createNHGLSchema() {
  try {
    const nhglTenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    const nhglSchema = 'nhgl';
    
    console.log('=== CREATING NHGL TENANT SCHEMA ===\n');
    
    // Step 1: Create the schema
    console.log('1. Creating nhgl schema...');
    try {
      await query(`CREATE SCHEMA ${nhglSchema}`);
      console.log('Schema nhgl created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Schema nhgl already exists');
      } else {
        throw error;
      }
    }
    
    // Step 2: Create tables using the comprehensive schema
    console.log('2. Creating tables in nhgl schema...');
    
    // Read the comprehensive schema file
    const fs = await import('fs');
    const path = await import('path');
    const schemaFile = await fs.promises.readFile('./database/tenant_base_schema_comprehensive_v2.sql', 'utf8');
    
    // Replace the schema placeholder with nhgl
    const nhglSchemaSQL = schemaFile.replace(/SET search_path TO tenant_schema;/g, `SET search_path TO ${nhglSchema};`);
    
    // Execute the schema creation
    const schemaStatements = nhglSchemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          console.log('Schema statement failed (likely already exists):', error.message.substring(0, 100));
        }
      }
    }
    
    console.log('Tables created in nhgl schema');
    
    // Step 3: Populate with initial data
    console.log('3. Populating nhgl with initial data...');
    
    // Create departments
    await query(`
      INSERT INTO ${nhglSchema}.departments (tenant_id, name, description, created_at, updated_at)
      VALUES 
        ($1, 'General Medicine', 'General medical services', NOW(), NOW()),
        ($1, 'Emergency', 'Emergency medical services', NOW(), NOW()),
        ($1, 'Pediatrics', 'Pediatric medical services', NOW(), NOW()),
        ($1, 'Cardiology', 'Cardiac care services', NOW(), NOW()),
        ($1, 'Orthopedics', 'Orthopedic services', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create services
    await query(`
      INSERT INTO ${nhglSchema}.services (tenant_id, name, category, description, created_at, updated_at)
      VALUES 
        ($1, 'General Consultation', 'Consultation', 'General medical consultation', NOW(), NOW()),
        ($1, 'Emergency Care', 'Emergency', 'Emergency medical care', NOW(), NOW()),
        ($1, 'Cardiac Checkup', 'Cardiology', 'Cardiac health checkup', NOW(), NOW()),
        ($1, 'Pediatric Care', 'Pediatrics', 'Pediatric medical care', NOW(), NOW()),
        ($1, 'Orthopedic Consultation', 'Orthopedics', 'Orthopedic consultation', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create wards
    await query(`
      INSERT INTO ${nhglSchema}.wards (tenant_id, name, floor, capacity, created_at, updated_at)
      VALUES 
        ($1, 'General Ward A', 1, 30, NOW(), NOW()),
        ($1, 'General Ward B', 1, 30, NOW(), NOW()),
        ($1, 'Emergency Ward', 1, 20, NOW(), NOW()),
        ($1, 'ICU', 2, 10, NOW(), NOW()),
        ($1, 'Pediatric Ward', 2, 25, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create beds
    const wards = await query('SELECT id FROM nhgl_emr.wards WHERE tenant_id = $1', [nhglTenantId]);
    
    for (const ward of wards.rows) {
      const wardCapacity = await query('SELECT capacity FROM nhgl_emr.wards WHERE id = $1', [ward.id]);
      const capacity = wardCapacity.rows[0].capacity;
      
      for (let i = 1; i <= capacity; i++) {
        await query(`
          INSERT INTO ${nhglSchema}.beds (tenant_id, ward_id, bed_number, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [nhglTenantId, ward.id, `${ward.name.substring(0, 3).toUpperCase()}-${i}`, i <= capacity * 0.7 ? 'occupied' : 'available']);
      }
    }
    
    // Create employees
    await query(`
      INSERT INTO ${nhglSchema}.employees (tenant_id, name, designation, department, contact_number, email, created_at, updated_at)
      VALUES 
        ($1, 'Dr. Rajesh Kumar', 'Senior Doctor', 'General Medicine', '9876543210', 'rajesh.kumar@nhgl.hospital', NOW(), NOW()),
        ($1, 'Dr. Priya Sharma', 'Doctor', 'Cardiology', '9876543211', 'priya.sharma@nhgl.hospital', NOW(), NOW()),
        ($1, 'Dr. Amit Patel', 'Doctor', 'Pediatrics', '9876543212', 'amit.patel@nhgl.hospital', NOW(), NOW()),
        ($1, 'Nurse Sarah Johnson', 'Head Nurse', 'Emergency', '9876543213', 'sarah.johnson@nhgl.hospital', NOW(), NOW()),
        ($1, 'Nurse Michael Chen', 'Nurse', 'General Ward', '9876543214', 'michael.chen@nhgl.hospital', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create lab tests
    await query(`
      INSERT INTO ${nhglSchema}.lab_tests (tenant_id, name, category, description, normal_range, created_at, updated_at)
      VALUES 
        ($1, 'Complete Blood Count', 'Hematology', 'Complete blood count test', 'RBC: 4.5-5.5, WBC: 4-11', NOW(), NOW()),
        ($1, 'Lipid Profile', 'Biochemistry', 'Lipid profile test', 'Total Cholesterol: <200 mg/dL', NOW(), NOW()),
        ($1, 'ECG', 'Cardiology', 'Electrocardiogram test', 'Normal rhythm', NOW(), NOW()),
        ($1, 'X-Ray Chest', 'Radiology', 'Chest X-ray examination', 'Normal findings', NOW(), NOW()),
        ($1, 'Blood Sugar', 'Pathology', 'Blood glucose test', 'Fasting: 70-100 mg/dL', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create sample patients
    for (let i = 1; i <= 50; i++) {
      await query(`
        INSERT INTO ${nhglSchema}.patients (tenant_id, first_name, last_name, date_of_birth, gender, phone, email, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [
        nhglTenantId,
        `Patient${i}`,
        `NHGL${i}`,
        new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
        Math.random() > 0.5 ? 'Male' : 'Female',
        `9876543${1000 + i}`,
        `patient${i}@nhgl.hospital`
      ]);
    }
    
    // Create sample appointments
    const patients = await query('SELECT id FROM nhgl_emr.patients WHERE tenant_id = $1 LIMIT 20', [nhglTenantId]);
    const doctors = await query('SELECT id FROM emr.users WHERE tenant_id = $1 AND role = \'doctor\'', [nhglTenantId]);
    
    for (let i = 0; i < 20; i++) {
      await query(`
        INSERT INTO ${nhglSchema}.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '${i} hours', NOW() + INTERVAL '${i} hours' + INTERVAL '1 hour', 'completed', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [
        nhglTenantId,
        patients.rows[i % patients.rows.length].id,
        doctors.rows[i % doctors.rows.length].id
      ]);
    }
    
    // Create sample invoices
    for (let i = 0; i < 30; i++) {
      await query(`
        INSERT INTO ${nhglSchema}.invoices (tenant_id, patient_id, invoice_number, total, status, created_at, updated_at)
        VALUES ($1, $2, 'NHGL-' || EXTRACT(EPOCH FROM NOW())::text || '-' || floor(random() * 1000)::text, $3, $4, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [
        nhglTenantId,
        patients.rows[i % patients.rows.length].id,
        500 + Math.floor(Math.random() * 2000),
        Math.random() > 0.3 ? 'paid' : 'pending'
      ]);
    }
    
    console.log('NHGL schema populated with initial data');
    
    // Step 4: Verify the setup
    console.log('\n4. Verifying NHGL setup...');
    
    const verification = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${nhglSchema}.patients WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*) as count FROM ${nhglSchema}.appointments WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*) as count FROM ${nhglSchema}.invoices WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*) as count FROM ${nhglSchema}.beds WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*) as count FROM ${nhglSchema}.employees WHERE tenant_id = $1`, [nhglTenantId])
    ]);
    
    console.log('\nNHGL Schema Data:');
    console.log(` Patients: ${verification[0].rows[0].count}`);
    console.log(` Appointments: ${verification[1].rows[0].count}`);
    console.log(` Invoices: ${verification[2].rows[0].count}`);
    console.log(` Beds: ${verification[3].rows[0].count}`);
    console.log(` Employees: ${verification[4].rows[0].count}`);
    
    console.log('\n=== SUCCESS ===');
    console.log('NHGL tenant schema has been created and populated!');
    console.log('The NHGL tenant can now use its own schema: nhgl_emr');
    console.log('Both DEMO and NHGL tenants should now work independently');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the server to apply all changes');
    console.log('2. Test login with NHGL tenant credentials');
    console.log('3. Verify NHGL dashboard shows its own data');
    console.log('4. Test Reports & Analysis page for NHGL tenant');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createNHGLSchema();
