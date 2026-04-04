
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function audit() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log("--- Tables in 'emr' Schema ---");
        const emrTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'emr' 
            ORDER BY table_name
        `);
        emrTables.rows.forEach(r => console.log(`- emr.${r.table_name}`));
        
        console.log("\n--- Tables in 'public' Schema ---");
        const publicTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name NOT LIKE 'pg_%' 
              AND table_name NOT LIKE 'sql_%'
            ORDER BY table_name
        `);
        publicTables.rows.forEach(r => console.log(`- public.${r.table_name}`));

        console.log("\n--- Cross-Schema Shadowing Check ---");
        const shadowed = emrTables.rows.filter(er => 
            publicTables.rows.some(pr => pr.table_name === er.table_name)
        );
        
        if (shadowed.length > 0) {
            console.log("⚠️ WARNING: The following tables exist in BOTH emr and public (Shadowing):");
            shadowed.forEach(s => console.log(`  - ${s.table_name}`));
        } else {
            console.log("✅ No table shadowing detected.");
        }

    } catch (err) {
        console.error("Audit failed:", err.message);
    } finally {
        await client.end();
    }
}

audit();
