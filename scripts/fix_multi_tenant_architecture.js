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

async function fixMultiTenantArchitecture() {
  console.log(' Fixing Multi-Tenant Architecture - Separate Schemas per Tenant...\n');

  try {
    // Get tenant information
    const tenantResult = await query(
      'SELECT id, code, name FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log(` Found tenant: ${tenant.name} (${tenant.code}) - ID: ${tenant.id}`);

    // Check if separate schema exists
    const schemaName = `demo_emr`;
    
    try {
      const schemaExists = await query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schemaName]
      );
      
      if (schemaExists.rows.length === 0) {
        console.log(` Creating separate schema: ${schemaName}`);
        
        // Create the tenant-specific schema
        await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
        
        // Grant permissions to tenant
        await query(`GRANT ALL ON SCHEMA ${schemaName} TO ${schemaName}_user`);
        await query(`GRANT ALL ON SCHEMA ${schemaName} TO ${schemaName}_admin`);
        
        // Grant usage to main user
        await query(`GRANT USAGE ON SCHEMA ${schemaName} TO emr_admin`);
        
        console.log(`Schema ${schemaName} created and permissions granted`);
      } else {
        console.log(`Schema ${schemaName} already exists`);
      }
      
      // Create tenant-specific tables in the schema
      await createTenantTables(schemaName, tenant.id);
      
      // Migrate existing data from shared schema to tenant schema
      await migrateDataToTenantSchema(schemaName, tenant.id);
      
      console.log(' Multi-tenant architecture fix completed!');
      
    } catch (error) {
      console.error(' Error fixing multi-tenant architecture:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error(' Error in fixMultiTenantArchitecture:', error);
    return { success: false, error: error.message };
  }
}

async function createTenantTables(schemaName, tenantId) {
  console.log(` Creating tables in schema: ${schemaName}`);
  
  try {
    // Core Clinical Tables
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.patients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      mrn varchar(64) NOT NULL,
      first_name text NOT NULL,
      last_name text NOT NULL,
      date_of_birth date,
      gender varchar(16),
      phone varchar(32),
      email text,
      address text,
      blood_group varchar(8),
      emergency_contact varchar(128),
      insurance varchar(256),
      medical_history jsonb NOT NULL DEFAULT '{"chronicConditions":"","allergies":"","surgeries":"","familyHistory":""}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, mrn)
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.walkins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      phone varchar(32) NOT NULL,
      reason text,
      status varchar(16) NOT NULL DEFAULT 'waiting',
      patient_id uuid REFERENCES ${schemaName}.patients(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.appointments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES ${schemaName}.patients(id) ON DELETE RESTRICT,
      provider_id uuid,
      scheduled_start timestamptz NOT NULL,
      scheduled_end timestamptz NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'scheduled',
      reason text,
      source varchar(16) DEFAULT 'staff',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (scheduled_end > scheduled_start)
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.encounters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES ${schemaName}.patients(id) ON DELETE RESTRICT,
      provider_id uuid,
      encounter_type varchar(32) NOT NULL,
      visit_date date NOT NULL DEFAULT CURRENT_DATE,
      chief_complaint text,
      diagnosis text,
      notes text,
      status varchar(16) NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.clinical_records (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES ${schemaName}.patients(id) ON DELETE CASCADE,
      encounter_id uuid REFERENCES ${schemaName}.encounters(id) ON DELETE SET NULL,
      section varchar(32) NOT NULL,
      content jsonb NOT NULL,
      created_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.prescriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      encounter_id uuid NOT NULL REFERENCES ${schemaName}.encounters(id) ON DELETE CASCADE,
      drug_name text NOT NULL,
      dosage text,
      frequency text,
      duration text,
      instructions text,
      status varchar(16) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    // Hospital Operations
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.departments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      code varchar(32) NOT NULL,
      hod_user_id uuid,
      status varchar(16) NOT NULL DEFAULT 'active',
      created_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, code),
      UNIQUE (tenant_id, name)
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.wards (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      type varchar(32) NOT NULL,
      base_rate decimal(12,2) DEFAULT 0,
      status varchar(16) NOT NULL DEFAULT 'Active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, name)
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.beds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      ward_id uuid NOT NULL REFERENCES ${schemaName}.wards(id) ON DELETE CASCADE,
      bed_number varchar(16) NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'Available',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, ward_id, bed_number)
    )`, []);

    // Financial
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES ${schemaName}.patients(id) ON DELETE RESTRICT,
      invoice_number varchar(32) UNIQUE,
      total decimal(12,2) NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'draft',
      due_date date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    // Inventory
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.inventory_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      item_code varchar(32) UNIQUE,
      name text NOT NULL,
      category text,
      current_stock integer DEFAULT 0,
      reorder_level integer DEFAULT 0,
      unit text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    // Staff
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.employees (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      designation text,
      department text,
      email text,
      phone varchar(32),
      salary numeric,
      code varchar(32) NOT NULL,
      join_date date,
      shift text,
      supervisor_id uuid,
      leave_balance integer,
      is_active boolean DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      bank_account text
    )`, []);

    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.attendance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      employee_id uuid NOT NULL REFERENCES ${schemaName}.employees(id) ON DELETE CASCADE,
      date date NOT NULL,
      status varchar(16) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at tidentamptz NOT NULL DEFAULT now()
    )`, []);

    // Lab & Diagnostics
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.diagnostic_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES ${schemaName}.patients(id) ON DELETE CASCADE,
      encounter_id uuid REFERENCES ${schemaName}.encounters(id) ON DELETE SET NULL,
      report_id uuid,
      status varchar(16) NOT NULL DEFAULT 'completed',
      category text,
      code_loinc varchar(20),
      code_snomed varchar(20),
      conclusion jsonb,
      presented_form_data text,
      presented_form_content_type text,
      issued_datetime timestamptz,
      performer_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_by uuid,
      fhir_diagnostic_report_ref uuid
    )`, []);

    // Ambulance Fleet
    await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.ambulances (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      vehicle_number varchar(32) UNIQUE,
      status varchar(32) NOT NULL DEFAULT 'available',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`, []);

    console.log(` Created all tables in schema: ${schemaName}`);
    
  } catch (error) {
      console.error(`Error creating tables in ${schemaName}:`, error.message);
      throw error;
  }
}

async function migrateDataToTenantSchema(schemaName, tenantId) {
  console.log(`Migrating data to ${schemaName}...`);
  
  try {
    // Get existing data from shared schema
    const [patients, appointments, encounters, inventoryItems, employees, departments, wards, beds, invoices, diagnosticReports, ambulances] = await Promise.all([
      query('SELECT * FROM emr.patients WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.appointments WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.encounters WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.inventory_items WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.employees WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.departments WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.wards WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.beds WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.invoices WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.diagnostic_reports WHERE tenant_id = $1', [tenantId]),
      query('SELECT * FROM emr.ambulances WHERE tenant_id = $1', [tenantId])
    ]);

    // Migrate Patients
    for (const patient of patients.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.patients 
          (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          patient.id, tenantId, patient.mrn, patient.first_name, patient.last_name, 
          patient.date_of_birth, patient.gender, patient.phone, patient.email, 
          patient.address, patient.blood_group, patient.emergency_contact, 
          patient.insurance, patient.medical_history, patient.created_at, patient.updated_at
        ]);
      } catch (error) {
        console.log(`Patient ${patient.id} already exists or migration failed`);
      }
    }

    // Migrate Appointments
    for (const appointment of appointments.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.appointments 
          (id, tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, source, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          appointment.id, tenantId, appointment.patient_id, appointment.provider_id, 
          appointment.scheduled_start, appointment.scheduled_end, appointment.status, 
          appointment.reason, appointment.source, appointment.created_at, appointment.updated_at
        ]);
      } catch (error) {
        console.log(`Appointment ${appointment.id} already exists or migration failed`);
      }
    }

    // Migrate Encounters
    for (const encounter of encounters.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.encounters 
          (id, tenant_id, patient_id, provider_id, encounter_type, visit_date, chief_complaint, diagnosis, notes, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          encounter.id, tenantId, encounter.patient_id, encounter.provider_id, 
          encounter.encounter_type, encounter.visit_date, encounter.chief_complaint, 
          encounter.diagnosis, encounter.notes, encounter.status, 
          encounter.created_at, encounter.updated_at
        ]);
      } catch (error) {
        console.log(`Encounter ${encounter.id} already exists or migration failed`);
      }
    }

    // Migrate Inventory Items
    for (const item of inventoryItems.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.inventory_items 
          (id, tenant_id, item_code, name, category, current_stock, reorder_level, unit, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          item.id, tenantId, item.item_code, item.name, item.category, 
          item.current_stock, item.reorder_level, item.unit, 
          item.created_at, item.updated_at
        ]);
      } catch (error) {
        console.log(`Inventory item ${item.id} already exists or migration failed`);
      }
    }

    // Migrate Employees
    for (const employee of employees.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.employees 
          (id, tenant_id, name, designation, department, email, phone, salary, code, join_date, shift, supervisor_id, leave_balance, is_active, created_at, updated_at, bank_account)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          employee.id, tenantId, employee.name, employee.designation, employee.department, 
          employee.email, employee.phone, employee.salary, 'EMP' + getRandomInt(100, 999), 
          employee.join_date || new Date().toISOString().split('T')[0], 
          employee.shift || 'Day', employee.supervisor_id, 
          employee.leave_balance || 0, true, 
          employee.created_at, employee.updated_at, 
          'ACC' + getRandomInt(100, 999)
        ]);
      } catch (error) {
        console.log(`Employee ${employee.id} already exists or migration failed`);
      }
    }

    // Migrate Departments
    for (const dept of departments.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.departments 
          (id, tenant_id, name, code, hod_user_id, status, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          dept.id, tenantId, dept.name, dept.code, dept.hod_user_id, 
          dept.status, dept.created_by, dept.created_at, dept.updated_at
        ]);
      } catch (error) {
        console.log(`Department ${dept.id} already exists or migration failed`);
      }
    }

    // Migrate Wards and Beds
    const wardsResult = await query('SELECT * FROM emr.wards WHERE tenant_id = $1', [tenantId]);
    for (const ward of wardsResult.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.wards 
          (id, tenant_id, name, type, base_rate, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          ward.id, tenantId, ward.name, ward.type, ward.base_rate, ward.status
        ]);
        
        // Migrate beds for this ward
        const bedsResult = await query('SELECT * FROM emr.beds WHERE tenant_id = $1 AND ward_id = $2', [tenantId, ward.id]);
        for (const bed of bedsResult.rows) {
          try {
            await query(`
              INSERT INTO ${schemaName}.beds 
              (id, tenant_id, ward_id, bed_number, status, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [
              bed.id, tenantId, bed.ward_id, bed.bed_number, bed.status
            ]);
          } catch (error) {
            console.log(`Bed ${bed.id} already exists or migration failed`);
          }
        }
      } catch (error) {
        console.log(`Ward ${ward.id} already exists or migration failed`);
      }
    }

    // Migrate Invoices
    for (const invoice of invoices.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.invoices 
          (id, tenant_id, patient_id, invoice_number, total, status, due_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          invoice.id, tenantId, invoice.patient_id, 
          'INV-' + getRandomInt(10000, 99999), invoice.total, 
          invoice.status, invoice.due_date, invoice.created_at, invoice.updated_at
        ]);
      } catch (error) {
        console.log(`Invoice ${invoice.id} already exists or migration failed`);
      }
    }

    // Migrate Diagnostic Reports
    for (const report of diagnosticReports.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.diagnostic_reports 
          (id, tenant_id, patient_id, encounter_id, report_id, status, category, conclusion, issued_datetime, created_at, updated_at, created_by, fhir_diagnostic_report_ref)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11)
        `, [
          report.id, tenantId, report.patient_id, report.encounter_id, report.report_id, 
          report.status, report.category, report.conclusion, 
          report.issued_datetime, report.created_at, report.updated_at, 
          report.created_by, report.fhir_diagnostic_report_ref
        ]);
      } catch (error) {
        console.log(`Diagnostic report ${report.id} already exists or migration failed`);
      }
    }

    // Migrate Ambulances
    for (const ambulance of ambulances.rows) {
      try {
        await query(`
          INSERT INTO ${schemaName}.ambulances 
          (id, tenant_id, vehicle_number, status, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [
          ambulance.id, tenantId, ambulance.vehicle_number, ambulance.status
        ]);
      } catch (error) {
        console.log(`Ambulance ${ambulance.id} already exists or migration failed`);
      }
    }

    console.log(`Data migration completed for ${schemaName}`);
    
  } catch (error) {
    console.error(' Error migrating data to tenant schema:', error.message);
    throw error;
  }
}

