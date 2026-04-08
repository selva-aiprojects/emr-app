import { query } from '../server/db/connection.js';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  console.log("🚀 Starting password update...");
  try {
    const password = "Admin@123";
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log(`Generated hash for ${password}`);

    const updateQuery = `
      UPDATE emr.users 
      SET password_hash = $1 
      WHERE role = 'Admin' OR role = 'Superadmin'
    `;
    
    // Also update passwords for all users if the user meant EVERYONE, but the mandate says "all Tenant admin password".
    // "role = 'Admin'" usually represents the admin of a tenant.
    const res = await query(updateQuery, [passwordHash]);

    console.log(`✅ Successfully updated passwords for ${res.rowCount} Admin users to "Admin@123".`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error updating passwords:", error);
    process.exit(1);
  }
}

updatePasswords();
