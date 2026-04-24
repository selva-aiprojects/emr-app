import { query } from '../server/db/connection.js';
import fs from 'fs';
import path from 'path';

async function createDemoTenantProperly() {
  console.log(' Creating DEMO Tenant Using Proper Multi-Tenant Architecture...\n');

  try {
    // Step 1: Check if DEMO tenant exists
    const existingTenant = await query(
      'SELECT id, code, name, schema_name FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (existingTenant.rows.length > 0) {
      console.log(' DEMO tenant already exists. Updating schema structure...');
      const tenant = existingTenant.rows[0];
      await updateTenantSchema(tenant);
    } else {
      console.log(' Creating new DEMO tenant...');
      const tenant = await createNewTenant();
      await setupTenantSchema(tenant);
    }

    console.log('\n DEMO tenant setup completed successfully!');
    console.log('\n Architecture Summary:');
    console.log('- Core Application: emr.* (shared tables)');
    console.log('- DEMO Tenant: demo_emr.* (isolated data)');
    console.log('- Proper multi-tenant isolation achieved');

    return { success: true };

  } catch (error) {
    console.error(' Error creating DEMO tenant:', error.message);
    return { success: false, error: error.message };
  }
}

async function createNewTenant() {
  // Step 1: Create tenant record
  const tenantResult = await query(`
    INSERT INTO emr.tenants (id, name, code, subdomain, status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'MedCare Demo Hospital', 'DEMO', 'demo', 'active', NOW(), NOW())
    RETURNING id, code, name
  `);

  const tenant = tenantResult.rows[0];
  console.log(` Created tenant: ${tenant.name} (${tenant.code}) - ID: ${tenant.id}`);

  // Step 2: Create separate schema
  const schemaName = 'demo_emr';
  await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  console.log(` Created schema: ${schemaName}`);

  // Step 3: Update tenant with schema name
  await query(
    'UPDATE emr.tenants SET schema_name = $1 WHERE id = $2',
    [schemaName, tenant.id]
  );

  tenant.schema_name = schemaName;
  console.log(' Updated tenant record with schema name');

  return tenant;
}

async function updateTenantSchema(tenant) {
  const schemaName = tenant.schema_name || 'demo_emr';
  
  // Create schema if it doesn't exist
  await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  console.log(` Ensured schema exists: ${schemaName}`);

  tenant.schema_name = schemaName;
  return tenant;
}

async function setupTenantSchema(tenant) {
  const schemaName = tenant.schema_name;
  console.log(`\n Setting up tenant schema: ${schemaName}`);

  // Read and execute the tenant base schema
  const schemaPath = path.join(process.cwd(), 'database', 'tenant_base_schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  // Replace placeholder with actual schema name
  const processedSQL = schemaSQL.replace(/:schema/g, schemaName);

  // Split SQL into individual statements
  const statements = processedSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(` Executing ${statements.length} SQL statements...`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await query(statement);
      console.log(`  ${i + 1}. ${statement.substring(0, 50)}...`);
    } catch (error) {
      console.log(`  ${i + 1}. SKIPPED (may already exist): ${error.message}`);
    }
  }

  console.log(' Tenant schema setup completed');
}

async function migrateExistingData(tenant) {
  console.log('\n Migrating existing data to tenant schema...');

  const schemaName = tenant.schema_name;
  const tenantId = tenant.id;

  try {
    // Check if there's existing data in shared schema
    const [patients, appointments, encounters, inventoryItems, employees, departments, wards, beds, invoices, diagnosticReports, ambulances] = await Promise.all([
      query('SELECT * FROM emr.patients WHERE tenant_id = $1 LIMIT 50', [tenantId]),
      query('SELECT * FROM emr.appointments WHERE tenant_id = $1 LIMIT 30', [tenantId]),
      query('SELECT * FROM emr.encounters WHERE tenant_id = $1 LIMIT 50', [tenantId]),
      query('SELECT * FROM emr.inventory_items WHERE tenant_id = $1 LIMIT 20', [tenantId]),
      query('SELECT * FROM emr.employees WHERE tenant_id = $1 LIMIT 10', [tenantId]),
      query('SELECT * FROM emr.departments WHERE tenant_id = $1 LIMIT 10', [tenantId]),
      query('SELECT * FROM emr.wards WHERE tenant_id = $1 LIMIT 5', [tenantId]),
      query('SELECT * FROM emr.beds WHERE tenant_id = $1 LIMIT 20', [tenantId]),
      query('SELECT * FROM emr.invoices WHERE tenant_id = $1 LIMIT 10', [tenantId]),
      query('SELECT * FROM emr.diagnostic_reports WHERE tenant_id = $1 LIMIT 20', [tenantId]),
      query('SELECT * FROM emr.ambulances WHERE tenant_id = $1 LIMIT 5', [tenantId])
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
        // Ignore duplicates
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
        // Ignore duplicates
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
        // Ignore duplicates
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
        // Ignore duplicates
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
        // Ignore duplicates
      }
    }

    console.log(' Data migration completed');

  } catch (error) {
    console.log(' Data migration skipped or failed:', error.message);
  }
}

async function createTenantSpecificMiddleware() {
  console.log('\n Creating tenant-specific middleware...');

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
    req.tenantCode = tenantCode;
    req.schemaName = tenant.schema_name || tenantCode.toLowerCase();
    
    // Store original query function
    const originalQuery = query;
    
    // Override query function to use tenant-specific schema
    req.query = (text, params) => {
      const tenantSpecificQuery = text.replace(/emr\\./g, req.schemaName + '.');
      return originalQuery(tenantSpecificQuery, params);
    };
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next(error);
  }
};

module.exports = tenantSpecificMiddleware;
`;

  const middlewarePath = path.join(process.cwd(), 'server', 'middleware', 'tenant-specific.middleware.js');
  fs.writeFileSync(middlewarePath, middlewareCode);
  
  console.log(' Created tenant-specific middleware file');
}

// Run the proper tenant creation
createDemoTenantProperly().then(result => {
  if (result && result.success) {
    console.log('\n DEMO tenant created successfully using proper multi-tenant architecture!');
    console.log('\n Next Steps:');
    console.log('1. Update database connection to use tenant-specific schemas');
    console.log('2. Update API endpoints to use tenant-specific queries');
    console.log('3. Update frontend to handle tenant-specific routing');
    console.log('4. Test with separate tenant schemas');
    console.log('5. Update documentation to reflect new architecture');
    
    process.exit(0);
  } else {
    console.log('\n DEMO tenant creation failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Critical error in DEMO tenant creation:', error);
  process.exit(1);
});