async function createTenantSpecificMiddleware() {
  console.log('Creating tenant-specific middleware...');
  
  const middlewareCode = `
// Multi-Tenant Schema Resolution Middleware
const { query } = require('../server/db/connection.js');

const tenantSpecificMiddleware = async (req, res, next) => {
  try {
    // Extract tenant from JWT token or headers
    const tenantCode = req.headers['x-tenant-code'] || 
                       req.headers['x-tenant'] || 
                       req.query.tenant;
    
    if (!tenantCode) {
      return next();
    }

    // Get tenant info
    const tenantResult = await query(
      'SELECT id, schema_name FROM emr.tenants WHERE code = $1',
      [tenantCode]
    );

    if (tenantResult.rows.length === 0) {
      return next();
    }

    const tenant = tenantResult.rows[0];
    
    // Set tenant context for database queries
    req.tenantId = tenant.id;
    req.tenantCode = tenant.code;
    req.schemaName = tenant.schema_name || tenant.code.toLowerCase();
    
    // Modify database connection to use tenant-specific schema
    req.db = {
      query: (text, params) => query(text.replace(/emr\./g, req.schemaName + '.', text), params)
    };
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next(error);
  }
};

module.exports = tenantSpecificMiddleware;
`;

    // Write the middleware file
    const fs = require('fs');
    fs.writeFileSync('server/middleware/tenant-specific.middleware.js', middlewareCode);
    
    console.log('Created tenant-specific middleware file');
  } catch (error) {
    console.error('Error creating middleware file:', error);
  }
}

// Run the fix
fixMultiTenantArchitecture().then(result => {
  if (result && result.success) {
    console.log('\n Multi-tenant architecture fix completed successfully!');
    console.log('\n Next steps:');
    console.log('1. Update database connection to use tenant-specific schemas');
    console.log('2. Update API endpoints to use tenant-specific queries');
    console.log('3. Update frontend to handle tenant-specific routing');
    console.log('4. Test with separate tenant schemas');
    console.log('5. Update documentation to reflect new architecture');
    
    process.exit(0);
  } else {
    console.log('\n Multi-tenant architecture fix failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Critical error in multi-tenant architecture fix:', error);
  process.exit(1);
});
}
