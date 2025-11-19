/**
 * Dependency Injection Factory for Staff Analytics
 *
 * Provides factory functions to create use case instances with their dependencies.
 */

import { StaffAnalyticsRepository } from "@/infrastructure/repositories/analytics/staff-analytics-repo";
import { StaffAnalyticsService } from "@/core/application/interfaces/analytics/staff-analytics-service";

// Use Cases
import { GetStaffPerformanceUseCase } from "@/core/application/usecases/analytics/staff/get-staff-performance";
import { GetTeamPerformanceUseCase } from "@/core/application/usecases/analytics/staff/get-team-performance";
import { GetStaffRankingUseCase } from "@/core/application/usecases/analytics/staff/get-staff-ranking";
import { GetStaffActivityUseCase } from "@/core/application/usecases/analytics/staff/get-staff-activity";
import { GetStaffPerformanceTrendUseCase } from "@/core/application/usecases/analytics/staff/get-staff-performance-trend";

/**
 * Create repository instance
 */
const createStaffAnalyticsRepository = async (): Promise<StaffAnalyticsService> => {
  return new StaffAnalyticsRepository();
};

/**
 * Create GetStaffPerformance use case
 */
export const createGetStaffPerformanceUseCase = async () => {
  const service = await createStaffAnalyticsRepository();
  return new GetStaffPerformanceUseCase(service);
};

/**
 * Create GetTeamPerformance use case
 */
export const createGetTeamPerformanceUseCase = async () => {
  const service = await createStaffAnalyticsRepository();
  return new GetTeamPerformanceUseCase(service);
};

/**
 * Create GetStaffRanking use case
 */
export const createGetStaffRankingUseCase = async () => {
  const service = await createStaffAnalyticsRepository();
  return new GetStaffRankingUseCase(service);
};

/**
 * Create GetStaffActivity use case
 */
export const createGetStaffActivityUseCase = async () => {
  const service = await createStaffAnalyticsRepository();
  return new GetStaffActivityUseCase(service);
};

/**
 * Create GetStaffPerformanceTrend use case
 */
export const createGetStaffPerformanceTrendUseCase = async () => {
  const service = await createStaffAnalyticsRepository();
  return new GetStaffPerformanceTrendUseCase(service);
};
