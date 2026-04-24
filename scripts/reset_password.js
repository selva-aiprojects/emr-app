import { query } from '../server/db/connection.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  try {
    const email = 'administrator@mghplhospital.com';
    const newPassword = 'Admin@123';
    const hash = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔄 Resetting password for ${email}...`);
    
    const res = await query(
      "UPDATE emr.users SET password_hash = $1 WHERE email = $2 RETURNING id",
      [hash, email]
    );
    
    if (res.rowCount > 0) {
      console.log('✅ Password successfully reset to Admin@123');
    } else {
      console.log('❌ User not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

resetPassword();
