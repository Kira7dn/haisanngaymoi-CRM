/**
 * Get Customer Metrics Use Case
 *
 * Retrieves core customer KPIs for a given period.
 */

import {
  CustomerMetrics,
} from "@/core/domain/analytics/customer-metrics";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  CustomerAnalyticsService,
  CustomerMetricsQuery,
} from "@/core/application/interfaces/analytics/customer-analytics-service";

export interface GetCustomerMetricsRequest extends CustomerMetricsQuery {}

export interface GetCustomerMetricsResponse {
  metrics: CustomerMetrics;
}

export class GetCustomerMetricsUseCase {
  constructor(private customerAnalyticsService: CustomerAnalyticsService) {}

  async execute(request: GetCustomerMetricsRequest): Promise<GetCustomerMetricsResponse> {
    // Validate date range
    const errors = validateDateRange({
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Fetch metrics from service
    const metrics = await this.customerAnalyticsService.getCustomerMetrics(request);

    return { metrics };
  }
}
