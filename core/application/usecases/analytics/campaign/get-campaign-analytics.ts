/**
 * Get Campaign Analytics Use Case
 *
 * Retrieves performance metrics for a single campaign.
 */

import type {
  CampaignAnalytics,
} from "@/core/domain/analytics/campaign-performance";
import {
  validateCampaignId,
  validateDateRange,
} from "@/core/domain/analytics/campaign-performance";
import type {
  CampaignAnalyticsService,
  CampaignAnalyticsQuery,
} from "@/core/application/interfaces/analytics/campaign-analytics-service";

export interface GetCampaignAnalyticsRequest {
  campaignId: number;
  startDate?: Date;
  endDate?: Date;
}

export interface GetCampaignAnalyticsResponse {
  analytics: CampaignAnalytics;
}

export class GetCampaignAnalyticsUseCase {
  constructor(private campaignAnalyticsService: CampaignAnalyticsService) {}

  async execute(
    request: GetCampaignAnalyticsRequest
  ): Promise<GetCampaignAnalyticsResponse> {
    // Validate campaign ID
    const campaignIdErrors = validateCampaignId(request.campaignId);
    if (campaignIdErrors.length > 0) {
      throw new Error(`Validation failed: ${campaignIdErrors.join(", ")}`);
    }

    // Validate date range if provided
    if (request.startDate && request.endDate) {
      const dateErrors = validateDateRange(request.startDate, request.endDate);
      if (dateErrors.length > 0) {
        throw new Error(`Validation failed: ${dateErrors.join(", ")}`);
      }
    }

    // Build query
    const query: CampaignAnalyticsQuery = {
      campaignId: request.campaignId,
      startDate: request.startDate,
      endDate: request.endDate,
    };

    // Get analytics from service
    const analytics = await this.campaignAnalyticsService.getCampaignAnalytics(query);

    return { analytics };
  }
}
