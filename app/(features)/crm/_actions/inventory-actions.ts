/**
 * @deprecated This file is deprecated. All functions have been moved to dashboard_actions.ts
 *
 * Migration guide:
 * - getProfitAnalysis() → Use getDashboardStats().profitMetrics instead
 * - getInventoryAlerts() → Import from dashboard_actions.ts
 *
 * Please update your imports:
 * ```typescript
 * // Old
 * import { getProfitAnalysis, getInventoryAlerts } from "@/app/(features)/crm/_actions/inventory-actions"
 *
 * // New
 * import { getDashboardStats, getInventoryAlerts } from "@/app/(features)/crm/_actions/dashboard_actions"
 * ```
 */

"use server"

import { getInventoryAlerts as getAlertsFromDashboard, getDashboardStats } from "./dashboard_actions"

/**
 * @deprecated Import directly from dashboard_actions.ts instead
 */
export async function getInventoryAlerts() {
  console.warn("getInventoryAlerts from inventory-actions.ts is deprecated. Import from dashboard_actions.ts instead")
  return await getAlertsFromDashboard()
}

/**
 * @deprecated Use getDashboardStats().profitMetrics instead
 * This provides the same data structure with last7Days, last30Days, topProfitProducts, and costBreakdown
 */
export async function getProfitAnalysis() {
  console.warn("getProfitAnalysis is deprecated. Use getDashboardStats().profitMetrics instead")
  const stats = await getDashboardStats()
  return stats?.profitMetrics || null
}
