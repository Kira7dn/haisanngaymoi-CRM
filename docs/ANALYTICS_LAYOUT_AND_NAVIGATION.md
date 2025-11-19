# Analytics Layout and Navigation Structure

**Date**: January 2025
**Version**: 2.0

## Overview

The Analytics module has been restructured with its own dedicated layout and header to provide a distinct user experience separate from the main CRM management dashboard. This creates a clearer separation between operational CRM functions and analytical reporting.

## Route Structure

### Main Routes

```
/admin/dashboard              → Management Dashboard (Products, Orders, Customers, etc.)
/admin/analytics              → Analytics & Reports Hub (Landing page)
/admin/analytics/revenue      → Revenue Analytics
/admin/analytics/customer     → Customer Behavior Analytics
/admin/analytics/staff        → Staff Performance Analytics (Admin only)
```

### Layout Hierarchy

```
app/(features)/admin/
├── dashboard/
│   ├── layout.tsx                    # CRM Management Layout (AdminHeader)
│   ├── page.tsx                      # Dashboard Overview
│   ├── products/page.tsx
│   ├── orders/page.tsx
│   └── ... (other CRM pages)
│
└── analytics/
    ├── layout.tsx                    # Analytics Layout (AnalyticsHeader)
    ├── page.tsx                      # Analytics Hub (Landing)
    ├── _components/
    │   └── AnalyticsHeader.tsx       # Analytics-specific header
    ├── revenue/
    │   ├── page.tsx
    │   ├── actions.ts
    │   └── _components/
    ├── customer/
    │   ├── page.tsx
    │   ├── actions.ts
    │   └── _components/
    └── staff/
        ├── page.tsx
        ├── actions.ts
        └── _components/
```

## Header Components

### 1. AdminHeader (Management)

**Location**: `app/(features)/_shared/components/AdminHeader.tsx`

**Purpose**: Navigation for operational management functions

**Features**:
- White background with subtle shadow
- Logo: "Hải Sản Ngày Mới - Management"
- Navigation items:
  - Tổng quan (Dashboard overview)
  - Sản phẩm (Products)
  - Đơn hàng (Orders)
  - Khách hàng (Customers)
  - Chiến dịch (Campaigns)
  - Danh mục (Categories)
  - Banner
  - Bài viết (Posts)
  - Người dùng (Users - admin only)
  - Analytics & Reports (links to analytics hub)

**Design**:
```typescript
<header className="bg-white dark:bg-gray-800 border-b shadow-sm">
  {/* Logo + Brand */}
  <Link href="/admin/dashboard">
    <span>Hải Sản Ngày Mới</span>
    <span>Management</span>
  </Link>

  {/* Navigation */}
  <nav>
    {/* Management function links */}
  </nav>

  {/* User menu & Logout */}
</header>
```

### 2. AnalyticsHeader (Analytics & Reports)

**Location**: `app/(features)/admin/analytics/_components/AnalyticsHeader.tsx`

**Purpose**: Navigation for analytics and reporting modules

**Features**:
- Blue gradient background (from-blue-600 to-indigo-700)
- "Back to Dashboard" button with ChevronLeft icon
- Title: "Analytics & Reports - Business Intelligence Dashboard"
- Navigation items:
  - Revenue Analytics
  - Customer Analytics
  - Staff Performance (admin only)
- Active state: White background with blue text
- Icons: Lucide React icons (TrendingUp, Users, Trophy)

**Design**:
```typescript
<header className="bg-gradient-to-r from-blue-600 to-indigo-700">
  {/* Back to Dashboard */}
  <Link href="/admin/dashboard">
    <ChevronLeft />
    <LayoutDashboard />
  </Link>

  {/* Analytics Brand */}
  <div>
    <BarChart3 />
    <span>Analytics & Reports</span>
    <span>Business Intelligence Dashboard</span>
  </div>

  {/* Analytics Navigation */}
  <nav>
    <Link href="/admin/analytics/revenue">
      <TrendingUp /> Revenue Analytics
    </Link>
    <Link href="/admin/analytics/customer">
      <Users /> Customer Analytics
    </Link>
    {admin && (
      <Link href="/admin/analytics/staff">
        <Trophy /> Staff Performance
      </Link>
    )}
  </nav>

  {/* User menu & Logout */}
</header>
```

