/**
 * Load test data - Fixed version
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

async function loadData() {
  console.log('📦 Loading test data into database...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Read quick init SQL
    const initPath = path.resolve(__dirname, '../database/init_quick.sql');
    const sql = fs.readFileSync(initPath, 'utf8');
    
    console.log('📝 Loading users and test data...');
    const result = await client.query(sql);
    
    console.log('✅ Test data loaded successfully!\n');
    
    // Show what was loaded
    const users = await client.query('SELECT COUNT(*) FROM emr.users');
    const tenants = await client.query('SELECT COUNT(*) FROM emr.tenants');
    const patients = await client.query('SELECT COUNT(*) FROM emr.patients');
    
    console.log('📊 Summary:');
    console.log(`   Users: ${users.rows[0].count}`);
    console.log(`   Tenants: ${tenants.rows[0].count}`);
    console.log(`   Patients: ${patients.rows[0].count}`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('   ===================================');
    console.log('   Superadmin:');
    console.log('   - Tenant: superadmin');
    console.log('   - Email: superadmin@emr.local');
    console.log('   - Password: Admin@123');
    console.log('   ===================================');
    console.log('   Tenant Admin:');
    console.log('   - Email: anita@sch.local');
    console.log('   - Password: Anita@123');
    console.log('   ===================================\n');
    
  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Data already exists in database');
      console.log('   This is normal - users are already loaded\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error('   Details:', error.detail || '');
    }
  } finally {
    await client.end();
  }
}

loadData();
