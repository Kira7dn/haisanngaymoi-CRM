/**
 * Date Helper Utilities
 * Shared date filtering and boundary calculation functions for dashboard and analytics
 */

/**
 * Get date boundaries for common time periods
 */
export function getDateBoundaries(now = new Date()) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const last7DaysStart = new Date(todayStart)
  last7DaysStart.setDate(last7DaysStart.getDate() - 7)

  const last30DaysStart = new Date(todayStart)
  last30DaysStart.setDate(last30DaysStart.getDate() - 30)

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  return {
    now,
    todayStart,
    yesterdayStart,
    last7DaysStart,
    last30DaysStart,
    thisMonthStart,
    lastMonthStart,
    lastMonthEnd,
  }
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDate<T extends { createdAt: Date | string }>(
  orders: T[],
  startDate: Date,
  endDate: Date = new Date()
): T[] {
  return orders.filter(o => {
    const orderDate = new Date(o.createdAt)
    return orderDate >= startDate && orderDate <= endDate
  })
}

/**
 * Get previous period start date
 */
export function getPreviousPeriodStart(periodStart: Date, currentDate: Date): Date {
  const daysDiff = Math.floor((currentDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
  const previousStart = new Date(periodStart)
  previousStart.setDate(previousStart.getDate() - daysDiff)
  return previousStart
}
