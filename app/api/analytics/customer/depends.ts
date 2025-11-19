/**
 * Dependency Injection Factory for Customer Analytics
 *
 * Provides factory functions to create use case instances with their dependencies.
 * Used by both API routes and Server Actions.
 */

import { CustomerAnalyticsRepository } from "@/infrastructure/repositories/analytics/customer-analytics-repo";
import { CustomerAnalyticsService } from "@/core/application/interfaces/analytics/customer-analytics-service";

// Use Cases
import { GetCustomerMetricsUseCase } from "@/core/application/usecases/analytics/customer/get-customer-metrics";
import { GetCustomerSegmentationUseCase } from "@/core/application/usecases/analytics/customer/get-customer-segmentation";
import { GetPurchasePatternsUseCase } from "@/core/application/usecases/analytics/customer/get-purchase-patterns";
import { GetChurnRiskCustomersUseCase } from "@/core/application/usecases/analytics/customer/get-churn-risk-customers";
import { GetCohortRetentionUseCase } from "@/core/application/usecases/analytics/customer/get-cohort-retention";
import { GetRFMSegmentationUseCase } from "@/core/application/usecases/analytics/customer/get-rfm-segmentation";

/**
 * Create repository instance
 */
const createCustomerAnalyticsRepository = async (): Promise<CustomerAnalyticsService> => {
  return new CustomerAnalyticsRepository();
};

/**
 * Create GetCustomerMetrics use case
 */
export const createGetCustomerMetricsUseCase = async () => {
  const service = await createCustomerAnalyticsRepository();
  return new GetCustomerMetricsUseCase(service);
};

/**
 * Create GetCustomerSegmentation use case
 */
export const createGetCustomerSegmentationUseCase = async () => {
  const service = await createCustomerAnalyticsRepository();
  return new GetCustomerSegmentationUseCase(service);
};

/**
 * Create GetPurchasePatterns use case
 */
export const createGetPurchasePatternsUseCase = async () => {
  const service = await createCustomerAnalyticsRepository();
  return new GetPurchasePatternsUseCase(service);
};

/**
 * Create GetChurnRiskCustomers use case
 */
export const createGetChurnRiskCustomersUseCase = async () => {
  const service = await createCustomerAnalyticsRepository();
  return new GetChurnRiskCustomersUseCase(service);
};

/**
 * Create GetCohortRetention use case
 */
export const createGetCohortRetentionUseCase = async () => {
  const service = await createCustomerAnalyticsRepository();
  return new GetCohortRetentionUseCase(service);
};

/**
 * Create GetRFMSegmentation use case
 */
export const createGetRFMSegmentationUseCase = async () => {
  const service = await createCustomerAnalyticsRepository();
  return new GetRFMSegmentationUseCase(service);
};