**Visual Differences**:
| Feature | AdminHeader | AnalyticsHeader |
|---------|-------------|-----------------|
| Background | White | Blue gradient |
| Brand | "Hải Sản Ngày Mới - Management" | "Analytics & Reports" |
| Icon Style | Emoji | Lucide icons |
| Active State | Blue bg + blue text | White bg + blue text |
| Back Button | No | Yes (to dashboard) |
| Theme | Professional/Clean | Data-focused/Modern |

## Analytics Landing Page

**Location**: `app/(features)/admin/analytics/page.tsx`

**Route**: `/admin/analytics`

**Purpose**: Hub page showcasing all available analytics modules

**Features**:
- Hero section with BarChart3 icon and title
- Grid layout (1 col mobile, 2 col tablet, 3 col desktop)
- Module cards with:
  - Color-coded icons (emerald, cyan, amber)
  - Title and description
  - Key features list (4 items each)
  - "View Analytics →" CTA
  - Hover effects (shadow, border color, translate-y)
- Info panel explaining the analytics module

**Module Cards**:
```typescript
const analyticsModules = [
  {
    href: "/admin/analytics/revenue",
    title: "Revenue Analytics",
    icon: TrendingUp,
    color: "emerald",
    features: [
      "Period comparison & trends",
      "Top performing products",
      "Order status distribution",
      "Average order value tracking"
    ]
  },
  {
    href: "/admin/analytics/customer",
    title: "Customer Behavior Analytics",
    icon: Users,
    color: "cyan",
    features: [
      "RFM segmentation (11 segments)",
      "Churn risk detection",
      "Cohort retention analysis",
      "Purchase pattern insights"
    ]
  },
  {
    href: "/admin/analytics/staff",
    title: "Staff Performance Analytics",
    icon: Trophy,
    color: "amber",
    features: [
      "Team performance metrics",
      "Staff leaderboard & rankings",
      "Performance tier classification",
      "Daily activity tracking"
    ]
  }
]
```

## Dashboard Integration

### Featured Analytics Card

**Location**: `app/(features)/admin/dashboard/page.tsx`

**Purpose**: Prominent call-to-action to analytics section from main dashboard

**Design**:
```typescript
<Link href="/admin/analytics/revenue" className="block lg:col-span-2">
  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-lg">
    <h3>Analytics & Reports</h3>
    <p>Comprehensive business intelligence dashboard...</p>
    <div className="mt-4 flex gap-2">
      <span className="badge">Revenue Analytics</span>
      <span className="badge">Customer Insights</span>
      {admin && <span className="badge">Staff Performance</span>}
    </div>
  </div>
</Link>
```

This card:
- Spans 2 columns on large screens
- Uses blue gradient matching AnalyticsHeader
- Shows available modules as badges
- Links to revenue analytics by default

### Individual Module Cards

Still present for direct access:
- Revenue Analytics (emerald theme)
- Customer Analytics (cyan theme)
- Staff Performance (amber theme, admin only)

## Navigation Flow

### From Management to Analytics

```
User Journey:
1. Login → /admin/dashboard (AdminHeader - Management)
2. Click "Analytics & Reports" in nav OR featured card
3. → /admin/analytics (AnalyticsHeader + Landing page)
4. Click module card
5. → /admin/analytics/[module] (AnalyticsHeader + Module page)
```

### From Analytics to Dashboard

```
User Journey:
1. In analytics section (AnalyticsHeader visible)
2. Click "Back to Dashboard" (ChevronLeft + LayoutDashboard icon)
3. → /admin/dashboard (AdminHeader)
```

### Between Analytics Modules

```
User Journey:
1. In /admin/analytics/revenue (AnalyticsHeader)
2. Click "Customer Analytics" in AnalyticsHeader nav
3. → /admin/analytics/customer (same AnalyticsHeader, different content)
```

## Responsive Behavior

### Desktop (lg+)
- AdminHeader: Horizontal nav bar with all items visible
- AnalyticsHeader: Horizontal nav bar with module icons + labels
- Dashboard: 3-column grid for quick actions
- Analytics Landing: 3-column grid for module cards

