"use client"

import Link from "next/link"

interface TodayOrdersWidgetProps {
  todayOrderCount: number
  pendingOrders: number
  completionRate: number
}

export function TodayOrdersWidget({
  todayOrderCount,
  pendingOrders,
  completionRate,
}: TodayOrdersWidgetProps) {
  return (
    <Link href="/crm/managements/orders" className="block group">
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
        {todayOrderCount}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {pendingOrders} chờ xử lý, {completionRate.toFixed(1)}% hoàn thành
      </p>
    </Link>
  )
}
