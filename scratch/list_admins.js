import pkg from 'pg';
const { Pool } = pkg;
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

async function listAdmins() {
  try {
    const res = await pool.query(`
      SELECT id, email, name, role, is_active, password_hash
      FROM nexus.users 
      WHERE role ILIKE '%admin%' OR tenant_id IS NULL
    `);
    
    console.log('--- ADMIN USERS IN NEXUS.USERS ---');
    res.rows.forEach(r => {
      console.log(`- ID: ${r.id} | Email: ${r.email} | Name: ${r.name} | Role: ${r.role} | Active: ${r.is_active} | HasPassword: ${!!r.password_hash}`);
    });
    console.log('----------------------------------');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

listAdmins();
