import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function check() {
  await client.connect();
  try {
    const NHGL_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    
    const items = await client.query(`
      SELECT count(*), json_agg(category) FROM emr.inventory_items WHERE tenant_id = $1
    `, [NHGL_ID]);
    console.log(`NHGL (${NHGL_ID}) Inventory Count:`, items.rows[0].count);
    console.log(`NHGL Categories:`, items.rows[0].json_agg);

    const selvaId = '10000000-0000-0000-0000-000000000001';
    const selvaItems = await client.query(`
      SELECT count(*) FROM emr.inventory_items WHERE tenant_id = $1
    `, [selvaId]);
    console.log(`Selva (${selvaId}) Inventory Count:`, selvaItems.rows[0].count);

  } catch (e) {
    console.error('Check failed:', e.message);
  } finally {
    await client.end();
  }
}

check();
