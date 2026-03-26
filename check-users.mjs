import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emr' 
});

async function checkUsers() {
  try {
    console.log('🔍 Checking database for enterprise users...');
    
    // Check all users
    const allUsers = await pool.query('SELECT id, name, email, role, tenant_id FROM emr.users ORDER BY tenant_id, email');
    console.log('\n📋 All Users in Database:');
    allUsers.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Role: ${row.role}, Tenant: ${row.tenant_id}`);
    });

    // Check tenants
    const tenants = await pool.query('SELECT id, name, code, subscription_tier FROM emr.tenants ORDER BY code');
    console.log('\n🏢 Available Tenants:');
    tenants.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Code: ${row.code}, Tier: ${row.subscription_tier}`);
    });

    // Check specifically for enterprise/michael
    const enterpriseUsers = await pool.query('SELECT * FROM emr.users WHERE email LIKE $1 OR email LIKE $2', ['%enterprise%', '%michael%']);
    console.log('\n🎯 Enterprise/Michael Users:');
    if (enterpriseUsers.rows.length === 0) {
      console.log('❌ No enterprise users found in database');
    } else {
      enterpriseUsers.rows.forEach(row => {
        console.log(`Name: ${row.name}, Email: ${row.email}, Role: ${row.role}, Tenant: ${row.tenant_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
