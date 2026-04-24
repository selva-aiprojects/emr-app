
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../server/db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const migrationFile = process.argv[2];

    if (!migrationFile) {
        console.error('Please specific a migration file path (relative to project root)');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), migrationFile);

    try {
        console.log(`Reading migration file: ${filePath}`);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log('Running migration...');
        const result = await query(sql);

        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
