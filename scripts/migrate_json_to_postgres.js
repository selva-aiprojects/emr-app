/**
 * Migration Script: JSON to PostgreSQL
 * 
 * This script migrates data from the old JSON file storage
 * to the new PostgreSQL database with proper password hashing
 * 
 * Usage: node scripts/migrate_json_to_postgres.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Path to JSON database file
const JSON_DB_PATH = path.resolve(__dirname, '../server/data/db.json');

// Migration statistics
const stats = {
  tenants: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  users: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  patients: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  clinicalRecords: { total: 0, migrated: 0, errors: 0 },
  walkins: { total: 0, migrated: 0, errors: 0 },
  appointments: { total: 0, migrated: 0, errors: 0 },
  encounters: { total: 0, migrated: 0, errors: 0 },
  invoices: { total: 0, migrated: 0, errors: 0 },
  inventory: { total: 0, migrated: 0, errors: 0 },
  employees: { total: 0, migrated: 0, errors: 0 },
  employeeLeaves: { total: 0, migrated: 0, errors: 0 },
};

/**
 * Read JSON database
 */
function readJsonDb() {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading JSON database:', error.message);
    console.error('   Make sure the file exists at:', JSON_DB_PATH);
    process.exit(1);
  }
}

/**
 * Migrate tenants
 */
async function migrateTenants(tenants) {
  console.log('\n📦 Migrating Tenants...');
  stats.tenants.total = tenants.length;
  
  for (const tenant of tenants) {
    try {
      // Check if tenant already exists
      const existing = await query('SELECT id FROM emr.tenants WHERE code = $1', [tenant.code]);
      
      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Skipping tenant: ${tenant.name} (already exists)`);
        stats.tenants.skipped++;
        continue;
      }
      
      await query(
        `INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tenant.id,
          tenant.name,
          tenant.code,
          tenant.subdomain,
          JSON.stringify(tenant.theme || {}),
          JSON.stringify(tenant.features || {}),
          tenant.status || 'active',
        ]
      );
      
      console.log(`   ✅ Migrated tenant: ${tenant.name}`);
      stats.tenants.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating tenant ${tenant.name}:`, error.message);
      stats.tenants.errors++;
    }
  }
}

/**
 * Migrate users (with password hashing)
 */
async function migrateUsers(users) {
  console.log('\n👥 Migrating Users (hashing passwords)...');
  stats.users.total = users.length;
  
  for (const user of users) {
    try {
      // Check if user already exists
      const tenantClause = user.tenantId ? 'tenant_id = $2' : 'tenant_id IS NULL';
      const params = user.tenantId ? [user.email.toLowerCase(), user.tenantId] : [user.email.toLowerCase()];
      
      const existing = await query(
        `SELECT id FROM emr.users WHERE LOWER(email) = $1 AND ${tenantClause}`,
        params
      );
      
      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Skipping user: ${user.email} (already exists)`);
        stats.users.skipped++;
        continue;
      }
      
      // Generate default password and hash it
      const defaultPassword = `${user.name.split(' ')[0]}@123`;
      const passwordHash = await hashPassword(defaultPassword);
      
      await query(
        `INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, patient_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          user.tenantId || null,
          user.email,
          passwordHash,
          user.name,
          user.role,
          user.patientId || null,
          user.isActive !== false,
        ]
      );
      
      console.log(`   ✅ Migrated user: ${user.email} (password: ${defaultPassword})`);
      stats.users.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating user ${user.email}:`, error.message);
      stats.users.errors++;
    }
  }
}

/**
 * Migrate patients
 */
