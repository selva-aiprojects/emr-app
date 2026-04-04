
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function deepAudit() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("--- Supabase Schema Forensic Audit ---");

        // 1. Audit Tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'emr'
        `);
        console.log(`Tables Found: ${tables.rows.map(r => r.table_name).join(', ')}`);

        // 2. Audit Key Columns for Invoices (Dashboard crash source)
        if (tables.rows.some(r => r.table_name === 'invoices')) {
            const invoiceCols = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'emr' AND table_name = 'invoices'
            `);
            console.log(`Invoice Columns: ${invoiceCols.rows.map(r => r.column_name).join(', ')}`);
        }

        // 3. Audit Patients table
        if (tables.rows.some(r => r.table_name === 'patients')) {
            const patientCols = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'emr' AND table_name = 'patients'
            `);
            console.log(`Patient Columns: ${patientCols.rows.map(r => r.column_name).join(', ')}`);
        }

        // 4. Audit Prescriptions table
        if (tables.rows.some(r => r.table_name === 'prescriptions')) {
            const rxCols = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'emr' AND table_name = 'prescriptions'
            `);
            console.log(`Prescription Columns: ${rxCols.rows.map(r => r.column_name).join(', ')}`);
        }

    } catch (err) {
        console.error("Audit Failed:", err.message);
    } finally {
        await client.end();
    }
}

deepAudit();
