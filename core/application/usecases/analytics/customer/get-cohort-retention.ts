/**
 * Get Cohort Retention Use Case
 *
 * Retrieves cohort retention analysis for customer retention tracking.
 */

import {
  CohortRetention,
  validateCohortPeriods,
} from "@/core/domain/analytics/customer-metrics";
import {
  CustomerAnalyticsService,
  CohortRetentionQuery,
} from "@/core/application/interfaces/analytics/customer-analytics-service";

export interface GetCohortRetentionRequest extends CohortRetentionQuery {}

export interface GetCohortRetentionResponse {
  cohort: CohortRetention;
}

export class GetCohortRetentionUseCase {
  constructor(private customerAnalyticsService: CustomerAnalyticsService) {}

  async execute(request: GetCohortRetentionRequest): Promise<GetCohortRetentionResponse> {
    // Validate cohort start date
    if (!request.cohortStartDate) {
      throw new Error("Cohort start date is required");
    }

    // Validate periods
    const errors = validateCohortPeriods(request.periods);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Fetch cohort retention data
    const cohort = await this.customerAnalyticsService.getCohortRetention(request);

    return { cohort };
  }
}