async function migratePatients(patients) {
  console.log('\n🏥 Migrating Patients...');
  stats.patients.total = patients.length;
  
  for (const patient of patients) {
    try {
      // Check if patient already exists
      const existing = await query(
        'SELECT id FROM emr.patients WHERE tenant_id = $1 AND mrn = $2',
        [patient.tenantId, patient.mrn]
      );
      
      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Skipping patient: ${patient.mrn} (already exists)`);
        stats.patients.skipped++;
        continue;
      }
      
      await query(
        `INSERT INTO emr.patients (
          id, tenant_id, mrn, first_name, last_name, date_of_birth, gender,
          phone, email, address, blood_group, emergency_contact, insurance, medical_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          patient.id,
          patient.tenantId,
          patient.mrn,
          patient.firstName,
          patient.lastName,
          patient.dob || null,
          patient.gender || null,
          patient.phone || null,
          patient.email || null,
          patient.address || null,
          patient.bloodGroup || null,
          patient.emergencyContact || null,
          patient.insurance || null,
          JSON.stringify(patient.medicalHistory || {}),
        ]
      );
      
      console.log(`   ✅ Migrated patient: ${patient.mrn}`);
      stats.patients.migrated++;
      
      // Migrate clinical records
      const sections = ['caseHistory', 'medications', 'prescriptions', 'recommendations', 'feedbacks', 'testReports'];
      
      for (const section of sections) {
        const records = patient[section] || [];
        for (const record of records) {
          try {
            await query(
              `INSERT INTO emr.clinical_records (tenant_id, patient_id, section, content)
               VALUES ($1, $2, $3, $4)`,
              [patient.tenantId, patient.id, section, JSON.stringify(record)]
            );
            stats.clinicalRecords.migrated++;
          } catch (error) {
            console.error(`     ❌ Error migrating clinical record:`, error.message);
            stats.clinicalRecords.errors++;
          }
        }
        stats.clinicalRecords.total += records.length;
      }
      
    } catch (error) {
      console.error(`   ❌ Error migrating patient ${patient.mrn}:`, error.message);
      stats.patients.errors++;
    }
  }
}

/**
 * Migrate walk-ins
 */
async function migrateWalkins(walkins) {
  console.log('\n🚶 Migrating Walk-ins...');
  stats.walkins.total = walkins.length;
  
  for (const walkin of walkins) {
    try {
      await query(
        `INSERT INTO emr.walkins (id, tenant_id, name, phone, reason, status, patient_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          walkin.id,
          walkin.tenantId,
          walkin.name,
          walkin.phone,
          walkin.reason || null,
          walkin.status || 'waiting',
          walkin.patientId || null,
          walkin.createdAt || new Date().toISOString(),
        ]
      );
      
      stats.walkins.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating walk-in:`, error.message);
      stats.walkins.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.walkins.migrated} walk-ins`);
}

/**
 * Migrate appointments
 */
async function migrateAppointments(appointments) {
  console.log('\n📅 Migrating Appointments...');
  stats.appointments.total = appointments.length;
  
  for (const appointment of appointments) {
    try {
      await query(
        `INSERT INTO emr.appointments (
          id, tenant_id, patient_id, provider_id, scheduled_start, scheduled_end,
          status, reason, source, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          appointment.id,
          appointment.tenantId,
          appointment.patientId,
          appointment.providerId,
          appointment.start,
          appointment.end,
          appointment.status || 'scheduled',
          appointment.reason || null,
          appointment.source || 'staff',
          new Date().toISOString(),
        ]
      );
      
      stats.appointments.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating appointment:`, error.message);
      stats.appointments.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.appointments.migrated} appointments`);
}

/**
 * Migrate encounters
 */
async function migrateEncounters(encounters) {
  console.log('\n📋 Migrating Encounters...');
  stats.encounters.total = encounters.length;
  
  for (const encounter of encounters) {
    try {
      await query(
        `INSERT INTO emr.encounters (
          id, tenant_id, patient_id, provider_id, encounter_type,
          visit_date, chief_complaint, diagnosis, notes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          encounter.id,
          encounter.tenantId,
          encounter.patientId,
          encounter.providerId,
          encounter.type || 'OPD',
          encounter.visitDate || new Date().toISOString().split('T')[0],
          encounter.complaint || null,
          encounter.diagnosis || null,
          encounter.notes || null,
          encounter.status || 'open',
        ]
      );
      
      stats.encounters.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating encounter:`, error.message);
      stats.encounters.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.encounters.migrated} encounters`);
}

/**
 * Migrate invoices
 */
async function migrateInvoices(invoices) {
  console.log('\n💰 Migrating Invoices...');
  stats.invoices.total = invoices.length;
  
  for (const invoice of invoices) {
    try {
      await query(
        `INSERT INTO emr.invoices (
          id, tenant_id, patient_id, invoice_number, description,
          subtotal, tax, total, paid, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          invoice.id,
          invoice.tenantId,
          invoice.patientId,
          invoice.number,
          invoice.description || null,
          invoice.subtotal || invoice.total || 0,
          invoice.tax || 0,
          invoice.total || 0,
          invoice.paid || 0,
          invoice.status || 'issued',
          invoice.createdAt || new Date().toISOString(),
        ]
      );
      
      stats.invoices.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating invoice:`, error.message);
      stats.invoices.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.invoices.migrated} invoices`);
}

