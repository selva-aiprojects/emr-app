
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkInvoices() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'invoices'");
        console.log(`Columns: ${res.rows.map(r => r.column_name).join(', ')}`);
    } catch (err) {
        console.error(err.message);
    } finally {
        await client.end();
    }
}

checkInvoices();
