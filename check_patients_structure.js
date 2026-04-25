import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Structure of nexus.patients:');
    const columns = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients' AND table_schema = 'nexus' ORDER BY ordinal_position");
    console.log(JSON.stringify(columns.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
