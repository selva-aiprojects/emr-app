
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function fullAudit() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const tables = ['drug_master', 'prescriptions', 'prescription_items'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'emr' AND table_name = $1
            `, [table]);
            console.log(`--- ${table} ---`);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }

    } catch (err) {
        console.error("Audit Failed:", err.message);
    } finally {
        await client.end();
    }
}

fullAudit();
