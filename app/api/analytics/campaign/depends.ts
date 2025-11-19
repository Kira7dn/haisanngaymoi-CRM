/**
 * Campaign Analytics Dependency Injection
 *
 * Factory functions for creating use case instances.
 */

import { CampaignAnalyticsRepository } from "@/infrastructure/repositories/analytics/campaign-analytics-repo";
import { GetCampaignAnalyticsUseCase } from "@/core/application/usecases/analytics/campaign/get-campaign-analytics";
import { CompareCampaignsUseCase } from "@/core/application/usecases/analytics/campaign/compare-campaigns";
import { GetPlatformPerformanceUseCase } from "@/core/application/usecases/analytics/campaign/get-platform-performance";
import type { CampaignAnalyticsService } from "@/core/application/interfaces/analytics/campaign-analytics-service";

const createCampaignAnalyticsRepository = async (): Promise<CampaignAnalyticsService> => {
  return new CampaignAnalyticsRepository();
};

export const createGetCampaignAnalyticsUseCase = async () => {
  const service = await createCampaignAnalyticsRepository();
  return new GetCampaignAnalyticsUseCase(service);
};

export const createCompareCampaignsUseCase = async () => {
  const service = await createCampaignAnalyticsRepository();
  return new CompareCampaignsUseCase(service);
};

export const createGetPlatformPerformanceUseCase = async () => {
  const service = await createCampaignAnalyticsRepository();
  return new GetPlatformPerformanceUseCase(service);
};
