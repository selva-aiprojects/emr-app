import { query } from './server/db/connection.js';

async function checkUser() {
  try {
    const result = await query('SELECT * FROM emr.users WHERE email = $1', ['rajesh@demo.hospital']);
    
    if (result.rows.length > 0) {
      console.log('User found:', result.rows[0]);
    } else {
      console.log('User not found');
      
      // Check all users
      const allUsers = await query('SELECT email, name, role FROM emr.users LIMIT 10');
      console.log('Available users:');
      allUsers.rows.forEach(user => {
        console.log(`  ${user.email} - ${user.name} (${user.role})`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUser();
