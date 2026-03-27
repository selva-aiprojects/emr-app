import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function emergencyReset() {
  try {
    console.log('🔗 Connecting to to the database...');
    const defaultPassword = 'AdminPassword123!';
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    // Update all users who have the role 'Admin' and whose email starts with 'admin@'
    const result = await pool.query(`
      UPDATE emr.users 
      SET password_hash = $1 
      WHERE role = 'Admin' 
      AND email LIKE 'admin@%'
    `, [hash]);

    console.log(`✅ Success! Reset the password for ${result.rowCount} Tenant Admins.`);
    console.log(`\n===========================================`);
    console.log(`🔑 NEW UNIVERSAL PASSWORD:  ${defaultPassword}`);
    console.log(`===========================================\n`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    pool.end();
  }
}

emergencyReset();
