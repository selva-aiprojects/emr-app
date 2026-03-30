// Enhanced Dashboard Metrics with Real-time Data
// This script fixes dashboard metrics to calculate from actual database records

import { query } from './db/connection.js';

export async function getRealtimeDashboardMetrics(tenantId) {
  try {
    console.log('🔍 Calculating real-time dashboard metrics...');
    
    // Get current time-based metrics
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Calculate today's metrics from database
    const [
      todayAppointments,
      todayRevenue,
      todayPatients,
      todayAdmissions,
      todayDischarges,
      occupiedBeds,
      availableBeds,
      totalBeds,
      criticalLabResults,
      lowStockItems,
      expiringItems,
      emergencyDispensing
    ] = await Promise.all([
      // Today's appointments
      query(`
        SELECT COUNT(*) as count
        FROM emr.appointments 
        WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE
      `, [tenantId]),
      
      // Today's revenue
      query(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM emr.invoices 
        WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'
      `, [tenantId]),
      
      // Today's patients
      query(`
        SELECT COUNT(*) as count
        FROM emr.patients 
        WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
      `, [tenantId]),
      
      // Today's admissions (using encounters table)
      query(`
        SELECT COUNT(*) as count
        FROM emr.encounters 
        WHERE tenant_id = $1 AND DATE(visit_date) = CURRENT_DATE AND encounter_type = 'admission'
      `, [tenantId]),
      
      // Today's discharges (using encounters table)
      query(`
        SELECT COUNT(*) as count
        FROM emr.encounters 
        WHERE tenant_id = $1 AND DATE(visit_date) = CURRENT_DATE AND encounter_type = 'discharge'
      `, [tenantId]),
      
      // Occupied beds
      query(`
        SELECT COUNT(*) as count
        FROM emr.beds 
        WHERE tenant_id = $1 AND status = 'occupied'
      `, [tenantId]),
      
      // Available beds
      query(`
        SELECT COUNT(*) as count
        FROM emr.beds 
        WHERE tenant_id = $1 AND status != 'occupied'
      `, [tenantId]),
      
      // Total beds
      query(`
        SELECT COUNT(*) as count
        FROM emr.beds 
        WHERE tenant_id = $1
      `, [tenantId]),
      
      // Critical lab results
      query(`
        SELECT COUNT(*) as count
        FROM emr.service_requests 
        WHERE tenant_id = $1 AND category = 'lab' AND notes::jsonb->>'criticalFlag' = 'true' AND DATE(created_at) >= CURRENT_DATE - INTERVAL '24 hours'
      `, [tenantId])
    ]);
    
    const metrics = {
      todayAppointments: todayAppointments.rows[0]?.count || 0,
      todayRevenue: parseFloat(todayRevenue.rows[0]?.total || 0),
      todayPatients: todayPatients.rows[0]?.count || 0,
      todayAdmissions: todayAdmissions.rows[0]?.count || 0,
      todayDischarges: todayDischarges.rows[0]?.count || 0,
      occupiedBeds: occupiedBeds.rows[0]?.count || 0,
      availableBeds: availableBeds.rows[0]?.count || 0,
      totalBeds: totalBeds.rows[0]?.count || 0,
      criticalLabResults: criticalLabResults.rows[0]?.count || 0
    };
    
    console.log('✅ Real-time metrics calculated:', metrics);
    return metrics;
    
  } catch (error) {
    console.error('❌ Error calculating dashboard metrics:', error);
    throw error;
  }
}

export async function getOccupancyRate(tenantId) {
  try {
    const result = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) * 100.0 / 
        COUNT(*) * 100.0
      FROM emr.beds 
      WHERE tenant_id = $1
    `);
    
    return result.rows[0]?.occupancy_rate || 0;
  } catch (error) {
    console.error('❌ Error calculating occupancy rate:', error);
    throw error;
  }
}

export async function getAvailableBeds(tenantId) {
  try {
    const result = await query(`
      SELECT COUNT(*) FROM emr.beds 
      WHERE tenant_id = $1 AND status != 'occupied'
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting available beds:', error);
    throw error;
  }
}

export async function getTotalBeds(tenantId) {
  try {
    const result = await query(`
      SELECT COUNT(*) FROM emr.beds 
      WHERE tenant_id = $1
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting total beds:', error);
    throw error;
  }
}

export async function getCriticalLabResults(tenantId) {
  try {
    const result = await query(`
      SELECT COUNT(*) FROM emr.service_requests 
      WHERE tenant_id = $1 AND category = 'lab' AND notes::jsonb->>'criticalFlag' = 'true'
      AND DATE(created_at) >= CURRENT_DATE - INTERVAL '24 hours'
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting critical lab results:', error);
    throw error;
  }
}

export async function getLowStockItems(tenantId) {
  try {
    const result = await query(`
      SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced 
      WHERE tenant_id = $1 AND current_stock <= minimum_stock_level AND status = 'ACTIVE'
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting low stock items:', error);
    throw error;
  }
}

export async function getExpiringItems(tenantId) {
  try {
    const result = await query(`
      SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced 
      WHERE tenant_id = $1 AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE'
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting expiring items:', error);
    throw error;
  }
}

export async function getEmergencyDispensing(tenantId) {
  try {
    const result = await query(`
      SELECT COUNT(*) FROM emr.pharmacy_dispensing_log 
      WHERE tenant_id = $1 AND emergency_dispensing = true
      AND DATE(dispensing_date) = CURRENT_DATE
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting emergency dispensing count:', error);
    throw error;
  }
}

export async function getTodayAppointments(tenantId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT COUNT(*) FROM emr.appointments 
      WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting today appointments:', error);
    throw error;
  }
}

export async function getTodayRevenue(tenantId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM emr.invoices 
      WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'
    `);
    
    return parseFloat(result.rows[0]?.total || 0);
  } catch (error) {
    console.error('❌ Error getting today revenue:', error);
    throw error;
  }
}

export async function getTodayPatients(tenantId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT COUNT(*) FROM emr.patients 
      WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting today patients:', error);
    throw error;
  }
}

export async function getTodayAdmissions(tenantId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT COUNT(*) FROM emr.admissions 
      WHERE tenant_id = $1 AND DATE(admission_date) = CURRENT_DATE AND status = 'active'
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting today admissions:', error);
    throw error;
  }
}

export async function getTodayDischarges(tenantId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT COUNT(*) FROM emr.invoices 
      WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'unpaid'
    `);
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting today discharges:', error);
    throw error;
  }
}

// Calculate occupancy rate
export function calculateOccupancyRate(occupiedBeds, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round((occupiedBeds / totalBeds) * 100);
}

// Calculate availability rate
export function calculateAvailabilityRate(availableBeds, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round((availableBeds / totalBeds) * 100);
}

// Calculate performance score
export function calculatePerformanceScore(weeklyStats) {
  const { 
    appointments, patients, admissions, occupiedBeds, totalBeds, totalRevenue 
  } = weeklyStats;
  
  // Performance indicators (0-100 scale)
  const occupancyScore = Math.min(100, (occupiedBeds / totalBeds) * 100);
  const revenueScore = Math.min(100, (totalRevenue / (totalBeds || 1)) * 100);
  const patientScore = Math.min(100, (patients / (totalPatients || 1)) * 100);
  
  // Weighted average score
  const performanceScore = Math.round((occupancyScore + revenueScore + patientScore) / 3);
  
  return performanceScore;
}

// Calculate utilization rate
export function calculateUtilizationRate(occupiedBeds, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round((occupiedBeds / totalBeds) * 100);
}

// Calculate revenue per bed
export function calculateRevenuePerBed(totalRevenue, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round(totalRevenue / totalBeds);
}

// Calculate trends
export function calculateTrend(current, previous) {
  if (!current || !previous) return 'stable';
  const change = current - previous;
  if (Math.abs(change) < 0.1) return 'decreasing';
  if (change > 0.1) return 'increasing';
  return 'stable';
}

// Performance color coding
export function getPerformanceColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

// Trend color coding
export function getTrendColor(current, previous) {
  const change = current - previous;
  if (change > 0.1) return 'text-green-600';
  if (change < -0.1) return 'text-red-600';
  return 'text-slate-600';
}

// Utilization color coding
export function getUtilizationColor(rate) {
  if (rate >= 90) return 'text-green-600';
  if (rate >= 70) return 'text-emerald-600';
  if (rate >= 50) return 'text-amber-600';
  return 'text-red-600';
}