### Tablet (md-lg)
- Headers: Horizontal nav, some labels may wrap
- Dashboard: 2-column grid
- Analytics Landing: 2-column grid

### Mobile (< md)
- Headers: Hamburger menu with slide-out navigation
- User info shown in mobile menu
- Dashboard: 1-column grid
- Analytics Landing: 1-column grid

## Role-Based Access

### Admin Role
- Full access to all CRM functions
- Full access to all analytics modules:
  - Revenue Analytics ✓
  - Customer Analytics ✓
  - Staff Performance ✓

### Sale Role
- Access to most CRM functions
- Limited analytics access:
  - Revenue Analytics ✓
  - Customer Analytics ✓
  - Staff Performance ✗ (hidden from nav)

### Warehouse Role
- Limited CRM functions (Products, Orders)
- No analytics access (nav item hidden)

## Visual Identity

### Color Scheme

**AdminHeader (Management)**:
- Primary: White/Gray-800 (dark mode)
- Accent: Blue-100/Blue-900 for active state
- Text: Gray-900/White
- Border: Gray-200/Gray-700

**AnalyticsHeader (Reports)**:
- Primary: Blue-600 to Indigo-700 gradient
- Accent: White for active state
- Text: White/Blue-100
- Border: Blue-700/Blue-900

**Module Colors**:
- Revenue: Emerald (financial/growth)
- Customer: Cyan (people/engagement)
- Staff: Amber (achievement/awards)

### Typography

**Headers**:
- Brand/Logo: `text-lg font-bold`
- Subtitle: `text-xs` (gray-500 for admin, blue-100 for analytics)
- Nav items: `text-sm font-medium`

**Landing Page**:
- Hero title: `text-4xl font-bold`
- Hero subtitle: `text-lg`
- Module title: `text-xl font-bold`
- Module description: `text-sm`

## Files Created/Modified

### New Files (3)
1. `app/(features)/admin/analytics/layout.tsx` - Analytics layout wrapper
2. `app/(features)/admin/analytics/_components/AnalyticsHeader.tsx` - Analytics navigation header
3. `app/(features)/admin/analytics/page.tsx` - Analytics hub landing page

### Modified Files (2)
1. `app/(features)/_shared/components/AdminHeader.tsx`
   - Changed "Dashboard" → "Tổng quan"
   - Changed "Analytics" → "Analytics & Reports"
   - Made analytics accessible to sale role
   - Updated brand to "Hải Sản Ngày Mới - Management"

2. `app/(features)/admin/dashboard/page.tsx`
   - Added featured "Analytics & Reports" card (2-column span)
   - Updated individual analytics module cards
   - Improved visual hierarchy

## Benefits of This Structure

1. **Clear Separation**: Management operations vs. Analytics & Reports
2. **Visual Distinction**: Different headers help users know which mode they're in
3. **Easy Navigation**: Back button in analytics, analytics link in management dashboard
4. **Scalability**: Easy to add new analytics modules
5. **Branding**: Each section has its own identity
6. **Role Management**: Simple to control access per role
7. **Better UX**: Users don't get lost between operational and analytical views

## Future Enhancements

### Short Term
- [ ] Add breadcrumb navigation in analytics pages
- [ ] Add "Recently Viewed" analytics modules
- [ ] Add keyboard shortcuts (e.g., Alt+D for dashboard, Alt+A for analytics)

### Long Term
- [ ] Custom dashboard builder (pin favorite analytics widgets)
- [ ] Saved filters/views per analytics module
- [ ] Share analytics reports via email
- [ ] Export analytics to PDF/Excel from header

## Testing Checklist

- [ ] Navigate from dashboard to analytics hub
- [ ] Navigate between analytics modules
- [ ] Back button returns to dashboard
- [ ] Mobile menu works in both headers
- [ ] Role-based access enforced (hide staff for non-admin)
- [ ] Active state highlights correct nav item
- [ ] Logout works from both headers
- [ ] Dark mode works in both headers
- [ ] Featured analytics card shows correct badges per role

---

**Summary**: The analytics section now has its own dedicated layout with a distinctive blue gradient header, separate from the CRM management dashboard. Users can easily navigate between operational CRM tasks and analytical reporting, with clear visual cues indicating which mode they're in.
