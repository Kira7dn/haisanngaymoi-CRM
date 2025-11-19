/**
 * Get Staff Activity Use Case
 *
 * Retrieves staff activity logs.
 */

import { StaffActivity } from "@/core/domain/analytics/staff-performance";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  StaffAnalyticsService,
  StaffActivityQuery,
} from "@/core/application/interfaces/analytics/staff-analytics-service";

export interface GetStaffActivityRequest extends StaffActivityQuery {}

export interface GetStaffActivityResponse {
  activities: StaffActivity[];
}

export class GetStaffActivityUseCase {
  constructor(private staffAnalyticsService: StaffAnalyticsService) {}

  async execute(request: GetStaffActivityRequest): Promise<GetStaffActivityResponse> {
    // Validate date range
    const errors = validateDateRange({
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Fetch staff activity
    const activities = await this.staffAnalyticsService.getStaffActivity(request);

    return { activities };
  }
}
