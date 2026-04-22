import express from 'express';
import * as repo from '../db/repository.js';
import { query, calculatePerformanceScore } from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';
import { getRealtimeDashboardMetrics } from '../enhanced_dashboard_metrics_fixed.mjs';
import { queryWithTenantSchema } from '../utils/tenant-schema-helper.js';

const router = express.Router();

// Apply common middleware to all report routes
router.use(authenticate);
router.use(requireTenant);
router.use(requirePermission('reports'));
router.use(moduleGate('reports'));

/**
 * @route   GET /api/reports/summary
 * @desc    Get high-level clinical and operational summary
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await repo.getReportSummary(req.tenantId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ error: 'Failed to fetch report summary' });
  }
});

/**
 * @route   GET /api/reports/payouts
 * @desc    Get doctor payout calculations
 */
router.get('/payouts', async (req, res) => {
  try {
    const payouts = await repo.getDoctorPayouts(req.tenantId);
    res.json(payouts);
  } catch (error) {
    console.error('Error fetching doctor payouts:', error);
    res.status(500).json({ error: 'Failed to fetch doctor payouts' });
  }
});

/**
 * @route   GET /api/reports/financials
 * @desc    Get detailed financial reports
 */
router.get('/financials', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 8) + '01';
    const summary = await repo.getFinancialSummary(req.tenantId, month);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financials:', error);
    res.status(500).json({ error: 'Failed to fetch financials' });
  }
});

/**
 * @route   GET /api/reports/dashboard/metrics
 * @desc    Get real-time operational and clinical dashboard metrics
 */
