/**
 * Get RFM Segmentation Use Case
 *
 * Retrieves RFM (Recency, Frequency, Monetary) segmentation for customer analysis.
 */

import {
  RFMSegment,
} from "@/core/domain/analytics/customer-metrics";
import { validateDateRange } from "@/core/domain/analytics/revenue-metrics";
import {
  CustomerAnalyticsService,
  RFMAnalysisQuery,
} from "@/core/application/interfaces/analytics/customer-analytics-service";

export interface GetRFMSegmentationRequest extends RFMAnalysisQuery {}

export interface GetRFMSegmentationResponse {
  segments: RFMSegment[];
}

export class GetRFMSegmentationUseCase {
  constructor(private customerAnalyticsService: CustomerAnalyticsService) {}

  async execute(request: GetRFMSegmentationRequest): Promise<GetRFMSegmentationResponse> {
    // Validate date range if provided
    if (request.dateRange) {
      const errors = validateDateRange(request.dateRange);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(", ")}`);
      }
    }

    // Validate limit if provided
    if (request.limit && request.limit <= 0) {
      throw new Error("Limit must be greater than 0");
    }

    if (request.limit && request.limit > 1000) {
      throw new Error("Limit cannot exceed 1000");
    }

    // Fetch RFM segmentation
    const segments = await this.customerAnalyticsService.getRFMSegmentation(request);

    return { segments };
  }
}
