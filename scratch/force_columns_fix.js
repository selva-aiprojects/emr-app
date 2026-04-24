import pg from 'pg';
import dotenv from 'dotenv';
const { Client } = pg;
dotenv.config();

async function fix() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Database.');

  const checkSql = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'emr' AND table_name = 'tenants'
  `;
  const res = await client.query(checkSql);
  const columns = res.rows.map(r => r.column_name);
  console.log('Current columns:', columns);

  const missing = [];
  if (!columns.includes('logo_url')) missing.push('ADD COLUMN logo_url TEXT');
  if (!columns.includes('status')) missing.push('ADD COLUMN status VARCHAR(32) DEFAULT \'active\'');
  if (!columns.includes('theme')) missing.push('ADD COLUMN theme JSONB DEFAULT \'{}\'');
  if (!columns.includes('features')) missing.push('ADD COLUMN features JSONB DEFAULT \'{}\'');
  if (!columns.includes('billing_config')) missing.push('ADD COLUMN billing_config JSONB DEFAULT \'{}\'');

  if (missing.length > 0) {
    console.log('Adding missing columns:', missing);
    await client.query(`ALTER TABLE emr.tenants ${missing.join(', ')}`);
    console.log('✅ Columns added successfully.');
  } else {
    console.log('✅ All branding columns are already present.');
  }

  await client.end();
}

fix().catch(err => {
  console.error('❌ Schema Fix Failed:', err.message);
  process.exit(1);
});
