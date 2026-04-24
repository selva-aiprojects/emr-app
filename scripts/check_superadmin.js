import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

async function createSuperadmin() {
  try {
    const res = await query("SELECT id, email, role, tenant_id FROM emr.users WHERE email = 'superadmin@emr.local'");
    if (res.rows.length === 0) {
      console.log("Superadmin user not found, creating it now...");
      const hashedPassword = await hashPassword('Admin@123');
      const insertSql = `
        INSERT INTO emr.users (email, password_hash, name, role, tenant_id, is_active)
        VALUES ($1, $2, $3, $4, NULL, true)
        RETURNING *
      `;
      const inserted = await query(insertSql, ['superadmin@emr.local', hashedPassword, 'Platform Superadmin', 'Superadmin']);
      console.log("Created successfully:", inserted.rows[0]);
    } else {
      console.log("Superadmin user exists:", res.rows[0]);
    }
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

createSuperadmin();
