/**
 * Get Churn Risk Customers Use Case
 *
 * Retrieves customers at risk of churning based on inactivity.
 */

import {
  PurchasePattern,
} from "@/core/domain/analytics/customer-metrics";
import {
  CustomerAnalyticsService,
  ChurnRiskQuery,
} from "@/core/application/interfaces/analytics/customer-analytics-service";

export interface GetChurnRiskCustomersRequest extends ChurnRiskQuery {}

export interface GetChurnRiskCustomersResponse {
  customers: PurchasePattern[];
}

export class GetChurnRiskCustomersUseCase {
  constructor(private customerAnalyticsService: CustomerAnalyticsService) {}

  async execute(request: GetChurnRiskCustomersRequest): Promise<GetChurnRiskCustomersResponse> {
    // Validate limit
    if (request.limit <= 0) {
      throw new Error("Limit must be greater than 0");
    }

    if (request.limit > 500) {
      throw new Error("Limit cannot exceed 500");
    }

    // Fetch churn risk customers
    const customers = await this.customerAnalyticsService.getChurnRiskCustomers(request);

    return { customers };
  }
}
