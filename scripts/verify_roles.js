import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
dotenv.config();

async function verify() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const emails = ['arun@sch.local', 'meera@sch.local', 'lakshmi@sch.local'];
        const result = await client.query("SELECT email, role, name, tenant_id FROM emr.users WHERE email = ANY($1)", [emails]);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

verify();
