// Dashboard Metrics Validation Script
// Validates and reports on dashboard metrics accuracy across all modules

import { getRealtimeDashboardMetrics, getOccupancyRate, getAvailableBeds, getTotalBeds } from '../server/enhanced_dashboard_metrics_fixed.mjs';

const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'; // New Age Hospital

export async function validateDashboardMetrics() {
  try {
    console.log('🔍 Starting comprehensive dashboard metrics validation...');
    
    // Get real-time metrics
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    
    // Cross-validate with individual queries
    const [
      actualOccupiedBeds,
      actualAvailableBeds,
      actualTotalBeds,
      actualOccupancyRate
    ] = await Promise.all([
      getTotalBeds(tenantId),
      getAvailableBeds(tenantId),
      // Occupied beds calculation
      new Promise(async (resolve) => {
        const result = await query(`
          SELECT COUNT(*) FROM emr.beds 
          WHERE tenant_id = $1 AND status = 'occupied'
        `);
        resolve(result.rows[0]?.count || 0);
      }),
      getOccupancyRate(tenantId)
    ]);
    
    // Validation results
    const validationResults = {
      // Bed Management Validation
      bedManagement: {
        totalBeds: {
          realtime: metrics.totalBeds,
          calculated: actualTotalBeds,
          match: metrics.totalBeds === actualTotalBeds,
          difference: Math.abs(metrics.totalBeds - actualTotalBeds)
        },
        occupiedBeds: {
          realtime: metrics.occupiedBeds,
          calculated: actualOccupiedBeds,
          match: metrics.occupiedBeds === actualOccupiedBeds,
          difference: Math.abs(metrics.occupiedBeds - actualOccupiedBeds)
        },
        availableBeds: {
          realtime: metrics.availableBeds,
          calculated: actualAvailableBeds,
          match: metrics.availableBeds === actualAvailableBeds,
          difference: Math.abs(metrics.availableBeds - actualAvailableBeds)
        },
        occupancyRate: {
          realtime: metrics.occupancyRate,
          calculated: actualOccupancyRate,
          match: Math.abs(metrics.occupancyRate - actualOccupancyRate) < 1,
          difference: Math.abs(metrics.occupancyRate - actualOccupancyRate)
        }
      },
      
      // Lab Module Validation
      labModule: {
        criticalLabResults: {
          realtime: metrics.criticalLabResults,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.service_requests 
              WHERE tenant_id = $1 AND category = 'lab' 
              AND notes::jsonb->>'criticalFlag' = 'true' 
              AND DATE(created_at) >= CURRENT_DATE - INTERVAL '24 hours'
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      },
        totalLabOrders: {
          realtime: metrics.todayAppointments,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.service_requests 
              WHERE tenant_id = $1 AND category = 'lab' 
              AND DATE(created_at) = CURRENT_DATE
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      },
      
      // Pharmacy Module Validation
      pharmacyModule: {
        lowStockItems: {
          realtime: metrics.lowStockItems,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced 
              WHERE tenant_id = $1 AND current_stock <= minimum_stock_level AND status = 'ACTIVE'
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      },
      expiringItems: {
        realtime: metrics.expiringItems,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced 
              WHERE tenant_id = $1 AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE'
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      },
      emergencyDispensing: {
        realtime: metrics.emergencyDispensing,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.pharmacy_dispensing_log 
              WHERE tenant_id = $1 AND emergency_dispensing = true 
              AND DATE(dispensing_date) = CURRENT_DATE
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      },
      
      // Patient Module Validation
      patientModule: {
        todayPatients: {
          realtime: metrics.todayPatients,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.patients 
              WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      },
      
      // Revenue Module Validation
      revenueModule: {
        todayRevenue: {
          realtime: metrics.todayRevenue,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COALESCE(SUM(amount), 0) as total
              FROM emr.invoices 
              WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'
            `);
            resolve(parseFloat(result.rows[0]?.total || 0));
          }),
          match: false // Will be calculated after direct query
        }
      },
      
      // Appointment Module Validation
      appointmentModule: {
        todayAppointments: {
          realtime: metrics.todayAppointments,
          // Cross-check with direct query
          directQuery: await new Promise(async (resolve) => {
            const result = await query(`
              SELECT COUNT(*) FROM emr.appointments 
              WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE
            `);
            resolve(result.rows[0]?.count || 0);
          }),
          match: false // Will be calculated after direct query
        }
      }
    };
    
    // Wait for all direct queries to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update validation results with direct query results
    validationResults.bedManagement.occupiedBeds.calculated = actualOccupiedBeds;
    validationResults.bedManagement.occupiedBeds.match = metrics.occupiedBeds === actualOccupiedBeds;
    
    validationResults.labModule.criticalLabResults.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.service_requests 
        WHERE tenant_id = $1 AND category = 'lab' 
        AND notes::jsonb->>'criticalFlag' = 'true' 
        AND DATE(created_at) >= CURRENT_DATE - INTERVAL '24 hours'
      `);
      return result.rows[0]?.count || 0;
    });
    
    validationResults.labModule.totalLabOrders.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.service_requests 
        WHERE tenant_id = $1 AND category = 'lab' 
        AND DATE(created_at) = CURRENT_DATE
      `);
      return result.rows[0]?.count || 0;
    });
    
    validationResults.pharmacyModule.lowStockItems.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced 
        WHERE tenant_id = $1 AND current_stock <= minimum_stock_level AND status = 'ACTIVE'
      `);
      return result.rows[0]?.count || 0;
    });
    
    validationResults.pharmacyModule.expiringItems.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced 
        WHERE tenant_id = $1 AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE'
      `);
      return result.rows[0]?.count || 0;
    });
    
    validationResults.pharmacyModule.emergencyDispensing.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.pharmacy_dispensing_log 
        WHERE tenant_id = $1 AND emergency_dispensing = true 
        AND DATE(dispensing_date) = CURRENT_DATE
      `);
      return result.rows[0]?.count || 0;
    });
    
    validationResults.patientModule.todayPatients.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.patients 
        WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
      `);
      return result.rows[0]?.count || 0;
    });
    
    validationResults.revenueModule.todayRevenue.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM emr.invoices 
        WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'
      `);
      return parseFloat(result.rows[0]?.total || 0);
    });
    
    validationResults.appointmentModule.todayAppointments.directQuery = await new Promise(async (resolve) => {
      const result = await query(`
        SELECT COUNT(*) FROM emr.appointments 
        WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE
      `);
      return result.rows[0]?.count || 0;
    });
    
    // Update match status
    validationResults.labModule.criticalLabResults.match = metrics.criticalLabResults === validationResults.labModule.criticalLabResults.directQuery;
    validationResults.labModule.totalLabOrders.match = metrics.todayAppointments === validationResults.labModule.totalLabOrders.directQuery;
    validationResults.pharmacyModule.lowStockItems.match = metrics.lowStockItems === validationResults.pharmacyModule.lowStockItems.directQuery;
    validationResults.pharmacyModule.expiringItems.match = metrics.expiringItems === validationResults.pharmacyModule.expiringItems.directQuery;
    validationResults.pharmacyModule.emergencyDispensing.match = metrics.emergencyDispensing === validationResults.pharmacyModule.emergencyDispensing.directQuery;
    validationResults.patientModule.todayPatients.match = metrics.todayPatients === validationResults.patientModule.todayPatients.directQuery;
    validationResults.revenueModule.todayRevenue.match = metrics.todayRevenue === validationResults.revenueModule.todayRevenue.directQuery;
    validationResults.appointmentModule.todayAppointments.match = metrics.todayAppointments === validationResults.appointmentModule.todayAppointments.directQuery;
    
    // Calculate overall accuracy score
    const accuracyScore = calculateAccuracyScore(validationResults);
    
    console.log('✅ Dashboard metrics validation completed:', validationResults);
    console.log('📊 Overall accuracy score:', accuracyScore);
    
    return {
      validationResults,
      accuracyScore,
      summary: generateValidationSummary(validationResults, accuracyScore)
    };
    
  } catch (error) {
    console.error('❌ Error validating dashboard metrics:', error);
    throw error;
  }
}