router.get('/dashboard/metrics', requirePermission('dashboard'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { timeFilter = 'daily' } = req.query;
    const metrics = await getRealtimeDashboardMetrics(tenantId);

    // Helper for safe query execution inside this route
    const safeQuery = async (q, p) => {
      try { 
        // Use queryWithTenantSchema for queries with {schema} placeholder
        if (q.includes('{schema}')) {
          return await queryWithTenantSchema(tenantId, q, p);
        }
        return await query(q, p); 
      }
      catch (e) { return { rows: [] }; }
    };

    // Get additional statistics for enhanced dashboard
    // We use safeQuery to ensure one missing table doesn't crash the whole reporting suite
    // Combine basic counts into fewer queries to save connection pool cycles
    const [coreStats, detailStats, doctorsResult, staffStatsResult] = await Promise.all([
      // Basic counts combined
      safeQuery(`
        SELECT 
          (SELECT COUNT(*)::int FROM {schema}.patients WHERE tenant_id = $1) as total_patients,
          (SELECT COUNT(*)::int FROM {schema}.appointments WHERE tenant_id = $1) as total_appointments,
          (SELECT COALESCE(SUM(total), 0) FROM {schema}.invoices WHERE tenant_id = $1 AND status IN ('paid', 'partially_paid')) as total_revenue,
          (SELECT COUNT(*)::int FROM {schema}.beds WHERE tenant_id = $1 AND status = 'occupied') as occupied_beds,
          (SELECT COUNT(*)::int FROM {schema}.beds WHERE tenant_id = $1) as total_beds
      `, [tenantId]),

      // Daily trends combined
      safeQuery(`
        SELECT 
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int as new_patients,
          COUNT(CASE WHEN status = 'scheduled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END)::int as scheduled_today,
          COUNT(CASE WHEN status = 'completed' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END)::int as completed_today
        FROM {schema}.patients p
        LEFT JOIN {schema}.appointments a ON a.tenant_id = p.tenant_id
        WHERE p.tenant_id = $1
      `, [tenantId]),

      safeQuery(`
        SELECT u.id, u.name, u.role, COUNT(a.id)::int as consultations
        FROM emr.users u
        LEFT JOIN {schema}.appointments a ON a.provider_id = u.id AND a.tenant_id = u.tenant_id
        WHERE u.tenant_id = $1 AND lower(u.role) = 'doctor'
        GROUP BY u.id, u.name, u.role
        LIMIT 5
      `, [tenantId]),

      safeQuery(`SELECT designation as name, COUNT(*)::int as count FROM {schema}.employees WHERE tenant_id = $1 GROUP BY designation LIMIT 10`, [tenantId])
    ]);

    const stats = coreStats?.rows?.[0] || {};
    const daily = detailStats?.rows?.[0] || {};

    // Trend queries can sometimes be expensive/fail, so we wrap them individually if needed
    const revenueTrendResult = await safeQuery(`
        SELECT TO_CHAR(gs, 'Mon') as label, COALESCE(SUM(i.total), 0) as value
        FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') gs
        LEFT JOIN {schema}.invoices i ON date_trunc('month', i.created_at) = gs AND i.tenant_id = $1 AND i.status IN ('paid', 'partially_paid')
        GROUP BY gs ORDER BY gs
      `, [tenantId]);

    const patientTrendResult = await safeQuery(`
        SELECT TO_CHAR(gs, 'Mon') as label, 
               COUNT(p.id) FILTER (WHERE date_trunc('month', p.created_at) = gs) as value1
        FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') gs
        LEFT JOIN {schema}.patients p ON date_trunc('month', p.created_at) = gs AND p.tenant_id = $1
        GROUP BY gs ORDER BY gs
      `, [tenantId]);

    const noShowTrendResult = await safeQuery(`
        SELECT TO_CHAR(gs, 'DD Mon') as label, 
               COUNT(a.id) FILTER (WHERE lower(a.status) = 'no-show') as "noShow"
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
        LEFT JOIN {schema}.appointments a ON DATE(a.scheduled_start) = gs AND a.tenant_id = $1
        GROUP BY gs ORDER BY gs
      `, [tenantId]);

    const topDiagnosesResult = await safeQuery(`SELECT diagnosis as name, COUNT(*)::int as value FROM {schema}.encounters WHERE tenant_id = $1 AND diagnosis IS NOT NULL GROUP BY diagnosis ORDER BY value DESC LIMIT 10`, [tenantId]);
    const topServicesResult = await safeQuery(`SELECT category as name, COUNT(*)::int as value FROM {schema}.service_requests WHERE tenant_id = $1 AND category IS NOT NULL GROUP BY category ORDER BY value DESC LIMIT 8`, [tenantId]);

    // Safety mapping for optimized results
    const totalPatients = parseInt(stats.total_patients || 0);
    const totalAppointments = parseInt(stats.total_appointments || 0);
    const totalRevenue = parseFloat(stats.total_revenue || 0);
    const occupancyRate = stats.total_beds > 0 ? Math.round((stats.occupied_beds / stats.total_beds) * 100) : 0;

    const response = {
      ...metrics,
      totalPatients,
      totalAppointments,
      totalRevenue,
      patientStats: { new_patients: daily.new_patients || 0, returning_patients: 0 },
      appointmentStats: { 
        scheduled_today: daily.scheduled_today || 0, 
        completed_today: daily.completed_today || 0, 
        cancelled_today: 0, 
        no_show_today: 0 
      },
      bedOccupancy: { 
        occupied: stats.occupied_beds || 0,
        available: (stats.total_beds || 0) - (stats.occupied_beds || 0),
        total: stats.total_beds || 0, 
        occupancy_rate: occupancyRate 
      },
      departmentDistribution: [],
      doctors: doctorsResult?.rows || [],
      masterStats: { departments: 0, wards: 0, beds: stats.total_beds || 0, services: 0, total_staff: 0 },
      revenueTrend: revenueTrendResult?.rows || [],
      patientTrend: patientTrendResult?.rows || [],
      noShowTrend: noShowTrendResult?.rows || [],
      topDiagnoses: topDiagnosesResult?.rows || [],
      topServices: topServicesResult?.rows || [],
      staffStats: staffStatsResult?.rows || [],
      patientJourney: [],
      performanceScore: metrics ? calculatePerformanceScore(metrics) : 0,
      lastUpdated: new Date().toISOString(),
      timeFilter
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

export default router;
