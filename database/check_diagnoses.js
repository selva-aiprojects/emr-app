import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const TENANT_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  console.log('🔍 Checking NHGL Diagnoses Data...');

  try {
    const res = await client.query(`
      SELECT diagnosis, COUNT(*) 
      FROM nhgl.encounters 
      WHERE tenant_id = $1 
      GROUP BY diagnosis`, [TENANT_ID]);
    
    console.table(res.rows);
    if (res.rows.length === 0) {
       const all = await client.query(`SELECT count(*) FROM nhgl.encounters`);
       console.log(`Total encounters in nhgl schema: ${all.rows[0].count}`);
       
       const tenantCheck = await client.query(`SELECT DISTINCT tenant_id FROM nhgl.encounters`);
       console.log(`Distinct tenant_ids in nhgl.encounters:`, tenantCheck.rows);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

check();
