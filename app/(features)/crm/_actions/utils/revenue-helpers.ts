/**
 * Revenue Calculation Utilities
 * Shared revenue and financial calculation functions
 */

import type { Order } from "@/core/domain/sales/order"

/**
 * Calculate total revenue from orders
 * Only counts orders with successful payment status
 */
export function calculateRevenue(orders: Order[]): number {
  return orders
    .filter(o => o.payment.status === "success")
    .reduce((sum, o) => sum + o.total, 0)
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate Average Order Value (AOV)
 */
export function calculateAOV(orders: Order[]): number {
  const successfulOrders = orders.filter(o => o.payment.status === "success")
  if (successfulOrders.length === 0) return 0
  return successfulOrders.reduce((sum, o) => sum + o.total, 0) / successfulOrders.length
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(orders: Order[]): number {
  if (orders.length === 0) return 0
  const completedOrders = orders.filter(o => o.status === "completed").length
  return (completedOrders / orders.length) * 100
}

/**
 * Calculate error rate
 */
export function calculateErrorRate(orders: Order[]): number {
  if (orders.length === 0) return 0
  const failedOrders = orders.filter(
    o => o.payment.status === "failed" || o.status === "cancelled"
  ).length
  return (failedOrders / orders.length) * 100
}
