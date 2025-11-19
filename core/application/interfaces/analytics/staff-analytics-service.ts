/**
 * Staff Analytics Service Interface
 *
 * Defines the contract for staff performance analytics data access.
 * Repository implementations must implement these methods.
 */

import {
  StaffPerformance,
  TeamPerformance,
  StaffRanking,
  StaffActivity,
  StaffPerformanceTrend,
} from "@/core/domain/analytics/staff-performance";
import { DateRange } from "@/core/domain/analytics/revenue-metrics";

/**
 * Staff performance query parameters
 */
export interface StaffPerformanceQuery extends DateRange {
  staffId: string;
}

/**
 * Team performance query parameters
 */
export interface TeamPerformanceQuery extends DateRange {
  topPerformersLimit?: number; // Default 10
}

/**
 * Staff ranking query parameters
 */
export interface StaffRankingQuery extends DateRange {
  limit?: number;
}

/**
 * Staff activity query parameters
 */
export interface StaffActivityQuery extends DateRange {
  staffId?: string; // Optional - returns all staff if not specified
}

/**
 * Staff performance trend query parameters
 */
export interface StaffPerformanceTrendQuery extends DateRange {
  staffId: string;
  granularity: "day" | "week" | "month";
}

/**
 * Staff Analytics Service Interface
 */
export interface StaffAnalyticsService {
  /**
   * Get performance metrics for a specific staff member
   */
  getStaffPerformance(query: StaffPerformanceQuery): Promise<StaffPerformance>;

  /**
   * Get team-level performance aggregates
   */
  getTeamPerformance(query: TeamPerformanceQuery): Promise<TeamPerformance>;

  /**
   * Get staff ranking leaderboard
   */
  getStaffRanking(query: StaffRankingQuery): Promise<StaffRanking[]>;

  /**
   * Get staff activity logs
   */
  getStaffActivity(query: StaffActivityQuery): Promise<StaffActivity[]>;

  /**
   * Get staff performance trend over time
   */
  getStaffPerformanceTrend(query: StaffPerformanceTrendQuery): Promise<StaffPerformanceTrend[]>;
}
