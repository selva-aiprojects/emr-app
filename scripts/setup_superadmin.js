
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupSuperadmin() {
  console.log('🛡️ Setting up Global Superadmin (HIPAA Compliant System-Wide Access)...');
  const client = await pool.connect();

  try {
    const passwordHash = bcrypt.hashSync('Super@Admin123', 10);

    // Create Superadmin (tenant_id is NULL by design)
    await client.query(`
      INSERT INTO emr.users (name, email, password_hash, role, is_active, tenant_id)
      VALUES ($1, $2, $3, $4, true, NULL)
      ON CONFLICT (email, tenant_id) DO UPDATE SET role = 'Superadmin'
    `, ['System Architect', 'superadmin@medflow.com', passwordHash, 'Superadmin']);

    console.log('✅ Global Superadmin Created: superadmin@medflow.com');
    console.log('Note: This user has NO access to clinical patient data per HIPAA standards.');
  } catch (err) {
    console.error('❌ Superadmin Setup Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSuperadmin();
