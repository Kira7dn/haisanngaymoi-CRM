/**
 * Campaign Performance Analytics Domain Entities
 *
 * Defines business entities and validation logic for campaign analytics.
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate (clicks / impressions * 100)
  conversionRate: number; // (orders / clicks * 100)
  costPerAcquisition?: number; // Total spend / total orders
}

export type Platform = "facebook" | "tiktok" | "zalo" | "shopee" | "google" | "other";

export interface PlatformBreakdown {
  platform: Platform;
  revenue: number;
  orders: number;
  clicks: number;
  impressions: number;
  ctr: number;
  conversionRate: number;
}

export interface CampaignAnalytics {
  campaignId: number;
  campaignName: string;
  period: DateRange;
  totalSpend?: number; // Manual input or from platform APIs
  totalRevenue: number; // From orders with UTM params
  totalOrders: number;
  roi: number; // (Revenue - Spend) / Spend * 100
  roiPercent: number; // ROI as percentage
  netProfit: number; // Revenue - Spend
  metrics: CampaignMetrics;
  platformBreakdown: PlatformBreakdown[];
  status: "active" | "paused" | "completed";
  startDate: Date;
  endDate: Date;
}

export interface CampaignComparison {
  campaigns: CampaignAnalytics[];
  period: DateRange;
  topPerformer: {
    campaignId: number;
    campaignName: string;
    metric: "revenue" | "roi" | "orders" | "conversions";
    value: number;
  };
  summary: {
    totalRevenue: number;
    totalSpend: number;
    totalOrders: number;
    avgRoi: number;
  };
}

export interface PlatformPerformance {
  platform: Platform;
  period: DateRange;
  totalRevenue: number;
  totalOrders: number;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgConversionRate: number;
  topCampaigns: Array<{
    campaignId: number;
    campaignName: string;
    revenue: number;
    orders: number;
  }>;
}

export interface UTMParams {
  utmSource?: string; // e.g., "facebook", "tiktok"
  utmMedium?: string; // e.g., "cpc", "social", "email"
  utmCampaign?: string; // Campaign name or ID
  utmContent?: string; // Ad variant
  utmTerm?: string; // Keywords
}

/**
 * Validation Functions
 */

export function validateCampaignId(campaignId: unknown): string[] {
  const errors: string[] = [];
  if (typeof campaignId !== "number" || campaignId <= 0) {
    errors.push("Campaign ID must be a positive number");
  }
  return errors;
}

export function validateDateRange(startDate: unknown, endDate: unknown): string[] {
  const errors: string[] = [];

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    errors.push("Start date must be a valid date");
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    errors.push("End date must be a valid date");
  }

  if (
    startDate instanceof Date &&
    endDate instanceof Date &&
    startDate > endDate
  ) {
    errors.push("Start date cannot be after end date");
  }

  return errors;
}

export function validatePlatform(platform: unknown): string[] {
  const errors: string[] = [];
  const validPlatforms: Platform[] = ["facebook", "tiktok", "zalo", "shopee", "google", "other"];

  if (typeof platform !== "string" || !validPlatforms.includes(platform as Platform)) {
    errors.push(`Platform must be one of: ${validPlatforms.join(", ")}`);
  }

  return errors;
}

/**
 * Calculation Functions
 */

export function calculateROI(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return ((revenue - spend) / spend) * 100;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateConversionRate(orders: number, clicks: number): number {
  if (clicks === 0) return 0;
  return (orders / clicks) * 100;
}

export function calculateCostPerAcquisition(totalSpend: number, totalOrders: number): number {
  if (totalOrders === 0) return 0;
  return totalSpend / totalOrders;
}

export function calculateNetProfit(revenue: number, spend: number): number {
  return revenue - (spend || 0);
}

/**
 * Helper Functions
 */

export function getPlatformName(platform: Platform): string {
  const platformNames: Record<Platform, string> = {
    facebook: "Facebook",
    tiktok: "TikTok",
    zalo: "Zalo",
    shopee: "Shopee",
    google: "Google Ads",
    other: "Other"
  };
  return platformNames[platform];
}

export function getPerformanceTier(roi: number): "excellent" | "good" | "average" | "poor" {
  if (roi >= 200) return "excellent"; // 200% ROI or higher
  if (roi >= 100) return "good";      // 100-200% ROI
  if (roi >= 50) return "average";    // 50-100% ROI
  return "poor";                      // Below 50% ROI
}

export function formatROI(roi: number): string {
  return `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`;
}
