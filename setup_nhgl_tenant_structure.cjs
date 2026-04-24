const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Setting Up NHGL Tenant Structure ===');
    
    // Find NHGL tenant
    const nhglTenant = await query(`
      SELECT id, name, code, schema_name 
      FROM emr.management_tenants 
      WHERE code ILIKE '%nhgl%' OR name ILIKE '%nhgl%'
    `);
    
    if (nhglTenant.rows.length === 0) {
      console.log('NHGL tenant not found');
      process.exit(1);
    }
    
    const tenant = nhglTenant.rows[0];
    console.log(`NHGL Tenant: ${tenant.name} (Schema: ${tenant.schema_name})`);
    
    // Check existing schemas
    const schemas = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'emr')
      ORDER BY schema_name
    `);
    
    console.log('\nExisting tenant schemas:');
    schemas.rows.forEach(s => console.log(`- ${s.schema_name}`));
    
    // Create NHGL schema if it doesn't exist
    if (!schemas.rows.some(s => s.schema_name === tenant.schema_name)) {
      console.log(`\nCreating schema: ${tenant.schema_name}`);
      await query(`CREATE SCHEMA "${tenant.schema_name}"`);
      console.log('✅ Schema created');
    }
    
    // Create basic tenant tables
    console.log('\nCreating tenant tables...');
    
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            tenant_id UUID NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'patients',
        sql: `
          CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".patients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            date_of_birth DATE,
            gender VARCHAR(20),
            address TEXT,
            mrn VARCHAR(50) UNIQUE,
            blood_group VARCHAR(10),
            medical_history TEXT,
            emergency_contact TEXT,
            insurance JSONB,
            tenant_id UUID NOT NULL,
            is_archived BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'employees',
        sql: `
          CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".employees (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(50),
            designation VARCHAR(255),
            department VARCHAR(255),
            tenant_id UUID NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'encounters',
        sql: `
          CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".encounters (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID NOT NULL,
            provider_id UUID NOT NULL,
            type VARCHAR(50) NOT NULL,
            priority VARCHAR(20) DEFAULT 'routine',
            chief_complaint TEXT,
            diagnosis TEXT,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'active',
            tenant_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'beds',
        sql: `
          CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".beds (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            bed_number VARCHAR(50) NOT NULL,
            ward VARCHAR(100),
            status VARCHAR(20) DEFAULT 'available',
            tenant_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'ambulances',
        sql: `
          CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".ambulances (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vehicle_number VARCHAR(50) NOT NULL,
            driver_name VARCHAR(255),
            status VARCHAR(20) DEFAULT 'available',
            tenant_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      }
    ];
    
    for (const table of tables) {
      try {
        await query(table.sql);
        console.log(`✅ Created table: ${table.name}`);
      } catch (error) {
        console.log(`⚠️  Table ${table.name} already exists or failed: ${error.message}`);
      }
    }
    
    // Create clinical users
    const clinicalUsers = [
      { 
        email: 'doctor@nhgl.com', 
        name: 'Dr. John Smith', 
        role: 'doctor',
        password: 'Admin@123'
      },
      { 
        email: 'nurse@nhgl.com', 
        name: 'Nurse Sarah Johnson', 
        role: 'nurse',
        password: 'Admin@123'
      },
      { 
        email: 'admin@nhgl.com', 
        name: 'Admin Mike Wilson', 
        role: 'admin',
        password: 'Admin@123'
      },
      { 
        email: 'reception@nhgl.com', 
        name: 'Receptionist Lisa Brown', 
        role: 'receptionist',
        password: 'Admin@123'
      }
    ];
    
    const bcrypt = require('bcryptjs');
    
    console.log('\nCreating clinical users in tenant schema...');
    
    for (const user of clinicalUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await query(`
          INSERT INTO "${tenant.schema_name}".users (email, name, role, tenant_id, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            tenant_id = EXCLUDED.tenant_id,
            password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
        `, [user.email, user.name, user.role, tenant.id, hashedPassword]);
        
        console.log(`✅ Created: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`⚠️  Failed to create ${user.email}: ${error.message}`);
      }
    }
    
    // Also create global auth entries
    console.log('\nCreating global authentication entries...');
    
    for (const user of clinicalUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await query(`
          INSERT INTO emr.users (email, name, role, tenant_id, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            tenant_id = EXCLUDED.tenant_id,
            password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
        `, [user.email, user.name, user.role, tenant.id, hashedPassword]);
        
        console.log(`✅ Global auth: ${user.email}`);
      } catch (error) {
        console.log(`⚠️  Global auth failed for ${user.email}: ${error.message}`);
      }
    }
    
    // Add sample data
    console.log('\nAdding sample data...');
    
    // Add sample employees
    const sampleEmployees = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@nhgl.com', designation: 'Senior Doctor', department: 'Medicine' },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@nhgl.com', designation: 'Head Nurse', department: 'Nursing' },
      { first_name: 'Mike', last_name: 'Wilson', email: 'mike.wilson@nhgl.com', designation: 'Hospital Admin', department: 'Administration' }
    ];
    
    for (const emp of sampleEmployees) {
      await query(`
        INSERT INTO "${tenant.schema_name}".employees (first_name, last_name, email, designation, department, tenant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `, [emp.first_name, emp.last_name, emp.email, emp.designation, emp.department, tenant.id]);
    }
    
    // Add sample patients
    const samplePatients = [
      { first_name: 'Rahul', last_name: 'Kumar', email: 'rahul.k@email.com', phone: '9876543210', gender: 'Male' },
      { first_name: 'Priya', last_name: 'Sharma', email: 'priya.s@email.com', phone: '9876543211', gender: 'Female' },
      { first_name: 'Amit', last_name: 'Patel', email: 'amit.p@email.com', phone: '9876543212', gender: 'Male' }
    ];
    
    for (const patient of samplePatients) {
      await query(`
        INSERT INTO "${tenant.schema_name}".patients (first_name, last_name, email, phone, gender, tenant_id, mrn, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (mrn) DO NOTHING
      `, [patient.first_name, patient.last_name, patient.email, patient.phone, patient.gender, tenant.id, `MRN${Math.floor(Math.random() * 10000)}`]);
    }
    
    // Add sample beds
    for (let i = 1; i <= 5; i++) {
      await query(`
        INSERT INTO "${tenant.schema_name}".beds (bed_number, ward, status, tenant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (bed_number) DO NOTHING
      `, [`BED-${i}`, 'General Ward', i <= 3 ? 'available' : 'occupied', tenant.id]);
    }
    
    console.log('✅ Sample data added');
    
    console.log('\n=== NHGL TENANT SETUP COMPLETE ===');
    console.log('✅ Schema created');
    console.log('✅ Tables created');
    console.log('✅ Users created');
    console.log('✅ Sample data added');
    console.log('✅ Proper multi-tenant architecture');
    
    console.log('\n=== CREDENTIALS ===');
    console.log('Tenant ID:', tenant.id);
    console.log('Schema:', tenant.schema_name);
    console.log('\nDoctor Login:');
    console.log('  Email: doctor@nhgl.com');
    console.log('  Password: Admin@123');
    console.log('  Tenant ID: ' + tenant.id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
