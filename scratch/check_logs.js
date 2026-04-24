import pool from './server/db/connection.js';

async function checkLogs() {
    try {
        console.log("--- SYSTEM LOGS ---");
        const logs = await pool.query("SELECT event, details, created_at FROM emr.management_system_logs ORDER BY created_at DESC LIMIT 10");
        logs.rows.forEach(log => {
            console.log(`[${log.created_at.toISOString()}] ${log.event}: ${log.details}`);
        });
        
        console.log("\n--- TENANT TABLE ---");
        const tenants = await pool.query("SELECT name, code, schema_name FROM emr.management_tenants");
        tenants.rows.forEach(t => console.log(`- ${t.name} (${t.code}) -> ${t.schema_name}`));

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

checkLogs();
