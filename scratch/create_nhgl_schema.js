import { query } from '../server/db/connection.js';

async function createSchema() {
    try {
        console.log('🚀 Creating nhgl schema...');
        // We create the schema so the search_path doesn't fail, 
        // but we'll also fix the connection logic to point to the correct data.
        await query('CREATE SCHEMA IF NOT EXISTS nhgl');
        console.log('✅ nhgl schema created.');
    } catch (err) {
        console.error('❌ Creation failed:', err.message);
    } finally {
        process.exit();
    }
}

createSchema();
