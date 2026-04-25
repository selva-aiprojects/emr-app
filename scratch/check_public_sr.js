
import { query } from './server/db/connection.js';
import fs from 'fs';

async function check() {
    let output = '';
    try {
        output += '--- service_requests in public ---\n';
        const cols = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'service_requests'
        `);
        output += JSON.stringify(cols.rows) + '\n';
    } catch (e) {
        output += 'Check failed: ' + e.message + '\n';
    } finally {
        fs.writeFileSync('scratch/public_sr.txt', output);
        process.exit(0);
    }
}
check();
