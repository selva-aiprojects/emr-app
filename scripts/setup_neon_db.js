/**
 * Neon Database Setup Script
 * 
 * This script will:
 * 1. Test connection to your existing Neon database
 * 2. Check if EMR schema exists
 * 3. Optionally create the EMR schema and tables
 * 
 * Usage: node scripts/setup_neon_db.js
 */

import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to Neon database!');

    // Get database info
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log(`   Database: ${dbInfo.rows[0].current_database}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}`);
    console.log(`   PostgreSQL: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    return client;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

async function checkSchemaExists(client) {
  console.log('🔍 Checking if EMR schema exists...\n');

  const result = await client.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'emr'"
  );

  if (result.rows.length > 0) {
    console.log('✅ EMR schema already exists!');

    // List existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr'
      ORDER BY table_name
    `);

    if (tables.rows.length > 0) {
      console.log(`   Found ${tables.rows.length} tables in EMR schema:`);
      tables.rows.forEach(row => {
        console.log(`   - emr.${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  Schema exists but no tables found');
    }

    return true;
  } else {
    console.log('⚠️  EMR schema does not exist yet');
    return false;
  }
}

async function createSchema(client) {
  console.log('\n🏗️  Creating EMR schema and tables...\n');

  try {
    // Read schema file
    const schemaPath = path.resolve(__dirname, '../database/schema_enhanced.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await client.query(schemaSql);

    console.log('✅ EMR schema created successfully!');

    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr'
      ORDER BY table_name
    `);

    console.log(`\n✅ Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`   ✓ emr.${row.table_name}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    return false;
  }
}

async function loadInitialData(client) {
  console.log('\n📦 Loading initial test data...\n');

  try {
    // Read init file
    const initPath = path.resolve(__dirname, '../database/init_db.sql');
    const initSql = fs.readFileSync(initPath, 'utf8');

    // Execute init data
    await client.query(initSql);

    console.log('✅ Initial data loaded successfully!');

    // Show summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM emr.tenants) as tenants,
        (SELECT COUNT(*) FROM emr.users) as users,
        (SELECT COUNT(*) FROM emr.patients) as patients,
        (SELECT COUNT(*) FROM emr.employees) as employees,
        (SELECT COUNT(*) FROM emr.inventory_items) as inventory_items
    `);

    const counts = summary.rows[0];
    console.log('\n📊 Data Summary:');
    console.log(`   Tenants: ${counts.tenants}`);
    console.log(`   Users: ${counts.users}`);
    console.log(`   Patients: ${counts.patients}`);
    console.log(`   Employees: ${counts.employees}`);
    console.log(`   Inventory Items: ${counts.inventory_items}`);

    return true;
  } catch (error) {
    console.error('❌ Error loading initial data:', error.message);
    // Check if it's a duplicate key error (data already exists)
    if (error.code === '23505') {
      console.log('   ℹ️  Some data already exists (this is normal)');
      return true;
    }
    return false;
  }
}

async function showTestCredentials() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 TEST CREDENTIALS');
  console.log('='.repeat(60));
  console.log('\n📝 Superadmin:');
  console.log('   Tenant: superadmin');
  console.log('   Email: superadmin@emr.local');
  console.log('   Password: Admin@123');
  console.log('\n📝 Tenant Admin (Selva Care Hospital):');
  console.log('   Email: anita@sch.local');
  console.log('   Password: Anita@123');
  console.log('\n📝 Doctor:');
  console.log('   Email: rajesh@sch.local');
  console.log('   Password: Rajesh@123');
  console.log('\n📝 Patient:');
  console.log('   Email: meena@sch.local');
  console.log('   Password: Meena@123');
  console.log('\n' + '='.repeat(60));
}

async function main() {
  const arg = process.argv[2] || 'keep';
  console.log('🚀 Neon Database Setup\n');
  console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'), '\n');
  console.log('Option:', arg, '\n');

  // Test connection
  const client = await testConnection();

  try {
    if (arg === 'recreate') {
      console.log('⚠️  Recreating schema as requested...');
      await client.query('DROP SCHEMA IF EXISTS emr CASCADE');
      console.log('✅ Schema dropped.');
    }

    // Check if schema exists
    const schemaExists = await checkSchemaExists(client);

    if (schemaExists && arg !== 'recreate') {
      console.log('\n✅ Your Neon database is already set up with EMR schema!');
      console.log('\n💡 What would you like to do?');
      console.log('   1. Keep existing schema (recommended if you have data)');
      console.log('   2. Recreate schema (⚠️  WARNING: This will delete all data!)');
      console.log('\n   Run with option: node scripts/setup_neon_db.js [keep|recreate]');
      console.log('   Default: keep\n');
    } else {
      console.log('\n📝 Schema does not exist. Creating...');

      const schemaCreated = await createSchema(client);
      if (!schemaCreated) {
        console.error('\n❌ Failed to create schema. Exiting.');
        process.exit(1);
      }

      console.log('\n📝 Loading initial test data...');
      await loadInitialData(client);

      showTestCredentials();

      console.log('\n✅ Setup complete! Your database is ready to use.');
      console.log('\n🚀 Next steps:');
      console.log('   1. Run: npm run dev:server');
      console.log('   2. Test: curl http://localhost:4000/api/health');
      console.log('   3. Login with credentials above\n');
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
  } finally {
    await client.end();
  }
}

main();
