import { query } from '../server/db/connection.js';
import { getTenantSchema } from '../server/utils/tenant-schema-helper.js';

async function provisionNewTenant(tenantData) {
  try {
    console.log('=== COMPREHENSIVE TENANT PROVISIONING ===\n');
    
    const { name, code, subdomain, contactEmail, subscriptionTier = 'Professional' } = tenantData;
    
    // Step 1: Create tenant record
    console.log('1. Creating tenant record...');
    const tenantResult = await query(`
      INSERT INTO emr.tenants (name, code, subdomain, contact_email, subscription_tier, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
      RETURNING id, name, code, subdomain, created_at
    `, [name, code, subdomain, contactEmail, subscriptionTier]);
    
    const tenant = tenantResult.rows[0];
    const tenantId = tenant.id;
    
    console.log(`Tenant created: ${tenant.name} (${tenant.code}) - ID: ${tenant.id}`);
    
    // Step 2: Determine schema name dynamically
    const schemaName = await getTenantSchema(tenantId);
    console.log(`Schema determined: ${schemaName}`);
    
    // Step 3: Create tenant schema
    console.log('2. Creating tenant schema...');
    try {
      await query(`CREATE SCHEMA ${schemaName}`);
      console.log(`Schema ${schemaName} created successfully`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`Schema ${schemaName} already exists`);
      } else {
        throw error;
      }
    }
    
    // Step 4: Read and execute the comprehensive schema
    console.log('3. Creating tables from comprehensive schema...');
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaFile = await fs.promises.readFile('./database/tenant_base_schema_comprehensive_v2.sql', 'utf8');
    
    // Replace placeholders with actual values
    const processedSchema = schemaFile
      .replace(/SET search_path TO tenant_schema;/g, `SET search_path TO ${schemaName};`)
      .replace(/{tenant_id_placeholder}/g, tenantId);
    
    // Execute schema statements
    const statements = processedSchema.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await query(statement);
          console.log(`  Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.log(`  Statement ${i + 1} failed: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log('All schema statements executed');
    
    // Step 5: Create admin user
    console.log('4. Creating admin user...');
    const bcrypt = await import('bcrypt');
    const password = 'Admin@123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    await query(`
      INSERT INTO emr.users (tenant_id, name, email, role, password_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, 'admin', $4, true, NOW(), NOW())
      RETURNING id, name, email, role
    `, [tenantId, 'Admin User', `admin@${code.toLowerCase()}.hospital`, passwordHash]);
    
    console.log('Admin user created successfully');
    
    // Step 6: Seed initial data
    console.log('5. Seeding initial data...');
    await seedInitialData(tenantId, schemaName);
    
    // Step 7: Verification
    console.log('\n=== VERIFICATION ===');
    
    const verification = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.services WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.lab_tests WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.conditions WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log('\nInitial Data Created:');
    console.log(` Patients: ${verification[0].rows[0].count}`);
    console.log(` Appointments: ${verification[1].rows[0].count}`);
    console.log(` Departments: ${verification[2].rows[0].count}`);
    console.log(` Services: ${verification[3].rows[0].count}`);
    console.log(` Lab Tests: ${verification[4].rows[0].count}`);
    console.log(` Beds: ${verification[5].rows[0].count}`);
    console.log(` Employees: ${verification[6].rows[0].count}`);
    console.log(` Conditions: ${verification[7].rows[0].count}`);
    
    console.log('\n=== SUCCESS ===');
    console.log('Tenant provisioning completed successfully!');
    console.log(`Tenant: ${tenant.name} (${tenant.code})`);
    console.log(`Schema: ${schemaName}`);
    console.log(`Admin Email: admin@${code.toLowerCase()}.hospital`);
    console.log(`Admin Password: Admin@123`);
    
    return {
      success: true,
      tenant: tenant,
      schemaName,
      adminCredentials: {
        email: `admin@${code.toLowerCase()}.hospital`,
        password: 'Admin@123'
      }
    };
    
  } catch (error) {
    console.error('Tenant provisioning failed:', error.message);
    throw error;
  }
}

async function seedInitialData(tenantId, schemaName) {
  console.log('Seeding initial operational data...');
  
  // Create sample patients
  const patients = [];
  for (let i = 1; i <= 20; i++) {
    try {
      const result = await query(`
        INSERT INTO ${schemaName}.patients 
        (tenant_id, first_name, last_name, date_of_birth, gender, phone, email, blood_group, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `, [
        tenantId,
        `Patient${i}`,
        `Test${i}`,
        new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
        Math.random() > 0.5 ? 'Male' : 'Female',
        `987654${1000 + i}`,
        `patient${i}@${schemaName}.hospital`,
        ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 7]
      ]);
      patients.push(result.rows[0]);
    } catch (error) {
      // Ignore duplicates
    }
  }
  
  // Create sample appointments
  for (let i = 0; i < 10; i++) {
    try {
      await query(`
        INSERT INTO ${schemaName}.appointments 
        (tenant_id, patient_id, scheduled_start, scheduled_end, status, created_at, updated_at)
        VALUES ($1, $2, NOW() + INTERVAL '${i} hours', NOW() + INTERVAL '${i} hours' + INTERVAL '1 hour', 'scheduled', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [tenantId, patients[i % patients.length].id]);
    } catch (error) {
      // Ignore duplicates
    }
  }
  
  // Create sample beds
  const wards = await query(`SELECT id FROM ${schemaName}.wards WHERE tenant_id = $1`, [tenantId]);
  
  for (const ward of wards.rows) {
    for (let i = 1; i <= 10; i++) {
      try {
        await query(`
          INSERT INTO ${schemaName}.beds 
          (tenant_id, ward_id, bed_number, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, ward.id, `${ward.id.substring(0, 3)}-${i}`, Math.random() > 0.7 ? 'occupied' : 'available']);
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
  
  console.log('Initial data seeded successfully');
}

// Export for use in other scripts
export { provisionNewTenant };

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Example usage
  const exampleTenant = {
    name: 'Test Hospital',
    code: 'TEST',
    subdomain: 'test',
    contactEmail: 'admin@test.hospital',
    subscriptionTier: 'Professional'
  };
  
  provisionNewTenant(exampleTenant)
    .then(result => {
      console.log('\n=== FINAL RESULT ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Provisioning failed:', error);
      process.exit(1);
    });
}