/**
 * Migrate inventory
 */
async function migrateInventory(inventory) {
  console.log('\n📦 Migrating Inventory...');
  stats.inventory.total = inventory.length;
  
  for (const item of inventory) {
    try {
      await query(
        `INSERT INTO emr.inventory_items (
          id, tenant_id, item_code, name, category,
          current_stock, reorder_level, unit
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.id,
          item.tenantId,
          item.code,
          item.name,
          item.category || null,
          item.stock || 0,
          item.reorder || 0,
          item.unit || null,
        ]
      );
      
      stats.inventory.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating inventory item:`, error.message);
      stats.inventory.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.inventory.migrated} inventory items`);
}

/**
 * Migrate employees
 */
async function migrateEmployees(employees) {
  console.log('\n👔 Migrating Employees...');
  stats.employees.total = employees.length;
  
  for (const employee of employees) {
    try {
      await query(
        `INSERT INTO emr.employees (
          id, tenant_id, code, name, department, designation,
          join_date, shift, salary, leave_balance
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          employee.id,
          employee.tenantId,
          employee.code,
          employee.name,
          employee.department || null,
          employee.designation || null,
          employee.joinDate || null,
          employee.shift || null,
          employee.salary || 0,
          employee.leaveBalance || 12,
        ]
      );
      
      stats.employees.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating employee:`, error.message);
      stats.employees.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.employees.migrated} employees`);
}

/**
 * Migrate employee leaves
 */
async function migrateEmployeeLeaves(leaves) {
  console.log('\n🏖️  Migrating Employee Leaves...');
  stats.employeeLeaves.total = leaves.length;
  
  for (const leave of leaves) {
    try {
      // Calculate days if not present
      const fromDate = new Date(leave.from);
      const toDate = new Date(leave.to);
      const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
      
      await query(
        `INSERT INTO emr.employee_leaves (
          id, tenant_id, employee_id, leave_type, from_date, to_date,
          days, reason, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          leave.id,
          leave.tenantId,
          leave.employeeId,
          leave.type || 'Casual',
          leave.from,
          leave.to,
          days,
          leave.reason || null,
          leave.status || 'Pending',
        ]
      );
      
      stats.employeeLeaves.migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating employee leave:`, error.message);
      stats.employeeLeaves.errors++;
    }
  }
  
  console.log(`   ✅ Migrated ${stats.employeeLeaves.migrated} employee leaves`);
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  for (const [entity, stat] of Object.entries(stats)) {
    if (stat.total > 0) {
      console.log(`\n${entity}:`);
      console.log(`   Total: ${stat.total}`);
      console.log(`   ✅ Migrated: ${stat.migrated}`);
      if (stat.skipped > 0) console.log(`   ⏭️  Skipped: ${stat.skipped}`);
      if (stat.errors > 0) console.log(`   ❌ Errors: ${stat.errors}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Migration completed!');
  console.log('='.repeat(60));
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...\n');
  
  // Read JSON database
  const db = readJsonDb();
  console.log('✅ JSON database loaded successfully\n');
  
  try {
    // Migrate in order of dependencies
    await migrateTenants(db.tenants || []);
    await migrateUsers(db.users || []);
    await migratePatients(db.patients || []);
    await migrateWalkins(db.walkins || []);
    await migrateAppointments(db.appointments || []);
    await migrateEncounters(db.encounters || []);
    await migrateInvoices(db.invoices || []);
    await migrateInventory(db.inventory || []);
    await migrateEmployees(db.employees || []);
    await migrateEmployeeLeaves(db.employeeLeaves || []);
    
    printSummary();
    
    console.log('\n💡 IMPORTANT NOTES:');
    console.log('   - All users have been assigned default passwords: {FirstName}@123');
    console.log('   - Users should change their passwords after first login');
    console.log('   - Superadmin credentials are in database/init_db.sql');
    console.log('   - Review the summary above for any errors\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run migration
migrate();
