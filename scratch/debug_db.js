import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debug() {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'nhgl'");
    console.log('Tables in nhgl:', res.rows.map(r => r.table_name));
    
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata");
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    
    await client.end();
}
debug();
