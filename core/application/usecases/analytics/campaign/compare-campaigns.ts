/**
 * Compare Campaigns Use Case
 *
 * Compares performance metrics across multiple campaigns.
 */

import type {
  CampaignComparison,
} from "@/core/domain/analytics/campaign-performance";
import {
  validateDateRange,
} from "@/core/domain/analytics/campaign-performance";
import type {
  CampaignAnalyticsService,
  CampaignComparisonQuery,
} from "@/core/application/interfaces/analytics/campaign-analytics-service";

export interface CompareCampaignsRequest {
  campaignIds: number[];
  startDate: Date;
  endDate: Date;
}

export interface CompareCampaignsResponse {
  comparison: CampaignComparison;
}

export class CompareCampaignsUseCase {
  constructor(private campaignAnalyticsService: CampaignAnalyticsService) {}

  async execute(
    request: CompareCampaignsRequest
  ): Promise<CompareCampaignsResponse> {
    // Validate campaign IDs
    if (!request.campaignIds || request.campaignIds.length === 0) {
      throw new Error("At least one campaign ID is required");
    }

    if (request.campaignIds.length > 10) {
      throw new Error("Cannot compare more than 10 campaigns at once");
    }

    // Validate all campaign IDs are positive numbers
    for (const id of request.campaignIds) {
      if (typeof id !== "number" || id <= 0) {
        throw new Error("All campaign IDs must be positive numbers");
      }
    }

    // Validate date range
    const dateErrors = validateDateRange(request.startDate, request.endDate);
    if (dateErrors.length > 0) {
      throw new Error(`Validation failed: ${dateErrors.join(", ")}`);
    }

    // Build query
    const query: CampaignComparisonQuery = {
      campaignIds: request.campaignIds,
      startDate: request.startDate,
      endDate: request.endDate,
    };

    // Get comparison from service
    const comparison = await this.campaignAnalyticsService.compareCampaigns(query);

    return { comparison };
  }
}
