import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('Testing direct PG connection...');
try {
  const result = await pool.query('SELECT NOW()');
  console.log('✅ Direct PG connection SUCCESS:', result.rows[0].now);
} catch (err) {
  console.error('❌ Direct PG connection FAILED:', err.message);
}
await pool.end();

import { managementClient } from './prisma_manager.js';
async function check() {
    try {
        const res = await managementClient.$queryRawUnsafe("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%management%'");
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Full Error Output:");
        console.error(e);
    } finally {
        await managementClient.$disconnect();
        process.exit(0);
    }
}
check();