/**
 * Script to seed order test data based on existing customers and products
 * Run with: npx tsx --env-file=.env scripts/seed-orders.ts [count]
 * Example: npx tsx --env-file=.env scripts/seed-orders.ts 200
 */

import { OrderRepository } from "../infrastructure/repositories/order-repo"
import { CustomerRepository } from "../infrastructure/repositories/customer-repo"
import { ProductRepository } from "../infrastructure/repositories/product-repo"
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingProvider,
  OrderItem
} from "../core/domain/managements/order"

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const statuses: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipping",
  "delivered", "completed", "cancelled"
]

const paymentMethods: PaymentMethod[] = [
  "cod", "bank_transfer", "vnpay", "zalopay", "momo"
]

const shippingProviders: ShippingProvider[] = [
  "ghn", "ghtk", "vnpost", "self_delivery"
]

const orderTags = [
  "wholesale", "retail", "gift", "bulk-order", "repeat-customer",
  "first-time", "seasonal", "promotion", "urgent", "corporate"
]

// Status distributions (realistic lifecycle)
function getStatusDistribution(): OrderStatus {
  const rand = Math.random()
  if (rand < 0.05) return "pending"         // 5%
  else if (rand < 0.10) return "confirmed"  // 5%
  else if (rand < 0.15) return "processing" // 5%
  else if (rand < 0.25) return "shipping"   // 10%
  else if (rand < 0.40) return "delivered"  // 15%
  else if (rand < 0.85) return "completed"  // 45%
  else return "cancelled"                    // 15%
}

function getPaymentStatus(orderStatus: OrderStatus): PaymentStatus {
  if (orderStatus === "cancelled") {
    return Math.random() > 0.5 ? "failed" : "pending"
  }
  if (["pending", "confirmed"].includes(orderStatus)) {
    return "pending"
  }
  return "success"
}

function generateOrderTimestamps(status: OrderStatus, createdAt: Date) {
  const timestamps: Record<string, Date | undefined> = {
    createdAt,
    updatedAt: createdAt
  }

  let current = new Date(createdAt)

  if (["confirmed", "processing", "shipping", "delivered", "completed"].includes(status)) {
    current = new Date(current.getTime() + randomInt(1, 24) * 60 * 60 * 1000) // 1-24h later
    timestamps.confirmedAt = current
  }

  if (["processing", "shipping", "delivered", "completed"].includes(status)) {
    current = new Date(current.getTime() + randomInt(2, 48) * 60 * 60 * 1000) // 2-48h later
    timestamps.processingAt = current
  }

  if (["shipping", "delivered", "completed"].includes(status)) {
    current = new Date(current.getTime() + randomInt(12, 72) * 60 * 60 * 1000) // 12-72h later
    timestamps.shippingAt = current
  }

  if (["delivered", "completed"].includes(status)) {
    current = new Date(current.getTime() + randomInt(24, 120) * 60 * 60 * 1000) // 1-5 days later
    timestamps.deliveredAt = current
  }

  if (status === "completed") {
    current = new Date(current.getTime() + randomInt(1, 48) * 60 * 60 * 1000) // 1-2 days later
    timestamps.completedAt = current
  }

  if (status === "cancelled") {
    current = new Date(current.getTime() + randomInt(1, 72) * 60 * 60 * 1000)
    timestamps.cancelledAt = current
  }

  timestamps.updatedAt = current

  return timestamps
}

function generateTags(): string[] {
  const count = randomInt(0, 3)
  const tags: string[] = []
  for (let i = 0; i < count; i++) {
    const tag = randomItem(orderTags)
    if (!tags.includes(tag)) {
      tags.push(tag)
    }
  }
  return tags
}

