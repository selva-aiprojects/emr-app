import { query } from '../server/db/connection.js';

async function enhanceGovernance() {
  try {
    // 1. Create communication tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS emr.tenant_communications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES emr.tenants(id),
          type VARCHAR(50), 
          subject VARCHAR(255),
          content TEXT,
          recorded_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Update Feature View to include Free Tier and Pharmacy/Lab flag
    const sql = `
      CREATE OR REPLACE VIEW emr.tenant_feature_status AS
      SELECT 
          t.id as tenant_id,
          t.name as tenant_name,
          t.subscription_tier,
          all_flags.feature_flag,
          COALESCE(tf.enabled, false) as custom_enabled,
          COALESCE(gks.enabled, false) as kill_switch_active,
          CASE 
              WHEN gks.enabled = true THEN false
              WHEN tf.enabled = true THEN true
              ELSE (
                  CASE t.subscription_tier
                      WHEN 'Free' THEN all_flags.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access')
                      WHEN 'Basic' THEN all_flags.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access', 'permission-pharmacy_lab-access')
                      WHEN 'Professional' THEN all_flags.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access', 'permission-pharmacy_lab-access', 'permission-inpatient-access')
                      WHEN 'Enterprise' THEN true
                      ELSE false
                  END
              )
          END as effective_enabled
      FROM emr.tenants t
      CROSS JOIN (
          SELECT 'permission-core_engine-access' as feature_flag
          UNION SELECT 'permission-hr_payroll-access'
          UNION SELECT 'permission-accounts-access'
          UNION SELECT 'permission-customer_support-access'
          UNION SELECT 'permission-inpatient-access'
          UNION SELECT 'permission-pharmacy_lab-access'
      ) all_flags
      LEFT JOIN emr.tenant_features tf ON t.id = tf.tenant_id AND all_flags.feature_flag = tf.feature_flag
      LEFT JOIN emr.global_kill_switches gks ON all_flags.feature_flag = gks.feature_flag
      WHERE t.status = 'active';
    `;
    
    await query(sql);
    console.log("Successfully enhanced governance database structures.");
  } catch (e) {
    console.error("Governance enhancement error:", e);
  }
  process.exit(0);
}

enhanceGovernance();
