
import { query } from './server/db/connection.js';

async function check() {
    try {
        const schemas = await query("SELECT schema_name FROM information_schema.schemata");
        console.log('Schemas:', schemas.rows.map(r => r.schema_name));
        
        const tables = await query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users'");
        console.log('Users tables:', tables.rows);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
check();