async function seedOrders(count: number = 200) {
  console.log(`🌱 Seeding ${count} orders...`)

  const orderRepo = new OrderRepository()
  const customerRepo = new CustomerRepository()
  const productRepo = new ProductRepository()

  // Fetch existing customers and products
  console.log("📥 Fetching customers...")
  const customers = await customerRepo.getAll()
  if (customers.length === 0) {
    console.error("❌ No customers found! Please run seed-customers.ts first.")
    process.exit(1)
  }
  console.log(`✅ Found ${customers.length} customers`)

  console.log("📥 Fetching products...")
  const products = await productRepo.getAll()
  if (products.length === 0) {
    console.error("❌ No products found! Please ensure products exist in the database.")
    process.exit(1)
  }
  console.log(`✅ Found ${products.length} products`)

  let created = 0
  let skipped = 0

  // Generate orders over the past 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const now = new Date()

  for (let i = 0; i < count; i++) {
    try {
      const customer = randomItem(customers)
      const status = getStatusDistribution()
      const paymentMethod = randomItem(paymentMethods)
      const paymentStatus = getPaymentStatus(status)

      // Generate 1-5 items per order
      const itemCount = randomInt(1, 5)
      const items: OrderItem[] = []
      let subtotal = 0

      for (let j = 0; j < itemCount; j++) {
        const product = randomItem(products)
        const quantity = randomInt(1, 10)
        const unitPrice = product.price
        const totalPrice = unitPrice * quantity

        items.push({
          productId: product.id.toString(),
          productName: product.name,
          productImage: product.image,
          quantity,
          unitPrice,
          totalPrice
        })

        subtotal += totalPrice
      }

      // Calculate pricing
      const shippingFee = randomInt(20000, 50000) // 20k-50k VND
      const discount = Math.random() > 0.7 ? randomInt(10000, 100000) : 0 // 30% have discount
      const total = subtotal + shippingFee - discount

      // Generate timestamps
      const createdAt = randomDate(sixMonthsAgo, now)
      const timestamps = generateOrderTimestamps(status, createdAt)

      // Payment info
      const payment = {
        method: paymentMethod,
        status: paymentStatus,
        amount: total,
        transactionId: paymentStatus === "success" ? `TXN${Date.now()}${randomInt(1000, 9999)}` : undefined,
        paidAt: paymentStatus === "success" ? timestamps.confirmedAt : undefined
      }

      // Delivery info
      const delivery = {
        name: customer.name || "Unknown",
        phone: customer.phone || "0901234567",
        address: customer.address || "Địa chỉ không có sẵn",
        shippingProvider: randomItem(shippingProviders),
        trackingNumber: ["shipping", "delivered", "completed"].includes(status)
          ? `TRK${randomInt(100000000, 999999999)}`
          : undefined,
        estimatedDelivery: status === "shipping"
          ? new Date(Date.now() + randomInt(1, 5) * 24 * 60 * 60 * 1000)
          : undefined,
        actualDelivery: timestamps.deliveredAt
      }

      await orderRepo.create({
        customerId: customer.id,
        status,
        items,
        delivery,
        subtotal,
        shippingFee,
        discount,
        total,
        payment,
        tags: generateTags(),
        note: Math.random() > 0.8 ? "Generated test order" : undefined,
        platformSource: customer.primarySource,
        ...timestamps
      })

      created++

      if ((i + 1) % 20 === 0) {
        console.log(`📝 Created ${i + 1}/${count} orders...`)
      }
    } catch (error) {
      console.error(`❌ Failed to create order ${i + 1}:`, error instanceof Error ? error.message : error)
      skipped++
    }
  }

  console.log("\n✅ Order seeding complete!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`✅ Created: ${created}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("\n📊 Order Distribution:")
  console.log("  • Pending: ~5%")
  console.log("  • Confirmed: ~5%")
  console.log("  • Processing: ~5%")
  console.log("  • Shipping: ~10%")
  console.log("  • Delivered: ~15%")
  console.log("  • Completed: ~45%")
  console.log("  • Cancelled: ~15%")
}

// Get count from command line args
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 200

if (isNaN(count) || count < 1) {
  console.error("❌ Invalid count. Please provide a positive number.")
  console.log("Usage: npx tsx --env-file=.env scripts/seed-orders.ts [count]")
  process.exit(1)
}

seedOrders(count)
  .then(() => {
    console.log("✨ Seeding complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Error seeding orders:", error)
    process.exit(1)
  })
