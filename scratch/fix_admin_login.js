import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAdmin() {
  try {
    console.log('Checking Admin user...');
    
    // Check if password_hash column exists
    const colCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema='nexus' AND table_name='users' AND column_name='password_hash'
    `);
    
    if (colCheck.rows.length === 0) {
      console.log('Adding password_hash column to nexus.users...');
      await pool.query('ALTER TABLE nexus.users ADD COLUMN password_hash VARCHAR(255)');
    }

    const email = 'admin@healthezee.com';
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 10);

    const res = await pool.query(
      `UPDATE nexus.users 
       SET password_hash = $1 
       WHERE email = $2 
       RETURNING id, email, password_hash`,
      [hash, email]
    );

    if (res.rows.length > 0) {
      console.log(`✅ Admin password reset successfully for ${email}`);
    } else {
      console.log(`⚠️ Admin user ${email} not found in nexus.users. Inserting now...`);
      await pool.query(
        `INSERT INTO nexus.users (id, tenant_id, email, name, role, password_hash, is_active)
         VALUES (gen_random_uuid(), NULL, $1, 'Super Admin', 'Superadmin', $2, true)`,
         [email, hash]
      );
      console.log(`✅ Super Admin created with ${email} / ${password}`);
    }
  } catch (err) {
    console.error('Failed to fix admin:', err.message);
  } finally {
    await pool.end();
  }
}

fixAdmin();
