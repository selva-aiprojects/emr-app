import { query } from '../server/db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function provisionNewTenant(tenantData) {
  const {
    code,
    name,
    email,
    adminPassword,
    features = {},
    theme = {},
    billingConfig = {}
  } = tenantData;

  console.log(`\n=== PROVISIONING NEW TENANT: ${code} ===\n`);

  try {
    // Step 1: Create tenant record
    console.log('1. Creating tenant record...');
    const tenantResult = await query(`
      INSERT INTO emr.tenants (code, name, email, features, theme, billing_config, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
      RETURNING *
    `, [code, name, email, JSON.stringify(features), JSON.stringify(theme), JSON.stringify(billingConfig)]);

    const tenant = tenantResult.rows[0];
    console.log(`   Created tenant: ${tenant.name} (ID: ${tenant.id})`);

    // Step 2: Create tenant-specific schema
    const schemaName = `${code.toLowerCase()}_emr`;
    console.log(`2. Creating schema: ${schemaName}`);
    
    await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await query(`GRANT ALL ON SCHEMA ${schemaName} TO emr_admin`);
    await query(`GRANT USAGE ON SCHEMA ${schemaName} TO emr_admin`);
    
    // Update tenant with schema name
    await query(`UPDATE emr.tenants SET schema_name = $1 WHERE id = $2`, [schemaName, tenant.id]);
    console.log(`   Schema created and permissions granted`);

    // Step 3: Load and execute comprehensive schema
    console.log('3. Creating comprehensive table structure...');
    const schemaPath = path.join(__dirname, '../database/tenant_base_schema_comprehensive_v2.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace placeholder with actual tenant ID
    const processedSQL = schemaSQL.replace(/{tenant_id_placeholder}/g, tenant.id);
    
    // Set search path to tenant schema
    await query(`SET search_path TO ${schemaName}`);
    
    // Execute schema creation in batches to handle large SQL
    const statements = processedSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0 && !statement.startsWith('--')) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore certain expected errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('does not exist') &&
              !error.message.includes('duplicate key')) {
            console.warn(`   Warning in statement ${i + 1}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`   Created ${statements.length} SQL statements`);

    // Step 4: Create admin user
    console.log('4. Creating admin user...');
    const { hashPassword } = await import('../server/services/auth.service.js');
    const hashedPassword = await hashPassword(adminPassword);
    
    const userResult = await query(`
      INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, email, name, role
    `, [tenant.id, email, hashedPassword, `${name} Admin`, 'Admin']);

    const adminUser = userResult.rows[0];
    console.log(`   Created admin user: ${adminUser.email}`);

    // Step 5: Seed initial data
    console.log('5. Seeding initial data...');
    await seedInitialData(tenant.id, schemaName);
    
    // Step 6: Reset search path
    await query(`SET search_path TO emr, public`);
    
    console.log('\n=== TENANT PROVISIONING COMPLETED ===');
    console.log(`Tenant Code: ${code}`);
    console.log(`Tenant Name: ${name}`);
    console.log(`Schema: ${schemaName}`);
    console.log(`Admin Email: ${email}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`User ID: ${adminUser.id}`);
    
    return {
      success: true,
      tenant,
      adminUser,
      schemaName,
      loginCredentials: {
        email,
        password: adminPassword
      }
    };

  } catch (error) {
    console.error('Tenant provisioning failed:', error.message);
    throw error;
  }
}

