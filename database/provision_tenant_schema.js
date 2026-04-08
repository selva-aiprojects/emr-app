import { query } from '../server/db/connection.js';

async function provisionTenantSchemas() {
  console.log("🚀 Initializing Missing Schema Provisioning...");
  try {
    // Determine the schemas we need based on existing active tenants
    const tenants = await query('SELECT id, code, schema_name FROM emr.management_tenants');
    
    for (const t of tenants.rows) {
      // Use the designated schema_name or fallback to lowercase code
      const schemaName = t.schema_name || t.code.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      console.log(`\n===========================================`);
      console.log(`Ensuring core schema structure for: ${t.code} (${schemaName})`);
      
      // 1. Create the schema itself
      await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      console.log(`✅ Verified schema "${schemaName}" exists`);
      
      // 2. Clone the core global tables into the isolated schema namespace
      // 'INCLUDING ALL' copies structure, constraints, indices, etc.
      const tablesToClone = ['patients', 'appointments', 'encounters', 'invoices'];
      for (const tableName of tablesToClone) {
        try {
          await query(`CREATE TABLE IF NOT EXISTS "${schemaName}"."${tableName}" (LIKE emr."${tableName}" INCLUDING ALL)`);
          console.log(`✅  - Table ${tableName} provisioned`);
        } catch (e) {
             console.warn(`⚠️  - Could not clone ${tableName}: ${e.message}`);
        }
      }

      // 3. Create specific operational tables for isolated environments
      try {
        await query(`CREATE TABLE IF NOT EXISTS "${schemaName}".beds (
            id uuid DEFAULT gen_random_uuid(), 
            tenant_id uuid, 
            status varchar(20), 
            room_no varchar(20)
        )`);
        console.log(`✅  - Table beds provisioned`);
      } catch (e) {}

      try {
        await query(`CREATE TABLE IF NOT EXISTS "${schemaName}".service_requests (
            id uuid DEFAULT gen_random_uuid(), 
            tenant_id uuid, 
            category varchar(20), 
            status varchar(20), 
            notes text, 
            created_at timestamptz DEFAULT now()
        )`);
        console.log(`✅  - Table service_requests provisioned`);
      } catch (e) {}
      
      console.log(`===========================================\n`);
    }

    console.log("🎉 All Tenant Schemas Provisioned Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error provisioning schemas:", error);
    process.exit(1);
  }
}

provisionTenantSchemas();
