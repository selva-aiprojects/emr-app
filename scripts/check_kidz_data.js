import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
dotenv.config();

async function checkData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const tenantId = '10000000-0000-0000-0000-000000000001';

        console.log('---PATIENTS---');
        const patients = await client.query("SELECT id, first_name, last_name, mrn FROM emr.patients WHERE tenant_id = $1", [tenantId]);
        console.log(JSON.stringify(patients.rows, null, 2));

        console.log('---ENCOUNTERS---');
        const encounters = await client.query("SELECT id, patient_id, type, status, diagnosis FROM emr.encounters WHERE tenant_id = $1", [tenantId]);
        console.log(JSON.stringify(encounters.rows, null, 2));

        console.log('---INVENTORY---');
        const inventory = await client.query("SELECT * FROM emr.inventory_items WHERE tenant_id = $1", [tenantId]);
        console.log(JSON.stringify(inventory.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkData();
