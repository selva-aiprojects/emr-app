import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

async function seedPersonas() {
  try {
    console.log('🚀 Starting Persona Seeding...');
    
    // 1. Get Tenant ID for New Age Hospital
    const tenantResult = await query("SELECT id FROM emr.tenants WHERE name = 'New Age Hospital'");
    if (tenantResult.rows.length === 0) {
      console.error('❌ Tenant "New Age Hospital" not found. Please run baseline migrations first.');
      process.exit(1);
    }
    const tenantId = tenantResult.rows[0].id;
    const password = 'Medflow@2026';
    const passwordHash = await hashPassword(password);

    const personas = [
      { name: 'Administrator', email: 'admin@newage.hospital', role: 'Admin' },
      { name: 'Chief Surgeon', email: 'doctor@newage.hospital', role: 'Doctor' },
      { name: 'Head Nurse', email: 'nurse@newage.hospital', role: 'Nurse' },
      { name: 'Senior Pharmacist', email: 'pharmacy@newage.hospital', role: 'Pharmacy' },
      { name: 'Lab Director', email: 'lab@newage.hospital', role: 'Lab' },
      { name: 'Finance Head', email: 'accounts@newage.hospital', role: 'Accounts' },
      { name: 'HR Director', email: 'hr@newage.hospital', role: 'HR' },
      { name: 'Emergency Dispatch', email: 'frontoffice@newage.hospital', role: 'Front Office' },
    ];

    for (const p of personas) {
      // Check if user exists
      const check = await query("SELECT id FROM emr.users WHERE email = $1 AND tenant_id = $2", [p.email, tenantId]);
      
      if (check.rows.length > 0) {
        console.log(`🟡 Skipping ${p.name} (${p.email}) - Already exists.`);
        continue;
      }

      // Create user
      await query(
        "INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, $5, true)",
        [tenantId, p.email, passwordHash, p.name, p.role]
      );
      console.log(`✅ Created ${p.name} [${p.role}]`);
    }

    console.log('\n✨ Seeding Complete. All personas are active.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
}

seedPersonas();
