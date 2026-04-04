import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
  const source = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await source.connect();
    console.log('Connected to Neon');

    const schema = await source.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'documents'
    `);
    console.log('--- Columns in emr.documents ---');
    console.table(schema.rows);

    const data = await source.query(`SELECT * FROM emr.documents LIMIT 1`);
    if (data.rows.length > 0) {
      console.log('--- Sample Row ---');
      const row = data.rows[0];
      for (const col in row) {
        console.log(`${col}: ${typeof row[col]} - ${row[col]}`);
      }
    } else {
      console.log('Table is empty in source? Wait, user log said Syncing emr.documents... followed by error.');
    }

  } catch (error) {
    console.error(error);
  } finally {
    await source.end();
  }
}

inspect();
