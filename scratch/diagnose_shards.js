import pool from './server/db/connection.js';

async function diagnose() {
    try {
        console.log("--- DIAGNOSTIC START ---");
        const mCount = await pool.query("SELECT count(*) FROM emr.management_tenants");
        console.log("Management Tenants Count:", mCount.rows[0].count);

        const smc = await pool.query("SELECT * FROM emr.management_tenants WHERE code = 'SMC-MEGA'");
        console.log("SMC-MEGA found in Management Plane:", smc.rows.length > 0);
        if (smc.rows.length > 0) {
            console.log("SMC-MEGA Data:", JSON.stringify(smc.rows[0], null, 2));
            const metrics = await pool.query("SELECT * FROM emr.management_tenant_metrics WHERE tenant_id = $1", [smc.rows[0].id]);
            console.log("SMC-MEGA Metrics found:", metrics.rows.length > 0);
        }

        const lCount = await pool.query("SELECT count(*) FROM emr.tenants");
        console.log("Legacy Tenants Count:", lCount.rows[0].count);

        const summary = await pool.query("SELECT * FROM emr.management_dashboard_summary WHERE summary_key = 'global'");
        console.log("Dashboard Summary:", JSON.stringify(summary.rows[0], null, 2));

        console.log("--- DIAGNOSTIC END ---");
        process.exit(0);
    } catch (err) {
        console.error("DIAGNOSTIC ERROR:", err.message);
        process.exit(1);
    }
}

diagnose();
