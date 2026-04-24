import { query } from '../server/db/connection.js';

async function updateView() {
  try {
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
                      WHEN 'Basic' THEN all_flags.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access')
                      WHEN 'Professional' THEN all_flags.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access', 'permission-inpatient-access')
                      WHEN 'Enterprise' THEN true
                      ELSE false
                  END
              )
          END as effective_enabled
      FROM emr.tenants t
      CROSS JOIN (
          SELECT 'permission-core_engine-access' as feature_flag
          UNION
          SELECT 'permission-hr_payroll-access' as feature_flag
          UNION
          SELECT 'permission-accounts-access' as feature_flag
          UNION
          SELECT 'permission-customer_support-access' as feature_flag
          UNION
          SELECT 'permission-inpatient-access' as feature_flag
      ) all_flags
      LEFT JOIN emr.tenant_features tf ON t.id = tf.tenant_id AND all_flags.feature_flag = tf.feature_flag
      LEFT JOIN emr.global_kill_switches gks ON all_flags.feature_flag = gks.feature_flag
      WHERE t.status = 'active';
    `;
    
    await query(sql);
    console.log("Successfully updated emr.tenant_feature_status view with new tier logic.");
  } catch (e) {
    console.error("Error updating view:", e);
  }
  process.exit(0);
}

updateView();
