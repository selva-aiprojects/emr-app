import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(__dirname, 'migrations', '13_create_modular_institutional_tables.sql');

async function runMigration() {
  try {
    console.log('--- STARTING INSTITUTIONAL EXPANSION MIGRATION ---');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await query(sql);
    console.log('--- MIGRATION 13 COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('--- MIGRATION FAILURE ---');
    console.error(err);
    process.exit(1);
  }
}

runMigration();
