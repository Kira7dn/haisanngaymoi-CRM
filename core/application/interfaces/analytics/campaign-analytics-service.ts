/**
 * Campaign Analytics Service Interface
 *
 * Defines the contract for campaign analytics data access.
 */

import type {
  CampaignAnalytics,
  CampaignComparison,
  PlatformPerformance,
  Platform,
} from "@/core/domain/analytics/campaign-performance";

export interface CampaignAnalyticsQuery {
  campaignId: number;
  startDate?: Date;
  endDate?: Date;
}

export interface CampaignComparisonQuery {
  campaignIds: number[];
  startDate: Date;
  endDate: Date;
}

export interface PlatformPerformanceQuery {
  platform: Platform;
  startDate: Date;
  endDate: Date;
  limit?: number;
}

export interface CampaignAnalyticsService {
  /**
   * Get analytics for a single campaign
   */
  getCampaignAnalytics(query: CampaignAnalyticsQuery): Promise<CampaignAnalytics>;

  /**
   * Compare multiple campaigns side-by-side
   */
  compareCampaigns(query: CampaignComparisonQuery): Promise<CampaignComparison>;

  /**
   * Get platform-specific performance metrics
   */
  getPlatformPerformance(query: PlatformPerformanceQuery): Promise<PlatformPerformance>;
}
