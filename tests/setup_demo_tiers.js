import { query } from '../server/db/connection.js';
import bcrypt from 'bcryptjs';

const PASSWORD_HASH = await bcrypt.hash('Test@123', 10);

const DEMO_TENANTS = [
  { name: 'MedFlow Demo: Free Tier', code: 'seedling', tier: 'Free', email: 'admin@seedling.local' },
  { name: 'MedFlow Demo: Basic Tier', code: 'greenvalley', tier: 'Basic', email: 'admin@greenvalley.local' },
  { name: 'MedFlow Demo: Pro Tier', code: 'sunrise', tier: 'Professional', email: 'admin@sunrise.local' },
  { name: 'MedFlow Demo: Enterprise Tier', code: 'apollo', tier: 'Enterprise', email: 'admin@apollo.local' }
];

async function setup() {
  console.log('🚀 Setting up Multi-Tier Demo Environment...');

  for (const t of DEMO_TENANTS) {
    try {
      // 1. Upsert Tenant
      const tenantRes = await query(`
        INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, status)
        VALUES ($1, $2, $2, $3, 'active')
        ON CONFLICT (code) 
        DO UPDATE SET subscription_tier = $3, name = $1, status = 'active'
        RETURNING id
      `, [t.name, t.code, t.tier]);
      
      const tenantId = tenantRes.rows[0].id;
      console.log(`✅ Tenant [${t.code}] ready as ${t.tier}`);

      // 1.1 Sync to Management Registry (Institutional Control Plane)
      await query(`
        INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier)
        VALUES ($1, $2, $3, $3, $3, 'active', $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = 'active',
          subscription_tier = EXCLUDED.subscription_tier
      `, [tenantId, t.name, t.code, t.email, t.tier]);

      // 2. Upsert Admin User
      const userRes = await query(`
        INSERT INTO emr.users (tenant_id, email, password_hash, role, name, is_active)
        VALUES ($1, $2, $3, 'Admin', $4, true)
        ON CONFLICT (tenant_id, email) 
        DO UPDATE SET role = 'Admin', name = $4
        RETURNING id
      `, [tenantId, t.email, PASSWORD_HASH, `Admin ${t.name}`]);
      
      const userId = userRes.rows[0].id;
      console.log(`👤 User [${t.email}] ready`);

      // 3. Seed Patients & Data based on Tier
      if (t.tier === 'Basic' || t.tier === 'Professional' || t.tier === 'Enterprise') {
        const patientRes = await query(`
          INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, gender, phone, date_of_birth)
          VALUES ($1, 'Arun', 'Nair', $2, 'Male', '9876543210', '1990-01-01')
          ON CONFLICT (tenant_id, mrn) DO UPDATE SET first_name = 'Arun'
          RETURNING id
        `, [tenantId, `${t.code.toUpperCase()}-001`]);
        
        const patientId = patientRes.rows[0].id;
        console.log(`🏥 Patient [Arun] seeded for ${t.code}`);

        // Seed encounter
        let encounterId;
        try {
          const encounterRes = await query(`
            INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, status, encounter_type)
            VALUES ($1, $2, $3, 'open', 'Out-patient')
            RETURNING id
          `, [tenantId, patientId, userId]);
          encounterId = encounterRes.rows[0].id;
        } catch (e) {
             const encounterRes = await query(`
              INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, status, encounter_type)
              VALUES ($1, $2, $3, 'open', 'OPD')
              RETURNING id
            `, [tenantId, patientId, userId]);
            encounterId = encounterRes.rows[0].id;
        }

        // Seed checked-in appointment
        await query(`
          INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason)
          VALUES ($1, $2, $3, NOW(), NOW() + interval '30 minutes', 'checked_in', 'Routine checkup')
          ON CONFLICT DO NOTHING
        `, [tenantId, patientId, userId]);
        
        // Seed prescription
        if (t.tier === 'Basic' || t.tier === 'Enterprise') {
          const drugs = await query(`SELECT drug_id, generic_name FROM emr.drug_master LIMIT 1`);
          if (drugs.rows.length > 0) {
            const drugId = drugs.rows[0].drug_id;
            const drugName = drugs.rows[0].generic_name;
            
            const rxRes = await query(`
              INSERT INTO emr.prescriptions (tenant_id, patient_id, provider_id, encounter_id, status, drug_name)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `, [tenantId, patientId, userId, encounterId, 'active', drugName]);
            
            await query(`
              INSERT INTO emr.prescription_items (prescription_id, drug_id, sequence, dose, dose_unit, frequency, quantity_prescribed, status)
              VALUES ($1, $2, 1, '500', 'mg', '1-0-1', 10, 'pending')
            `, [rxRes.rows[0].id, drugId]);
            console.log(`💊 Prescription seeded for ${t.code}`);
          }
        }
      }
      
    } catch (err) {
      console.error(`❌ Error setting up [${t.code}]:`, err.message);
    }
  }

  console.log('\n🎉 Multi-tier setup complete!');
  process.exit(0);
}

setup();
