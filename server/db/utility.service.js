/**
 * Utility Functions Service
 * Contains utility functions for dashboard metrics and calculations
 */

import { query } from './connection.js';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function calculatePerformanceScore(weeklyStats) {
  const { 
    appointments, patients, admissions, occupiedBeds, totalBeds, totalRevenue 
  } = weeklyStats;
  
  // Performance indicators (0-100 scale)
  const occupancyScore = Math.min(100, (occupiedBeds / totalBeds) * 100);
  const revenueScore = Math.min(100, (totalRevenue / (totalBeds || 1)) * 100);
  const patientScore = Math.min(100, (patients / (patients || 1)) * 100);
  
  // Weighted average score
  const performanceScore = Math.round((occupancyScore + revenueScore + patientScore) / 3);
  
  return performanceScore;
}

export function calculateUtilizationRate(occupiedBeds, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round((occupiedBeds / totalBeds) * 100);
}

export function calculateRevenuePerBed(totalRevenue, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round(totalRevenue / totalBeds);
}

export function calculateTrend(current, previous) {
  if (!current || !previous) return 'stable';
  const change = current - previous;
  if (Math.abs(change) < 0.1) return 'decreasing';
  if (change > 0.1) return 'increasing';
  return 'stable';
}

export function getPerformanceColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function getTrendColor(current, previous) {
  const change = current - previous;
  if (change > 0.1) return 'text-green-600';
  if (change < -0.1) return 'text-red-600';
  return 'text-amber-600';
}