// Calculate accuracy score (0-100)
function calculateAccuracyScore(validationResults) {
  let totalChecks = 0;
  let passedChecks = 0;
  
  // Check all validation results
  Object.values(validationResults).forEach(moduleResults => {
    if (typeof moduleResults === 'object') {
      Object.values(moduleResults).forEach(result => {
        if (typeof result === 'object') {
          totalChecks++;
          if (result.match) {
            passedChecks++;
          }
        }
      });
    }
  });
  
  return totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
}

// Generate validation summary
function generateValidationSummary(validationResults, accuracyScore) {
  const summary = {
    overall: {
      score: accuracyScore,
      status: accuracyScore >= 90 ? 'EXCELLENT' : accuracyScore >= 70 ? 'GOOD' : accuracyScore >= 50 ? 'FAIR' : 'POOR',
      totalChecks: 0,
      passedChecks: 0
    },
    modules: {},
    recommendations: []
  };
  
  // Calculate overall stats
  Object.entries(validationResults).forEach(([moduleName, moduleResults]) => {
    if (typeof moduleResults === 'object') {
      let moduleTotalChecks = 0;
      let modulePassedChecks = 0;
      
      Object.entries(moduleResults).forEach(([metricName, result]) => {
        if (typeof result === 'object') {
          moduleTotalChecks++;
          if (result.match) {
            modulePassedChecks++;
          }
        }
      });
      
      summary.modules[moduleName] = {
        score: moduleTotalChecks > 0 ? Math.round((modulePassedChecks / moduleTotalChecks) * 100) : 0,
        status: moduleTotalChecks > 0 ? 
          (modulePassedChecks / moduleTotalChecks) * 100 >= 90 ? 'EXCELLENT' :
          (modulePassedChecks / moduleTotalChecks) * 100 >= 70 ? 'GOOD' :
          (modulePassedChecks / moduleTotalChecks) * 100 >= 50 ? 'FAIR' : 'POOR'
        : 'NOT_TESTED',
        totalChecks: moduleTotalChecks,
        passedChecks: modulePassedChecks
      };
      
      summary.overall.totalChecks += moduleTotalChecks;
      summary.overall.passedChecks += modulePassedChecks;
    }
  });
  
  // Generate recommendations
  if (accuracyScore < 90) {
    summary.recommendations.push('Consider reviewing data synchronization processes');
    summary.recommendations.push('Verify database connections and query performance');
    summary.recommendations.push('Check for data consistency issues');
  }
  
  if (validationResults.bedManagement.occupancyRate.difference > 5) {
    summary.recommendations.push('Bed occupancy rate calculation needs attention');
  }
  
  if (validationResults.labModule.criticalLabResults.difference > 2) {
    summary.recommendations.push('Critical lab results tracking may be inaccurate');
  }
  
  if (validationResults.pharmacyModule.lowStockItems.difference > 3) {
    summary.recommendations.push('Pharmacy low stock alerts may be delayed');
  }
  
  return summary;
}

