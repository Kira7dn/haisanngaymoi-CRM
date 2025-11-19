/**
 * Get Staff Performance Trend Use Case
 *
 * Retrieves staff performance trend over time.
 */

import { StaffPerformanceTrend, validateStaffId } from "@/core/domain/analytics/staff-performance";
import { validateDateRange, validateTimeGranularity } from "@/core/domain/analytics/revenue-metrics";
import {
  StaffAnalyticsService,
  StaffPerformanceTrendQuery,
} from "@/core/application/interfaces/analytics/staff-analytics-service";

export interface GetStaffPerformanceTrendRequest extends StaffPerformanceTrendQuery {}

export interface GetStaffPerformanceTrendResponse {
  trend: StaffPerformanceTrend[];
}

export class GetStaffPerformanceTrendUseCase {
  constructor(private staffAnalyticsService: StaffAnalyticsService) {}

  async execute(request: GetStaffPerformanceTrendRequest): Promise<GetStaffPerformanceTrendResponse> {
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

    // Validate granularity
    if (!validateTimeGranularity(request.granularity)) {
      throw new Error(`Invalid granularity: ${request.granularity}. Must be one of: day, week, month`);
    }

    // Fetch performance trend
    const trend = await this.staffAnalyticsService.getStaffPerformanceTrend(request);

    return { trend };
  }
}
