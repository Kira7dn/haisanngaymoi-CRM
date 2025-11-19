/**
 * Get Team Performance Use Case
 *
 * Retrieves team-level performance aggregates.
 */

import { TeamPerformance } from "@/core/domain/analytics/staff-performance";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  StaffAnalyticsService,
  TeamPerformanceQuery,
} from "@/core/application/interfaces/analytics/staff-analytics-service";

export interface GetTeamPerformanceRequest extends TeamPerformanceQuery {}

export interface GetTeamPerformanceResponse {
  team: TeamPerformance;
}

export class GetTeamPerformanceUseCase {
  constructor(private staffAnalyticsService: StaffAnalyticsService) {}

  async execute(request: GetTeamPerformanceRequest): Promise<GetTeamPerformanceResponse> {
    // Validate date range
    const errors = validateDateRange({
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Validate top performers limit if provided
    if (request.topPerformersLimit && request.topPerformersLimit <= 0) {
      throw new Error("Top performers limit must be greater than 0");
    }

    if (request.topPerformersLimit && request.topPerformersLimit > 50) {
      throw new Error("Top performers limit cannot exceed 50");
    }

    // Fetch team performance data
    const team = await this.staffAnalyticsService.getTeamPerformance(request);

    return { team };
  }
}
