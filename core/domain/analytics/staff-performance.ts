/**
 * Domain Entity: Staff Performance Analytics
 *
 * Contains all business entities and types for staff performance tracking.
 * This is a pure domain layer with no external dependencies.
 */

import { DateRange } from "./revenue-metrics";

/**
 * Staff role types (from AdminUser)
 */
export type StaffRole = "admin" | "sale" | "warehouse";

/**
 * Individual staff performance metrics
 */
export interface StaffPerformance {
  staffId: string;
  staffName: string;
  role: StaffRole;
  period: DateRange;
  metrics: StaffMetrics;
  ranking: number;
}

/**
 * Staff performance metrics
 */
export interface StaffMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number; // Orders / Total customer interactions (future: requires customer care data)
  completionRate: number; // Completed orders / Total assigned orders
}

/**
 * Staff activity log for a specific date
 */
export interface StaffActivity {
  staffId: string;
  staffName: string;
  date: Date;
  ordersProcessed: number;
  ordersCompleted: number;
  ordersCancelled: number;
  totalRevenue: number;
}

/**
 * Team-level performance aggregates
 */
export interface TeamPerformance {
  period: DateRange;
  totalRevenue: number;
  totalOrders: number;
  topPerformers: StaffPerformance[];
  averageMetrics: TeamAverageMetrics;
  staffCount: number;
}

/**
 * Team average metrics
 */
export interface TeamAverageMetrics {
  ordersPerStaff: number;
  revenuePerStaff: number;
  averageOrderValue: number;
  completionRate: number;
}

/**
 * Staff ranking entry for leaderboard
 */
export interface StaffRanking {
  rank: number;
  staffId: string;
  staffName: string;
  role: StaffRole;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  avatar?: string;
}

/**
 * Staff performance trend data point
 */
export interface StaffPerformanceTrend {
  date: Date;
  revenue: number;
  orderCount: number;
  completionRate: number;
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(
  completedOrders: number,
  totalOrders: number
): number {
  if (totalOrders === 0) return 0;
  return (completedOrders / totalOrders) * 100;
}

/**
 * Calculate conversion rate (placeholder for future customer care integration)
 */
export function calculateConversionRate(
  orders: number,
  interactions: number
): number {
  if (interactions === 0) return 0;
  return (orders / interactions) * 100;
}

/**
 * Determine performance tier based on metrics
 */
export type PerformanceTier = "outstanding" | "excellent" | "good" | "average" | "needs_improvement";

export function getPerformanceTier(
  revenueRank: number,
  totalStaff: number
): PerformanceTier {
  const percentile = (revenueRank / totalStaff) * 100;

  if (percentile <= 10) return "outstanding"; // Top 10%
  if (percentile <= 25) return "excellent"; // Top 25%
  if (percentile <= 50) return "good"; // Top 50%
  if (percentile <= 75) return "average"; // Top 75%
  return "needs_improvement"; // Bottom 25%
}

/**
 * Validation functions
 */
export function validateStaffId(staffId: string): string[] {
  const errors: string[] = [];

  if (!staffId || staffId.trim() === "") {
    errors.push("Staff ID is required");
  }

  return errors;
}
