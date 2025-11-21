/**
 * Script to seed customer test data
 * Run with: npx tsx --env-file=.env scripts/seed-customers.ts [count]
 * Example: npx tsx --env-file=.env scripts/seed-customers.ts 50
 */

import { CustomerRepository } from "../infrastructure/repositories/customer-repo"
import type { CustomerSource, CustomerTier, CustomerStatus } from "../core/domain/managements/customer"

// Vietnamese names for realistic data
const firstNames = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"
]

const middleNames = [
  "Văn", "Thị", "Đức", "Minh", "Hồng", "Quốc", "Thanh", "Anh", "Thu", "Xuân",
  "Hải", "Phương", "Bảo", "Kim", "Ngọc"
]

const lastNames = [
  "Anh", "Hùng", "Linh", "Mai", "Hoa", "Long", "Tú", "Dũng", "Phúc", "Thảo",
  "Ngân", "Lan", "Hương", "Tâm", "Quyên", "Hạnh", "Trinh", "Phong", "Tuấn", "Nam"
]

const cities = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Quảng Ninh",
  "Bình Dương", "Đồng Nai", "Khánh Hòa", "Lâm Đồng", "Nghệ An", "Thái Nguyên"
]

const districts = [
  "Quận 1", "Quận 2", "Quận 3", "Ba Đình", "Hoàn Kiếm", "Cầu Giấy", "Hải Châu",
  "Sơn Trà", "Hồng Bàng", "Ninh Kiều", "Bình Thạnh", "Thủ Đức"
]

const streets = [
  "Lê Lợi", "Trần Hưng Đạo", "Nguyễn Huệ", "Hai Bà Trưng", "Lý Thường Kiệt",
  "Điện Biên Phủ", "Võ Văn Tần", "Cách Mạng Tháng 8", "Phan Đình Phùng", "Hoàng Diệu"
]

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateVietnameseName(): string {
  const firstName = randomItem(firstNames)
  const middleName = randomItem(middleNames)
  const lastName = randomItem(lastNames)
  return `${firstName} ${middleName} ${lastName}`
}

function generatePhone(): string {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099', '086', '088']
  const prefix = randomItem(prefixes)
  const suffix = randomInt(1000000, 9999999)
  return `${prefix}${suffix}`
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
  const cleanName = name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
    .replace(/đ/g, 'd')
    .replace(/\s+/g, '')
  const random = randomInt(100, 999)
  return `${cleanName}${random}@${randomItem(domains)}`
}

function generateAddress(): string {
  const streetNum = randomInt(1, 999)
  const street = randomItem(streets)
  const district = randomItem(districts)
  const city = randomItem(cities)
  return `${streetNum} ${street}, ${district}, ${city}`
}

function generatePlatformId(): string {
  return `${Date.now()}_${randomInt(10000, 99999)}`
}

const sources: CustomerSource[] = ["zalo", "facebook", "website", "tiktok", "telegram"]
const tiers: CustomerTier[] = ["new", "regular", "vip", "premium"]
const statuses: CustomerStatus[] = ["active", "inactive"]

const tagPool = [
  "high-value", "frequent-buyer", "wholesale", "retail", "seafood-lover",
  "bulk-order", "seasonal-buyer", "vip-member", "corporate", "individual"
]

function generateTags(): string[] {
  const count = randomInt(0, 3)
  const tags: string[] = []
  for (let i = 0; i < count; i++) {
    const tag = randomItem(tagPool)
    if (!tags.includes(tag)) {
      tags.push(tag)
    }
  }
  return tags
}

async function seedCustomers(count: number = 100) {
  console.log(`🌱 Seeding ${count} customers...`)

  const repo = new CustomerRepository()
  let created = 0
  let skipped = 0

  for (let i = 0; i < count; i++) {
    const name = generateVietnameseName()
    const phone = generatePhone()
    const email = Math.random() > 0.3 ? generateEmail(name) : undefined // 70% have email
    const primarySource = randomItem(sources)

    // Generate platform IDs (1-3 platforms per customer)
    const platformCount = randomInt(1, 3)
    const platformIds = []
    const usedPlatforms = new Set<CustomerSource>()

    // Always include primary source
    platformIds.push({
      platform: primarySource,
      platformUserId: generatePlatformId()
    })
    usedPlatforms.add(primarySource)

    // Add additional platforms
    for (let j = 1; j < platformCount; j++) {
      let platform = randomItem(sources)
      while (usedPlatforms.has(platform)) {
        platform = randomItem(sources)
      }
      platformIds.push({
        platform,
        platformUserId: generatePlatformId()
      })
      usedPlatforms.add(platform)
    }

    // Tier distribution: 50% new, 30% regular, 15% vip, 5% premium
    const tierRand = Math.random()
    let tier: CustomerTier
    if (tierRand < 0.5) tier = "new"
    else if (tierRand < 0.8) tier = "regular"
    else if (tierRand < 0.95) tier = "vip"
    else tier = "premium"

    const status = Math.random() > 0.1 ? "active" : "inactive" // 90% active

    try {
      await repo.create({
        name,
        phone,
        email,
        address: Math.random() > 0.4 ? generateAddress() : undefined, // 60% have address
        platformIds,
        primarySource,
        tier,
        status,
        tags: generateTags(),
        notes: Math.random() > 0.8 ? "Generated test customer" : undefined, // 20% have notes
      })
      created++

      if ((i + 1) % 10 === 0) {
        console.log(`📝 Created ${i + 1}/${count} customers...`)
      }
    } catch (error) {
      console.error(`❌ Failed to create customer ${i + 1}:`, error instanceof Error ? error.message : error)
      skipped++
    }
  }

  console.log("\n✅ Customer seeding complete!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`✅ Created: ${created}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

// Get count from command line args
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 100

if (isNaN(count) || count < 1) {
  console.error("❌ Invalid count. Please provide a positive number.")
  console.log("Usage: npx tsx --env-file=.env scripts/seed-customers.ts [count]")
  process.exit(1)
}

seedCustomers(count)
  .then(() => {
    console.log("✨ Seeding complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Error seeding customers:", error)
    process.exit(1)
  })
