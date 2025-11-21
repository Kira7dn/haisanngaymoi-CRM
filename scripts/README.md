# Test Data Generation Scripts

Scripts to generate realistic test data for the CRM system.

## Available Scripts

### 1. Seed Customers (`seed-customers.ts`)

Generates realistic Vietnamese customer test data.

**Features:**
- Vietnamese names (16 first names, 15 middle names, 20 last names)
- Vietnamese phone numbers (090-099 prefixes)
- Realistic addresses with Vietnamese cities, districts, and streets
- Email generation from names
- Multi-platform support (1-3 platforms per customer)
- Realistic tier distribution:
  - 50% new customers
  - 30% regular customers
  - 15% VIP customers
  - 5% premium customers
- 90% active status, 10% inactive
- Random customer tags from predefined pool
- Optional notes (20% of customers)

**Usage:**
```bash
# Generate 100 customers (default)
npx tsx --env-file=.env scripts/seed-customers.ts

# Generate specific number of customers
npx tsx --env-file=.env scripts/seed-customers.ts 50

# Using npm script
npm run seed:customers -- 50
```

**Example Output:**
```
🌱 Seeding 50 customers...
📝 Created 10/50 customers...
📝 Created 20/50 customers...
...
✅ Customer seeding complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Created: 50
⏭️  Skipped: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Seed Orders (`seed-orders.ts`)

Generates realistic order test data based on existing customers and products.

**Features:**
- Uses existing customers and products from database
- 1-5 items per order with realistic quantities (1-10 units)
- Realistic order status distribution:
  - 5% pending
  - 5% confirmed
  - 5% processing
  - 10% shipping
  - 15% delivered
  - 45% completed
  - 15% cancelled
- Complete order lifecycle with timestamps
- Payment info with transaction IDs for successful payments
- Delivery tracking numbers for shipped orders
- Vietnamese pricing (20,000-50,000 VND shipping fee)
- 30% of orders have discounts
- Orders distributed over the past 6 months
- Random order tags

**Usage:**
```bash
# Generate 200 orders (default)
npx tsx --env-file=.env scripts/seed-orders.ts

# Generate specific number of orders
npx tsx --env-file=.env scripts/seed-orders.ts 100

# Using npm script
npm run seed:orders -- 100
```

**Prerequisites:**
- Customers must exist in the database (run `seed-customers.ts` first)
- Products must exist in the database

**Example Output:**
```
🌱 Seeding 100 orders...
📥 Fetching customers...
✅ Found 50 customers
📥 Fetching products...
✅ Found 25 products
📝 Created 20/100 orders...
📝 Created 40/100 orders...
...
✅ Order seeding complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Created: 100
⏭️  Skipped: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Order Distribution:
  • Pending: ~5%
  • Confirmed: ~5%
  • Processing: ~5%
  • Shipping: ~10%
  • Delivered: ~15%
  • Completed: ~45%
  • Cancelled: ~15%
```

## Quick Start

### Step 1: Generate Customers
```bash
npm run seed:customers -- 100
```

### Step 2: Generate Orders
```bash
npm run seed:orders -- 200
```

## Environment Setup

Ensure your `.env.local` or `.env` file contains:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=ClusterName
MONGODB_DB=crm_db
```

## Tips

1. **Start Small**: Test with small numbers first (e.g., 10 customers, 20 orders)
2. **Customer First**: Always seed customers before orders
3. **Products Required**: Ensure products exist before seeding orders
4. **Realistic Data**: Generated data uses Vietnamese names, addresses, and phone numbers
5. **Idempotent**: Scripts can be run multiple times to add more data

## Troubleshooting

### "No customers found"
Run `npm run seed:customers` before seeding orders.

### "No products found"
Ensure products exist in the database. You may need to manually add some products first.

### Connection Errors
Verify your `.env` file contains correct MongoDB credentials.

### Performance
For large datasets (1000+), the scripts may take several minutes. Progress is logged every 10-20 records.

## Data Cleanup

To remove all test data, use MongoDB shell or a database client:

```javascript
// MongoDB shell
use crm_db
db.customers.deleteMany({})
db.orders.deleteMany({})
```

**Warning**: This will delete ALL data, not just test data. Use with caution!

## Architecture

These scripts follow the Clean Architecture pattern:
- Use domain entities from `core/domain/managements/`
- Use repositories from `infrastructure/repositories/`
- No direct database access - everything goes through the repository layer

## Contributing

When adding new seed scripts:
1. Follow the existing naming pattern: `seed-<entity>.ts`
2. Include progress logging
3. Support CLI arguments for count
4. Add documentation to this README
5. Add npm script to `package.json`
