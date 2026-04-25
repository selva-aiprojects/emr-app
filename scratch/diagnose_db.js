
import { query } from './server/db/connection.js';
import fs from 'fs';

async function check() {
    let output = '';
    try {
        output += '--- current_schema ---\n';
        const schema = await query('SELECT current_schema()');
        output += JSON.stringify(schema.rows) + '\n';

        output += '--- search_path ---\n';
        const path = await query('SHOW search_path');
        output += JSON.stringify(path.rows) + '\n';

        output += '--- tables in nexus ---\n';
        const nexusTables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'nexus'");
        output += JSON.stringify(nexusTables.rows) + '\n';

        output += '--- tables in nah ---\n';
        const nahTables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'nah'");
        output += JSON.stringify(nahTables.rows) + '\n';

    } catch (e) {
        output += 'Check failed: ' + e.message + '\n';
    } finally {
        fs.writeFileSync('scratch/db_state.txt', output);
        process.exit(0);
    }
}
check();
