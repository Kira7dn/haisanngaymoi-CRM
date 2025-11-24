# CRM Actions - Refactored Structure

This directory contains centralized Server Actions for the CRM module, optimized to eliminate code duplication and improve maintainability.

## File Structure

```
_actions/
├── utils/                       # Shared utility functions
│   ├── date-helpers.ts         # Date filtering and boundary calculations
│   ├── revenue-helpers.ts      # Revenue and financial calculations
│   └── index.ts                # Re-exports all utilities
├── ai-actions.ts               # AI-powered analytics (forecasting, risk assessment)
├── dashboard_actions.ts        # Dashboard statistics, metrics, profit analysis, inventory alerts
├── inventory-actions.ts        # [DEPRECATED] Merged into dashboard_actions.ts
└── crm-actions.ts              # [DEPRECATED] Legacy actions, use feature-specific files
```

## Shared Utilities

### `utils/date-helpers.ts`

**Purpose**: Centralized date operations to ensure consistency across all analytics functions.

**Functions**:
- `getDateBoundaries(now?)` - Returns date boundaries for common periods (today, yesterday, last 7/30 days, this/last month)
- `filterOrdersByDate(orders, startDate, endDate)` - Filters orders within a date range
- `getPreviousPeriodStart(periodStart, currentDate)` - Calculates the start date of the previous period for comparison

**Usage**:
```typescript
import { getDateBoundaries, filterOrdersByDate } from "./utils"

const { todayStart, last7DaysStart, now } = getDateBoundaries()
const last7DaysOrders = filterOrdersByDate(orders, last7DaysStart, now)
```

### `utils/revenue-helpers.ts`

**Purpose**: Centralized financial calculations for consistency across dashboard, analytics, and AI modules.

**Functions**:
- `calculateRevenue(orders)` - Sums revenue from successful orders
- `calculatePercentageChange(current, previous)` - Calculates percentage change between two values
- `calculateAOV(orders)` - Calculates Average Order Value
- `calculateCompletionRate(orders)` - Calculates order completion percentage
- `calculateErrorRate(orders)` - Calculates failed/cancelled order percentage

**Usage**:
```typescript
import { calculateRevenue, calculateAOV, calculatePercentageChange } from "./utils"

const revenue = calculateRevenue(orders)
const aov = calculateAOV(orders)
const change = calculatePercentageChange(currentRevenue, previousRevenue)
```

## Action Files

### `dashboard_actions.ts`

**Purpose**: Provides comprehensive dashboard statistics including revenue, orders, customers, product performance, profit analysis, and inventory alerts.

**Main Functions**:
- `getDashboardStats()` - Complete dashboard metrics with profit analysis
- `getInventoryAlerts()` - Low stock and out-of-stock alerts

**getDashboardStats() Returns**:
- Revenue metrics (today, yesterday, this month, last month, 7/30-day trailing)
- Order metrics (total, pending, completed, cancelled, completion rate, AOV, error rate)
- Customer metrics (total, new today, returning rate, churn risk)
- Product performance (top selling, declining products)
- Staff performance (if assignedTo field exists)
- Operational metrics (late orders, avg processing time)
- Risk alerts (revenue drop, high cancellation rate)
- **Profit metrics** (7-day and 30-day):
  - Revenue, COGS, gross profit, gross margin
  - Operational costs, net profit, net margin
  - Top profit contributing products
  - Cost breakdown by category

**Usage**:
```typescript
import { getDashboardStats, getInventoryAlerts } from "@/app/(features)/crm/_actions/dashboard_actions"

// Get all dashboard stats including profit metrics
const stats = await getDashboardStats()
const weekProfit = stats.profitMetrics.last7Days
const monthProfit = stats.profitMetrics.last30Days
const topProducts = stats.profitMetrics.topProfitProducts

// Get inventory alerts separately
const alerts = await getInventoryAlerts()
```

### `ai-actions.ts`

**Purpose**: AI-powered analytics for revenue forecasting and business risk assessment.

