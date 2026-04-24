import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
dotenv.config();

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const tables = ['patients', 'encounters', 'inventory_items', 'clinical_records', 'invoices', 'prescriptions', 'invoice_items'];

        for (const table of tables) {
            console.log(`--- SCHEMA: ${table} ---`);
            const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'emr' AND table_name = $1
      `, [table]);
            console.log(JSON.stringify(result.rows, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
