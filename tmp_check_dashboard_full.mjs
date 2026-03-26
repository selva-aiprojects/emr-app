import { query } from './server/db/connection.js';
async function run() {
  const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';
  try {
    const statsResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM emr.patients WHERE tenant_id = $1) as total_patients,
        (SELECT COUNT(*) FROM emr.appointments WHERE tenant_id = $1) as total_appointments,
        (SELECT SUM(total) FROM emr.invoices WHERE tenant_id = $1 AND status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM emr.encounters WHERE tenant_id = $1 AND encounter_type = 'IPD' AND DATE(visit_date) = CURRENT_DATE) as admitted_today,
        (SELECT COUNT(*) FROM emr.encounters WHERE tenant_id = $1 AND encounter_type = 'IPD' AND status = 'closed' AND DATE(updated_at) = CURRENT_DATE) as discharged_today,
        (SELECT COUNT(*) FROM emr.encounters WHERE tenant_id = $1 AND encounter_type = 'Emergency' AND status = 'open') as critical_alerts
      `,
      [tenantId]
    );
    console.log('Stats:', statsResult.rows[0]);

    const patientStats = await query(`
        SELECT 
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_patients,
          COUNT(CASE WHEN created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as returning_patients
        FROM emr.patients 
        WHERE tenant_id = $1
      `, [tenantId]);
    console.log('Patient Stats:', patientStats.rows[0]);

    const appointmentStats = await query(`
        SELECT 
          COUNT(CASE WHEN status = 'scheduled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as scheduled_today,
          COUNT(CASE WHEN status = 'completed' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as completed_today,
          COUNT(CASE WHEN status = 'cancelled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as cancelled_today,
          COUNT(CASE WHEN status = 'no-show' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as no_show_today
        FROM emr.appointments 
        WHERE tenant_id = $1
      `, [tenantId]);
    console.log('Appointment Stats:', appointmentStats.rows[0]);

    const topServicesResult = await query(`
      SELECT description as name, SUM(total) as value
      FROM emr.invoices
      WHERE tenant_id = $1 AND description IS NOT NULL AND description != ''
      GROUP BY description
      ORDER BY value DESC
      LIMIT 10
    `, [tenantId]);
    console.log('Top Services:', topServicesResult.rows);

  } catch(e) {
    console.error('FAILED AT:', e.message);
  }
}
run().catch(console.error).finally(() => process.exit(0));
