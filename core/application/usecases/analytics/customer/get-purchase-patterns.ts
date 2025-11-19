/**
 * Get Purchase Patterns Use Case
 *
 * Retrieves purchase patterns and behavior analysis for customers.
 */

import {
  PurchasePattern,
} from "@/core/domain/analytics/customer-metrics";
import {
  CustomerAnalyticsService,
  PurchasePatternsQuery,
} from "@/core/application/interfaces/analytics/customer-analytics-service";

export interface GetPurchasePatternsRequest extends PurchasePatternsQuery {}

export interface GetPurchasePatternsResponse {
  patterns: PurchasePattern[];
}

export class GetPurchasePatternsUseCase {
  constructor(private customerAnalyticsService: CustomerAnalyticsService) {}

  async execute(request: GetPurchasePatternsRequest): Promise<GetPurchasePatternsResponse> {
    // Validate limit if provided
    if (request.limit && request.limit <= 0) {
      throw new Error("Limit must be greater than 0");
    }

    if (request.limit && request.limit > 1000) {
      throw new Error("Limit cannot exceed 1000");
    }

    // Fetch purchase patterns
    const patterns = await this.customerAnalyticsService.getPurchasePatterns(request);

    return { patterns };
  }
}
