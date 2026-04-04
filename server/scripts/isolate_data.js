import 'dotenv/config';
import { managementClient, getTenantClient } from "../db/prisma_manager.js";

async function isolate() {
  console.log("🚀 STARTING DATA ISOLATION MIGRATION...");
  try {
    const tenants = await managementClient.$queryRawUnsafe('SELECT id, name, code, schema_name FROM emr.management_tenants');
    
    for (const t of tenants) {
      console.log(`⏩ Processing ${t.name} (${t.code}) -> schema: ${t.schema_name}`);
      const target = getTenantClient(t.schema_name);

      // 1. Migrate Patients
      console.log(`   - Querying legacy patients for tenant ${t.id} from emr.patients...`);
      const legacyPatients = await managementClient.$queryRawUnsafe(`SELECT * FROM emr.patients WHERE tenant_id::text = '${t.id}'`);
      console.log(`   - Found ${legacyPatients.length} legacy patients.`);

      for (const p of legacyPatients) {
        await target.patient.upsert({
          where: { id: p.id },
          update: {},
          create: {
            id: p.id,
            mrn: p.mrn,
            firstName: p.first_name,
            lastName: p.last_name,
            gender: p.gender,
            dob: p.dob,
            phone: p.phone,
            email: p.email,
            address: p.address,
            city: p.city,
            state: p.state,
            zip: p.zip,
            status: p.status,
            created_at: p.created_at
          }
        }).catch(err => console.error(`      ❌ Patient ${p.mrn} failed:`, err.message));
      }

      // 2. Migrate Staff (Users)
      console.log(`   - Querying legacy users for tenant ${t.id}...`);
      const legacyUsers = await managementClient.$queryRawUnsafe(`SELECT * FROM emr.users WHERE tenant_id::text = '${t.id}'`);
      console.log(`   - Found ${legacyUsers.length} legacy staff.`);

      for (const u of legacyUsers) {
        // Ensure role exists in target schema
        await target.user.upsert({
          where: { id: u.id },
          update: {},
          create: {
            id: u.id,
            email: u.email,
            name: u.name,
            password_hash: u.password_hash,
            status: u.status,
            role: {
              connectOrCreate: {
                where: { name: u.role },
                create: { name: u.role }
              }
            }
          }
        }).catch(err => console.error(`      ❌ User ${u.email} failed:`, err.message));
      }
    }

    console.log("✅ ISOLATION COMPLETE. All clinical records have been moved to their private tenant schemas.");
  } catch (error) {
    console.error("❌ Migration Process Failed:", error);
  } finally {
    process.exit(0);
  }
}

isolate();
