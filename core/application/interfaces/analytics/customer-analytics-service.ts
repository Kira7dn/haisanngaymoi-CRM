/**
 * Customer Analytics Service Interface
 *
 * Defines the contract for customer behavior analytics data access.
 * Repository implementations must implement these methods.
 */

import {
  CustomerMetrics,
  CustomerSegmentStats,
  PurchasePattern,
  CohortRetention,
  ChurnRisk,
  RFMSegment,
  ChurnRiskThresholds,
} from "@/core/domain/analytics/customer-metrics";
import { DateRange } from "@/core/domain/analytics/revenue-metrics";

/**
 * Customer metrics query parameters
 */
export interface CustomerMetricsQuery extends DateRange {}

/**
 * Customer segmentation query parameters
 */
export interface CustomerSegmentationQuery extends DateRange {}

/**
 * Purchase patterns query parameters
 */
export interface PurchasePatternsQuery {
  customerId?: string; // Optional - returns all if not specified
  limit?: number;
}

/**
 * Churn risk customers query parameters
 */
export interface ChurnRiskQuery {
  riskLevel?: ChurnRisk; // Optional - returns all if not specified
  limit: number;
  thresholds?: ChurnRiskThresholds;
}

/**
 * Cohort retention query parameters
 */
export interface CohortRetentionQuery {
  cohortStartDate: Date;
  periods: number; // Number of periods to track (e.g., 12 months)
}

/**
 * RFM analysis query parameters
 */
export interface RFMAnalysisQuery {
  dateRange?: DateRange; // Optional - all time if not specified
  limit?: number;
}

/**
 * Customer Analytics Service Interface
 */
export interface CustomerAnalyticsService {
  /**
   * Get customer metrics for a given period
   */
  getCustomerMetrics(query: CustomerMetricsQuery): Promise<CustomerMetrics>;

  /**
   * Get customer segmentation by tier
   */
  getCustomerSegmentation(query: CustomerSegmentationQuery): Promise<CustomerSegmentStats[]>;

  /**
   * Get purchase patterns for customers
   */
  getPurchasePatterns(query: PurchasePatternsQuery): Promise<PurchasePattern[]>;

  /**
   * Get customers at risk of churning
   */
  getChurnRiskCustomers(query: ChurnRiskQuery): Promise<PurchasePattern[]>;

  /**
   * Get cohort retention analysis
   */
  getCohortRetention(query: CohortRetentionQuery): Promise<CohortRetention>;

  /**
   * Get RFM (Recency, Frequency, Monetary) segmentation
   */
  getRFMSegmentation(query: RFMAnalysisQuery): Promise<RFMSegment[]>;
}
