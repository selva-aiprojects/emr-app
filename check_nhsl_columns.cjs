const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking NHSL Patients Table Column Count ===');
    const result = await query('SELECT column_name FROM information_schema.columns WHERE table_schema = \'nhsl\' AND table_name = \'patients\' ORDER BY ordinal_position');
    console.log('nhsl.patients columns:');
    result.rows.forEach((col, index) => console.log(`${index + 1}. ${col.column_name}`));
    console.log(`\nTotal columns: ${result.rows.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
