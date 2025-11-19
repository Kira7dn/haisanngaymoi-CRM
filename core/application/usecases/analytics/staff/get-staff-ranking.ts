/**
 * Get Staff Ranking Use Case
 *
 * Retrieves staff leaderboard rankings.
 */

import { StaffRanking } from "@/core/domain/analytics/staff-performance";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  StaffAnalyticsService,
  StaffRankingQuery,
} from "@/core/application/interfaces/analytics/staff-analytics-service";

export interface GetStaffRankingRequest extends StaffRankingQuery {}

export interface GetStaffRankingResponse {
  rankings: StaffRanking[];
}

export class GetStaffRankingUseCase {
  constructor(private staffAnalyticsService: StaffAnalyticsService) {}

  async execute(request: GetStaffRankingRequest): Promise<GetStaffRankingResponse> {
    // Validate date range
    const errors = validateDateRange({
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Validate limit if provided
    if (request.limit && request.limit <= 0) {
      throw new Error("Limit must be greater than 0");
    }

    if (request.limit && request.limit > 100) {
      throw new Error("Limit cannot exceed 100");
    }

    // Fetch staff rankings
    const rankings = await this.staffAnalyticsService.getStaffRanking(request);

    return { rankings };
  }
}
