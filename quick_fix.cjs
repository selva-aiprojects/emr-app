const { query } = require('./server/db/connection.js');

(async () => {
  const nhslId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
  const doctors = await query('SELECT COUNT(*) as count FROM nhsl.employees WHERE tenant_id = $1 AND (lower(designation) LIKE \'%doctor%\' OR lower(designation) LIKE \'%consultant%\' OR lower(designation) LIKE \'%physician%\' OR lower(designation) LIKE \'%surgeon%\')', [nhslId]);
  await query('UPDATE emr.management_tenant_metrics SET doctors_count = $1 WHERE tenant_id = $2', [doctors.rows[0].count, nhslId]);
  console.log('NHSL doctors updated:', doctors.rows[0].count);
})();
