/**
 * Test bcrypt and database
 */

import dotenv from 'dotenv';
import pkg from 'pg';
import { hashPassword, comparePassword } from '../server/services/auth.service.js';

const { Client } = pkg;

dotenv.config();

async function test() {
  console.log('🧪 Testing authentication...\n');
  
  // Test 1: bcrypt works
  console.log('1️⃣ Testing bcrypt module...');
  try {
    const testHash = await hashPassword('Admin@123');
    console.log('   ✅ bcrypt is working');
    console.log('   Sample hash:', testHash.substring(0, 20) + '...');
    
    const isValid = await comparePassword('Admin@123', testHash);
    console.log('   ✅ Password comparison works:', isValid);
  } catch (error) {
    console.log('   ❌ bcrypt error:', error.message);
    return;
  }
  
  // Test 2: Check database user
  console.log('\n2️⃣ Checking superadmin in database...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT email, password_hash, role, is_active 
      FROM emr.users 
      WHERE role = 'Superadmin'
    `);
    
    if (result.rows.length === 0) {
      console.log('   ❌ No superadmin found!');
      return;
    }
    
    const user = result.rows[0];
    console.log('   ✅ Superadmin found');
    console.log('   Email:', user.email);
    console.log('   Active:', user.is_active);
    console.log('   Hash format:', user.password_hash.substring(0, 7));
    
    // Test 3: Try to verify the password
    console.log('\n3️⃣ Testing password comparison...');
    const isValid = await comparePassword('Admin@123', user.password_hash);
    console.log('   Password "Admin@123" valid?', isValid);
    
    if (!isValid) {
      console.log('\n❌ Password does not match!');
      console.log('   The hash in database might be wrong.');
      console.log('   Let me regenerate it...\n');
      
      const newHash = await hashPassword('Admin@123');
      console.log('   New hash generated:', newHash.substring(0, 30) + '...');
      
      await client.query(
        `UPDATE emr.users SET password_hash = $1 WHERE role = 'Superadmin'`,
        [newHash]
      );
      
      console.log('   ✅ Password updated in database!');
      console.log('   Try login again now.');
    } else {
      console.log('   ✅ Password matches! Login should work.');
    }
    
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

test();
