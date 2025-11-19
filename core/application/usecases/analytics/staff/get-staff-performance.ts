/**
 * Get Staff Performance Use Case
 *
 * Retrieves performance metrics for a specific staff member.
 */

import { StaffPerformance, validateStaffId } from "@/core/domain/analytics/staff-performance";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  StaffAnalyticsService,
  StaffPerformanceQuery,
} from "@/core/application/interfaces/analytics/staff-analytics-service";

export interface GetStaffPerformanceRequest extends StaffPerformanceQuery {}

export interface GetStaffPerformanceResponse {
  performance: StaffPerformance;
}

export class GetStaffPerformanceUseCase {
  constructor(private staffAnalyticsService: StaffAnalyticsService) {}

  async execute(request: GetStaffPerformanceRequest): Promise<GetStaffPerformanceResponse> {
    // Validate staff ID
    const staffIdErrors = validateStaffId(request.staffId);
    if (staffIdErrors.length > 0) {
      throw new Error(`Validation failed: ${staffIdErrors.join(", ")}`);
    }

    // Validate date range
    const dateErrors = validateDateRange({
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (dateErrors.length > 0) {
      throw new Error(`Validation failed: ${dateErrors.join(", ")}`);
    }

    // Fetch performance data
    const performance = await this.staffAnalyticsService.getStaffPerformance(request);

    return { performance };
  }
}