async function seedInitialData(tenantId, schemaName) {
  console.log('   Seeding departments...');
  
  // Set search path to tenant schema
  await query(`SET search_path TO ${schemaName}`);
  
  // Insert departments
  const departments = [
    { name: 'General Medicine', code: 'GM', type: 'Clinical' },
    { name: 'Emergency', code: 'ER', type: 'Clinical' },
    { name: 'Intensive Care', code: 'ICU', type: 'Clinical' },
    { name: 'Pediatrics', code: 'PED', type: 'Clinical' },
    { name: 'Obstetrics & Gynecology', code: 'OBG', type: 'Clinical' },
    { name: 'Laboratory', code: 'LAB', type: 'Diagnostic' },
    { name: 'Radiology', code: 'RAD', type: 'Diagnostic' },
    { name: 'Pharmacy', code: 'PHM', type: 'Support' },
    { name: 'Administration', code: 'ADM', type: 'Administrative' }
  ];

  for (const dept of departments) {
    await query(`
      INSERT INTO departments (tenant_id, name, code, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (tenant_id, code) DO NOTHING
    `, [tenantId, dept.name, dept.code, dept.type]);
  }

  // Insert services
  console.log('   Seeding services...');
  const services = [
    { name: 'General Consultation', category: 'Consultation', price: 500.00, duration: 30 },
    { name: 'Specialist Consultation', category: 'Consultation', price: 800.00, duration: 45 },
    { name: 'Emergency Consultation', category: 'Emergency', price: 1000.00, duration: 60 },
    { name: 'Complete Blood Count', category: 'Laboratory', price: 350.00, duration: 0 },
    { name: 'Liver Function Test', category: 'Laboratory', price: 850.00, duration: 0 },
    { name: 'Kidney Function Test', category: 'Laboratory', price: 750.00, duration: 0 },
    { name: 'X-Ray Chest', category: 'Radiology', price: 300.00, duration: 0 },
    { name: 'Ultrasound Abdomen', category: 'Radiology', price: 1200.00, duration: 0 },
    { name: 'ECG', category: 'Cardiology', price: 250.00, duration: 0 },
    { name: 'Vaccination', category: 'Preventive', price: 200.00, duration: 15 }
  ];

  for (const service of services) {
    await query(`
      INSERT INTO services (tenant_id, name, category, price, duration_minutes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [tenantId, service.name, service.category, service.price, service.duration]);
  }

  // Insert lab tests
  console.log('   Seeding lab tests...');
  const labTests = [
    { name: 'Complete Blood Count', category: 'Hematology', price: 350, normalRange: 'RBC: 4.5-5.5, WBC: 4000-11000' },
    { name: 'Liver Function Test', category: 'Biochemistry', price: 850, normalRange: 'SGOT: 0-40, SGPT: 0-40' },
    { name: 'Kidney Function Test', category: 'Biochemistry', price: 750, normalRange: 'Creatinine: 0.6-1.2, BUN: 7-20' },
    { name: 'Blood Sugar Fasting', category: 'Biochemistry', price: 150, normalRange: '70-100 mg/dL' },
    { name: 'Blood Sugar PP', category: 'Biochemistry', price: 180, normalRange: '<140 mg/dL' },
    { name: 'Lipid Profile', category: 'Biochemistry', price: 650, normalRange: 'Total <200, LDL <100' },
    { name: 'Thyroid Function Test', category: 'Biochemistry', price: 1200, normalRange: 'TSH: 0.4-4.0' },
    { name: 'Vitamin D Test', category: 'Biochemistry', price: 950, normalRange: '30-100 ng/mL' },
    { name: 'COVID-19 RT-PCR', category: 'Pathology', price: 800, normalRange: 'Not Detected' },
    { name: 'Urine Routine', category: 'Pathology', price: 200, normalRange: 'Normal parameters' }
  ];

  for (const test of labTests) {
    await query(`
      INSERT INTO lab_tests (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (tenant_id, test_name) DO UPDATE SET updated_at = NOW()
    `, [tenantId, test.name, test.category, test.normalRange, test.price]);
  }

  // Create wards and beds
  console.log('   Creating wards and beds...');
  const wardTypes = [
    { name: 'ICU', type: 'ICU', capacity: 10, floor: 2, baseRate: 2000 },
    { name: 'General Ward - Male', type: 'General', capacity: 30, floor: 1, baseRate: 800 },
    { name: 'General Ward - Female', type: 'General', capacity: 30, floor: 1, baseRate: 800 },
    { name: 'Private Ward - A', type: 'Private', capacity: 15, floor: 3, baseRate: 1500 },
    { name: 'Private Ward - B', type: 'Private', capacity: 15, floor: 3, baseRate: 1500 },
    { name: 'Maternity Ward', type: 'Maternity', capacity: 20, floor: 2, baseRate: 1200 },
    { name: 'Pediatric Ward', type: 'Pediatric', capacity: 25, floor: 2, baseRate: 1000 },
    { name: 'Emergency Ward', type: 'Emergency', capacity: 15, floor: 1, baseRate: 1000 }
  ];

  for (const wardType of wardTypes) {
    // Create ward
    const wardResult = await query(`
      INSERT INTO wards (tenant_id, name, type, capacity, floor, base_rate, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
      RETURNING id
    `, [tenantId, wardType.name, wardType.type, wardType.capacity, wardType.floor, wardType.baseRate]);

    const wardId = wardResult.rows[0].id;

    // Create beds for this ward
    for (let i = 1; i <= wardType.capacity; i++) {
      const bedNumber = `${wardType.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
      
      await query(`
        INSERT INTO beds (tenant_id, ward_id, bed_number, type, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'available', NOW(), NOW())
        ON CONFLICT (tenant_id, bed_number) DO UPDATE SET updated_at = NOW()
      `, [tenantId, wardId, bedNumber, wardType.type]);
    }
  }

  // Create sample employees
  console.log('   Creating sample employees...');
  const sampleEmployees = [
    { code: 'DOC001', name: 'Dr. Rajesh Kumar', designation: 'Senior Doctor', department: 'General Medicine', salary: 120000 },
    { code: 'DOC002', name: 'Dr. Priya Sharma', designation: 'Senior Doctor', department: 'Emergency', salary: 130000 },
    { code: 'NUR001', name: 'Sarah Johnson', designation: 'Head Nurse', department: 'ICU', salary: 45000 },
    { code: 'NUR002', name: 'Emily Davis', designation: 'Staff Nurse', department: 'General Ward', salary: 35000 },
    { code: 'PHM001', name: 'Michael Chen', designation: 'Pharmacist', department: 'Pharmacy', salary: 40000 },
    { code: 'LAB001', name: 'Lisa Anderson', designation: 'Lab Technician', department: 'Laboratory', salary: 38000 },
    { code: 'RAD001', name: 'James Wilson', designation: 'Radiologist', department: 'Radiology', salary: 110000 },
    { code: 'ADM001', name: 'Robert Taylor', designation: 'Administrator', department: 'Administration', salary: 60000 }
  ];

  for (const emp of sampleEmployees) {
    await query(`
      INSERT INTO employees (tenant_id, code, name, designation, department, salary, join_date, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      ON CONFLICT (tenant_id, code) DO UPDATE SET updated_at = NOW()
    `, [tenantId, emp.code, emp.name, emp.designation, emp.department, emp.salary, new Date().toISOString().split('T')[0]]);
  }

  // Create sample inventory items
  console.log('   Creating sample inventory items...');
  const inventoryItems = [
    { itemCode: 'MED001', name: 'Paracetamol 500mg', category: 'Medicine', stock: 500, reorderLevel: 100, unitPrice: 5.50 },
    { itemCode: 'MED002', name: 'Ibuprofen 400mg', category: 'Medicine', stock: 300, reorderLevel: 80, unitPrice: 8.25 },
    { itemCode: 'MED003', name: 'Amoxicillin 500mg', category: 'Medicine', stock: 200, reorderLevel: 50, unitPrice: 12.00 },
    { itemCode: 'SUP001', name: 'Surgical Gloves', category: 'Supply', stock: 1000, reorderLevel: 200, unitPrice: 2.50 },
    { itemCode: 'SUP002', name: 'Surgical Masks', category: 'Supply', stock: 500, reorderLevel: 100, unitPrice: 1.75 },
    { itemCode: 'EQP001', name: 'Blood Pressure Monitor', category: 'Equipment', stock: 10, reorderLevel: 2, unitPrice: 2500.00 },
    { itemCode: 'EQP002', name: 'Thermometer Digital', category: 'Equipment', stock: 20, reorderLevel: 5, unitPrice: 150.00 }
  ];

  for (const item of inventoryItems) {
    await query(`
      INSERT INTO inventory_items (tenant_id, item_code, name, category, current_stock, reorder_level, unit_price, unit, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (tenant_id, item_code) DO UPDATE SET updated_at = NOW()
    `, [tenantId, item.itemCode, item.name, item.category, item.stock, item.reorderLevel, item.unitPrice, 
        item.category === 'Medicine' ? 'Tablet' : item.category === 'Supply' ? 'Box' : 'Unit']);
  }

  // Create sample ambulances
  console.log('   Creating sample ambulances...');
  for (let i = 1; i <= 3; i++) {
    await query(`
      INSERT INTO ambulances (tenant_id, vehicle_number, type, status, driver_name, driver_phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (tenant_id, vehicle_number) DO UPDATE SET updated_at = NOW()
    `, [tenantId, `AMB-${String(i).padStart(3, '0')}`, i === 1 ? 'Advanced' : 'Basic', 'available', 
        `Driver ${i}`, `+91${9876543210 + i}`]);
  }

  // Create sample blood units
  console.log('   Creating sample blood units...');
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  
  for (let i = 0; i < 20; i++) {
    const collectionDate = new Date();
    collectionDate.setDate(collectionDate.getDate() - Math.floor(Math.random() * 30));
    const expiryDate = new Date(collectionDate);
    expiryDate.setDate(expiryDate.getDate() + 35);
    
    await query(`
      INSERT INTO blood_units (tenant_id, blood_group, collection_date, expiry_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [tenantId, bloodGroups[i % 8], collectionDate.toISOString().split('T')[0], 
        expiryDate.toISOString().split('T')[0], 'available']);
  }

  console.log('   Initial data seeding completed');
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.log('Usage: node provision_new_tenant.js <code> <name> <email> <password> [features_json] [theme_json]');
    console.log('Example: node provision_new_tenant.js HOSPITAL "City Hospital" admin@hospital.com password123');
    process.exit(1);
  }

  const [code, name, email, password, featuresJson, themeJson] = args;
  
  const tenantData = {
    code,
    name,
    email,
    adminPassword: password,
    features: featuresJson ? JSON.parse(featuresJson) : {},
    theme: themeJson ? JSON.parse(themeJson) : {}
  };

  provisionNewTenant(tenantData)
    .then(result => {
      if (result.success) {
        console.log('\n=== PROVISIONING SUCCESSFUL ===');
        console.log('Login Credentials:');
        console.log(`URL: http://localhost:5175`);
        console.log(`Email: ${result.loginCredentials.email}`);
        console.log(`Password: ${result.loginCredentials.password}`);
        console.log('\nTenant is ready for use!');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Provisioning failed:', error.message);
      process.exit(1);
    });
}

export { provisionNewTenant };
