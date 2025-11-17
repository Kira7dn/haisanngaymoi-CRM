"use server"

import { getOrdersUseCase } from "@/app/api/orders/depends"
import { filterProductsUseCase } from "@/app/api/products/depends"
import { getAllCustomersUseCase } from "@/app/api/customers/depends"

export async function getDashboardStats() {
  try {
    // Get orders
    const ordersUseCase = await getOrdersUseCase()
    const ordersResult = await ordersUseCase.execute({})
    const orders = ordersResult.orders

    // Get products
    const productsUseCase = await filterProductsUseCase()
    const productsResult = await productsUseCase.execute({})
    const products = productsResult.products

    // Get customers
    const customersUseCase = await getAllCustomersUseCase()
    const customersResult = await customersUseCase.execute({})
    const customers = customersResult.customers

    // Calculate statistics
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === "pending").length
    const completedOrders = orders.filter(o => o.status === "completed").length
    const totalRevenue = orders
      .filter(o => o.payment.status === "success")
      .reduce((sum, o) => sum + o.total, 0)

    const totalProducts = products.length
    const totalCustomers = customers.length

    // Recent orders (last 5)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    // Order status breakdown
    const ordersByStatus = {
      pending: pendingOrders,
      shipping: orders.filter(o => o.status === "shipping").length,
      completed: completedOrders,
    }

    // Payment status breakdown
    const ordersByPayment = {
      pending: orders.filter(o => o.payment.status === "pending").length,
      success: orders.filter(o => o.payment.status === "success").length,
      failed: orders.filter(o => o.payment.status === "failed").length,
    }

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)), // Serialize dates
      ordersByStatus,
      ordersByPayment,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return null
  }
}
