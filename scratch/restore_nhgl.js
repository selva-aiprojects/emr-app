import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function restoreNhgl() {
    console.log('🚀 Restoring NHGL schema tables...');
    const client = await pool.connect();
    
    try {
        await client.query('DROP SCHEMA IF EXISTS "nhgl" CASCADE');
        await client.query('CREATE SCHEMA IF NOT EXISTS "nhgl"');
        await client.query('SET search_path TO "nhgl"');
        
        const schemaPath = path.join(__dirname, '../database/tenant_base_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(sql);
            console.log('✅ NHGL clinical tables restored successfully.');
        } else {
            console.error('❌ Could not find tenant_base_schema.sql');
        }
        
    } catch (err) {
        console.error('❌ Failed to restore NHGL:', err.message);
    } finally {
        client.release();
        pool.end();
    }
}

restoreNhgl();