// Export validation function for API usage
export async function validateAndReportMetrics(tenantId) {
  try {
    const validation = await validateDashboardMetrics();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      tenantId,
      accuracy: validation.accuracyScore,
      status: validation.accuracyScore >= 80 ? 'HEALTHY' : 'NEEDS_ATTENTION',
      results: validation.validationResults,
      summary: validation.summary,
      recommendations: validation.summary.recommendations
    };
    
  } catch (error) {
    console.error('❌ Error in dashboard metrics validation:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Quick validation function
export async function quickValidation(tenantId) {
  try {
    console.log('⚡ Running quick dashboard validation...');
    
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    
    // Quick checks
    const quickChecks = {
      beds: {
        total: metrics.totalBeds,
        occupied: metrics.occupiedBeds,
        available: metrics.availableBeds,
        occupancyRate: metrics.totalBeds > 0 ? Math.round((metrics.occupiedBeds / metrics.totalBeds) * 100) : 0
      },
      lab: {
        criticalResults: metrics.criticalLabResults,
        totalOrders: metrics.todayAppointments
      },
      pharmacy: {
        lowStock: metrics.lowStockItems,
        expiring: metrics.expiringItems,
        emergencyDispensing: metrics.emergencyDispensing
      },
      revenue: {
        today: metrics.todayRevenue
      },
      patients: {
        today: metrics.todayPatients
      },
      appointments: {
        today: metrics.todayAppointments
      }
    };
    
    console.log('✅ Quick validation completed:', quickChecks);
    return quickChecks;
    
  } catch (error) {
    console.error('❌ Error in quick validation:', error);
    throw error;
  }
}
