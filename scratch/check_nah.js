
import { query } from './server/db/connection.js';
import fs from 'fs';

async function check() {
    let output = '';
    try {
        output += '--- NAH in management_tenants ---\n';
        const res = await query("SELECT id, name, code, schema_name FROM nexus.management_tenants WHERE UPPER(code) = 'NAH'");
        output += JSON.stringify(res.rows) + '\n';
    } catch (e) {
        output += 'Check failed: ' + e.message + '\n';
    } finally {
        fs.writeFileSync('scratch/nah_check.txt', output);
        process.exit(0);
    }
}
check();