**Functions**:
- `generateRevenueForecast()` - Uses AI to predict future revenue based on 30 days of historical data
- `generateRiskAssessment()` - Analyzes business metrics to identify operational and financial risks

**Usage**:
```typescript
import { generateRevenueForecast, generateRiskAssessment } from "@/app/(features)/crm/_actions/ai-actions"

// Generate AI forecast (non-blocking)
const forecast = await generateRevenueForecast()

// Generate risk assessment
const assessment = await generateRiskAssessment()
```

**Note**: These actions are designed to run separately from main dashboard load to avoid blocking initial page render.

### `inventory-actions.ts` [DEPRECATED]

**Status**: This file is deprecated. All functions have been merged into `dashboard_actions.ts`.

**Migration Guide**:

| Old (inventory-actions.ts) | New Location |
|---------------------------|--------------|
| `getProfitAnalysis()` | `getDashboardStats().profitMetrics` in `dashboard_actions.ts` |
| `getInventoryAlerts()` | `getInventoryAlerts()` in `dashboard_actions.ts` |

**Before**:
```typescript
import { getInventoryAlerts, getProfitAnalysis } from "@/app/(features)/crm/_actions/inventory-actions"

const profitData = await getProfitAnalysis()
const weekProfit = profitData.last7Days
const monthProfit = profitData.last30Days

const alerts = await getInventoryAlerts()
```

**After**:
```typescript
import { getDashboardStats, getInventoryAlerts } from "@/app/(features)/crm/_actions/dashboard_actions"

// Profit data is now part of dashboard stats
const stats = await getDashboardStats()
const weekProfit = stats.profitMetrics.last7Days
const monthProfit = stats.profitMetrics.last30Days

// Inventory alerts moved to dashboard_actions
const alerts = await getInventoryAlerts()
```

**Action Required**: Update all imports to use `dashboard_actions.ts`.

### `crm-actions.ts` [DEPRECATED]

**Status**: This file is deprecated and maintained only for backward compatibility.

**Migration Guide**:

| Old (crm-actions.ts) | New Location |
|---------------------|--------------|
| `getOrderByIdAction()` | `getOrdersAction()` in `managements/orders/actions.ts` |
| `createOrderAction()` | `createOrderAction()` in `managements/orders/actions.ts` |
| `updateOrderStatusAction()` | `updateOrderAction()` in `managements/orders/actions.ts` |
| `searchCustomersAction()` | `getCustomersAction(query)` in `customers/actions.ts` |
| `getCustomerByIdAction()` | `getCustomersAction()` in `customers/actions.ts` |
| `getRevenueStatsAction()` | `getDashboardStats()` in `dashboard_actions.ts` |

**Action Required**: Update all imports to use feature-specific action files.

## Code Duplication Eliminated

### Before Refactoring
- `filterOrdersByDate()` duplicated in 3 files
- `calculateRevenue()` duplicated in 3 files
- Date boundary calculations duplicated in 3 files
- Revenue calculation logic duplicated across files

### After Refactoring
- Single source of truth for date operations (`utils/date-helpers.ts`)
- Single source of truth for revenue calculations (`utils/revenue-helpers.ts`)
- Consistent behavior across all analytics modules
- Easier to test and maintain

## Benefits

1. **Reduced Code Duplication**: ~200 lines of duplicate code eliminated
2. **Consistency**: All modules use the same calculation logic
3. **Maintainability**: Changes to calculations only need to be made in one place
4. **Testability**: Utility functions can be unit tested independently
5. **Type Safety**: Shared TypeScript types ensure consistency
6. **Performance**: Build time reduced, bundle size optimized

## Testing

All refactored functions maintain the same behavior as before. The build process verifies:
- No TypeScript errors
- All imports resolve correctly
- All Server Actions are properly marked with `"use server"`

## Future Improvements

1. Add unit tests for utility functions
2. Consider extracting customer analytics to separate file
3. Add JSDoc documentation to all exported functions
4. Create shared types for common return structures
5. Implement caching for expensive calculations
