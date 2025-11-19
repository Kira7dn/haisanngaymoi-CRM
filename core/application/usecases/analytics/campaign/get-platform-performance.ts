/**
 * Get Platform Performance Use Case
 *
 * Retrieves performance metrics for a specific platform.
 */

import type {
  PlatformPerformance,
  Platform,
} from "@/core/domain/analytics/campaign-performance";
import {
  validatePlatform,
  validateDateRange,
} from "@/core/domain/analytics/campaign-performance";
import type {
  CampaignAnalyticsService,
  PlatformPerformanceQuery,
} from "@/core/application/interfaces/analytics/campaign-analytics-service";

export interface GetPlatformPerformanceRequest {
  platform: Platform;
  startDate: Date;
  endDate: Date;
  limit?: number;
}

export interface GetPlatformPerformanceResponse {
  performance: PlatformPerformance;
}

export class GetPlatformPerformanceUseCase {
  constructor(private campaignAnalyticsService: CampaignAnalyticsService) {}

  async execute(
    request: GetPlatformPerformanceRequest
  ): Promise<GetPlatformPerformanceResponse> {
    // Validate platform
    const platformErrors = validatePlatform(request.platform);
    if (platformErrors.length > 0) {
      throw new Error(`Validation failed: ${platformErrors.join(", ")}`);
    }

    // Validate date range
    const dateErrors = validateDateRange(request.startDate, request.endDate);
    if (dateErrors.length > 0) {
      throw new Error(`Validation failed: ${dateErrors.join(", ")}`);
    }

    // Validate limit if provided
    if (request.limit && (typeof request.limit !== "number" || request.limit <= 0)) {
      throw new Error("Limit must be a positive number");
    }

    // Build query
    const query: PlatformPerformanceQuery = {
      platform: request.platform,
      startDate: request.startDate,
      endDate: request.endDate,
      limit: request.limit || 10,
    };

    // Get performance from service
    const performance = await this.campaignAnalyticsService.getPlatformPerformance(query);

    return { performance };
  }
}
