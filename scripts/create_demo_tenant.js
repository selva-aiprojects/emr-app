import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

const demoTenant = {
  name: 'MedCare Demo Hospital',
  code: 'DEMO',
  subdomain: 'demo',
  subscriptionTier: 'Enterprise',
  theme: { primary: '#0f766e', accent: '#14b8a6' },
  users: [
    { name: 'Dr. Rajesh Kumar', email: 'rajesh@demo.hospital', role: 'Doctor' },
    { name: 'Dr. Priya Sharma', email: 'priya@demo.hospital', role: 'Doctor' },
    { name: 'Nurse Anita Desai', email: 'anita@demo.hospital', role: 'Nurse' },
    { name: 'Nurse Ravi Patel', email: 'ravi@demo.hospital', role: 'Nurse' },
    { name: 'Admin Vijay Kumar', email: 'vijay@demo.hospital', role: 'Admin' },
    { name: 'Pharmacist Meera Reddy', email: 'meera@demo.hospital', role: 'Pharmacist' },
    { name: 'Lab Technician Arun Singh', email: 'arun@demo.hospital', role: 'Lab' },
    { name: 'Billing Agent Sunita Devi', email: 'sunita@demo.hospital', role: 'Billing' },
    { name: 'HR Manager Deepak Kumar', email: 'deepak@demo.hospital', role: 'Admin' }
  ]
};

async function createDemoTenant() {
  console.log(' Creating MedCare Demo Hospital for customer demo...\n');

  try {
    console.log(` Creating tenant: ${demoTenant.name} (${demoTenant.subscriptionTier})`);

    // Insert tenant
    const tenantResult = await query(
      `INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, theme, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id`,
      [
        demoTenant.name,
        demoTenant.code,
        demoTenant.subdomain,
        demoTenant.subscriptionTier,
        JSON.stringify(demoTenant.theme)
      ]
    );

    const tenantId = tenantResult.rows[0].id;
    console.log(` Tenant created with ID: ${tenantId}`);

    // Create users for this tenant
    for (const userData of demoTenant.users) {
      const passwordHash = await hashPassword('Demo@123');

      const userResult = await query(
        `INSERT INTO emr.users (tenant_id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         RETURNING id`,
        [tenantId, userData.name, userData.email, passwordHash, userData.role]
      );

      console.log(`  Created user: ${userData.name} (${userData.email})`);
    }

    console.log(`\n ${demoTenant.name} users can login with password: Demo@123`);
    console.log(`\n Tenant Code for login: ${demoTenant.code}`);

    // Create departments
    const departments = [
      { name: 'General Medicine', code: 'GM' },
      { name: 'Cardiology', code: 'CARD' },
      { name: 'Pediatrics', code: 'PED' },
      { name: 'Orthopedics', code: 'ORTHO' },
      { name: 'Gynecology', code: 'GYNE' },
      { name: 'Emergency', code: 'ER' },
      { name: 'Radiology', code: 'RAD' },
      { name: 'Pathology', code: 'PATH' }
    ];

    for (const dept of departments) {
      await query(
        `INSERT INTO emr.departments (tenant_id, name, code, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW(), NOW())`,
        [tenantId, dept.name, dept.code]
      );
      console.log(`  Created department: ${dept.name}`);
    }

    // Create wards and beds
    const wards = [
      { name: 'General Ward - Male', type: 'General', bedCount: 20 },
      { name: 'General Ward - Female', type: 'General', bedCount: 20 },
      { name: 'Private Ward - A', type: 'Private', bedCount: 10 },
      { name: 'Private Ward - B', type: 'Private', bedCount: 10 },
      { name: 'ICU', type: 'ICU', bedCount: 8 },
      { name: 'Maternity Ward', type: 'Maternity', bedCount: 15 }
    ];

    for (const ward of wards) {
      const wardResult = await query(
        `INSERT INTO emr.wards (tenant_id, name, type, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [tenantId, ward.name, ward.type]
      );

      const wardId = wardResult.rows[0].id;

      // Create beds for each ward
      for (let i = 1; i <= ward.bedCount; i++) {
        await query(
          `INSERT INTO emr.beds (tenant_id, ward_id, bed_number, status, created_at, updated_at)
           VALUES ($1, $2, $3, 'Available', NOW(), NOW())`,
          [tenantId, wardId, `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`]
        );
      }
      console.log(`  Created ward: ${ward.name} with ${ward.bedCount} beds`);
    }

    console.log('\n Demo tenant setup completed successfully!');
    console.log('\n Login Credentials:');
    console.log(' Tenant Code: DEMO');
    console.log(' Password: Demo@123');
    console.log('\n Available Users:');
    demoTenant.users.forEach(user => {
      console.log(` ${user.role}: ${user.email}`);
    });

  } catch (error) {
    console.error(' Error creating demo tenant:', error);
    process.exit(1);
  }
}

// Run the script
createDemoTenant().then(() => {
  console.log('\n Demo tenant creation completed!');
  process.exit(0);
}).catch(error => {
  console.error(' Script failed:', error);
  process.exit(1);
});
