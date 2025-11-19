/**
 * Get Customer Segmentation Use Case
 *
 * Retrieves customer segmentation by tier with statistics.
 */

import {
  CustomerSegmentStats,
} from "@/core/domain/analytics/customer-metrics";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  CustomerAnalyticsService,
  CustomerSegmentationQuery,
} from "@/core/application/interfaces/analytics/customer-analytics-service";

export interface GetCustomerSegmentationRequest extends CustomerSegmentationQuery {}

export interface GetCustomerSegmentationResponse {
  segments: CustomerSegmentStats[];
}

export class GetCustomerSegmentationUseCase {
  constructor(private customerAnalyticsService: CustomerAnalyticsService) {}

  async execute(request: GetCustomerSegmentationRequest): Promise<GetCustomerSegmentationResponse> {
    // Validate date range
    const errors = validateDateRange({
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Fetch segmentation data
    const segments = await this.customerAnalyticsService.getCustomerSegmentation(request);

    return { segments };
  }
}
