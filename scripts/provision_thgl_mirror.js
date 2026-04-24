
import { query } from '../server/db/connection.js';
import { createTenant, provisionTenantSchema } from '../server/db/tenant.service.js';

async function provisionMirror() {
  console.log('🚀 Initiating THGL Institutional Mirroring...');
  
  try {
    const nhglId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    
    // 1. Create Tenant THGL
    console.log('📦 Registering THGL in Governance Registry...');
    const thglTenant = await createTenant({
      name: 'THGL Healthcare Institute',
      code: 'THGL',
      subdomain: 'thgl',
      contactEmail: 'admin@thgl.local',
      subscription_tier: 'Enterprise'
    });
    
    const thglId = thglTenant.id;
    console.log(`✅ THGL Tenant created with ID: ${thglId}`);
    
    // 1.5 Update Institutional Identity
    console.log('🎨 Applying Institutional Branding Shard to THGL...');
    await query(`
      UPDATE emr.tenants 
      SET theme = $1,
          features = $2
      WHERE id = $3
    `, [
      JSON.stringify({ 
        primary: '#1e293b', 
        accent: '#06b6d4',
        name: 'THGL Healthcare' 
      }),
      JSON.stringify({
        has_payroll: true,
        has_staff_management: true,
        has_ledger: true
      }),
      thglId
    ]);
    
    // 2. Provision Schema
    console.log('📂 Provisioning isolated clinical schema [thgl]...');
    const schemaProvision = await provisionTenantSchema(thglId, 'thgl');
    if (!schemaProvision.success) {
      throw new Error(`Schema provisioning failed: ${schemaProvision.error}`);
    }
    console.log('✅ Schema isolation complete.');
    
    // 3. Mirror Infrastructure Data from NHGL
    console.log('🔄 Mirroring NHGL Infrastructure (Wards, Departments, Services)...');
    
    // A. Departments
    await query(`
      INSERT INTO emr.departments (tenant_id, name, code, description, head_of_dept, is_active)
      SELECT $1, name, code, description, head_of_dept, is_active
      FROM emr.departments WHERE tenant_id = $2
      ON CONFLICT DO NOTHING
    `, [thglId, nhglId]);
    
    // B. Wards
    await query(`
      INSERT INTO emr.wards (tenant_id, name, type, base_rate, total_beds)
      SELECT $1, name, type, base_rate, total_beds
      FROM emr.wards WHERE tenant_id = $2
      ON CONFLICT DO NOTHING
    `, [thglId, nhglId]);
    
    // C. Services
    await query(`
      INSERT INTO emr.services (tenant_id, name, code, category, base_rate, tax_percent)
      SELECT $1, name, code, category, base_rate, tax_percent
      FROM emr.services WHERE tenant_id = $2
      ON CONFLICT DO NOTHING
    `, [thglId, nhglId]);
    
    // 4. Provision Seed Admin User
    console.log('👤 Provisioning Institutional Administrator...');
    await query(`
      INSERT INTO emr.users (tenant_id, name, email, role, is_active)
      VALUES ($1, 'THGL Administrator', 'admin@thgl.local', 'Admin', true)
      ON CONFLICT DO NOTHING
    `, [thglId]);

    console.log('\n✨ THGL Mirroring Complete! Institution is ready for Full Lifecycle Verification.');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Mirroring Failed:', err.message);
    process.exit(1);
  }
}

provisionMirror();
