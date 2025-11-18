## Modules Overview & Implementation Status

| Module         | Domain | Use Cases | Repository | API Routes | UI Page | Status |
| -------------- | ------ | --------- | ---------- | ---------- | ------- | ------ |
| **Auth**       | ✅     | ✅ (7)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Categories** | ✅     | ✅ (5)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Posts**      | ✅     | ✅ (4)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Products**   | ✅     | ✅ (5)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Banners**    | ✅     | ✅ (5)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Customers**  | ✅     | ✅ (6)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Orders**     | ✅     | ✅ (11)   | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Dashboard**  | N/A    | ✅        | N/A        | ✅         | ✅      | ✅ **Complete** |
| **Campaigns**  | ✅     | ✅ (6)    | ✅         | ✅         | ✅      | ✅ **Complete** |
| **Stations**   | ✅     | ✅ (5)    | ✅         | ✅         | ✅      | ✅ **Complete** |




## Domain Entity: [core/domain/admin-user.ts](core/domain/admin-user.ts)
```typescript
interface AdminUser {
  id: string          // MongoDB ObjectId as string
  email: string
  passwordHash: string
  name: string
  role: "admin" | "sale" | "warehouse"
  status: "active" | "inactive"
  avatar?: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}
```

**Use Cases:** [core/application/usecases/admin-user/](core/application/usecases/admin-user/)
1. ✅ `LoginUseCase` - Xác thực email/password với bcrypt
2. ✅ `RegisterAdminUserUseCase` - Tạo tài khoản (admin only)
3. ✅ `GetCurrentUserUseCase` - Lấy thông tin user hiện tại
4. ✅ `ChangePasswordUseCase` - Đổi mật khẩu
5. ✅ `GetAllUsersUseCase` - List users với filter
6. ✅ `UpdateAdminUserUseCase` - Cập nhật user
7. ✅ `DeleteAdminUserUseCase` - Xóa user (admin only)

**Repository:** [infrastructure/repositories/admin-user-repo.ts](infrastructure/repositories/admin-user-repo.ts)
- Extends `BaseRepository<AdminUser, string>`
- Password hashing với bcrypt (salt rounds = 10)
- Methods: CRUD + verifyCredentials(), changePassword(), search/filter

**API Endpoints:** [app/api/auth/](app/api/auth/)
- ✅ `POST /api/auth/login` - Login
- ✅ `POST /api/auth/logout` - Logout
- ✅ `GET /api/auth/me` - Get current user
- ✅ `POST /api/auth/register` - Register (admin only)
- ✅ `POST /api/auth/change-password` - Change password
- ✅ `GET /api/auth/users` - Get all users (admin only)
- ✅ `PATCH /api/auth/users/[id]` - Update user (admin only)
- ✅ `DELETE /api/auth/users/[id]` - Delete user (admin only)

**UI Pages:** [app/(features)/admin/](app/(features)/admin/)
- ✅ `/admin/login` - Beautiful login page với error handling
- ✅ `/admin/dashboard` - Dashboard với role-based visibility
- ✅ `/admin/users` - User management (admin only)


## Domain: [core/domain/category.ts](core/domain/category.ts)
```typescript
interface Category {
  id: number          // Auto-increment
  name: string
  image: string
  createdAt: Date
  updatedAt: Date
}
```

**Use Cases:** [core/application/usecases/category/](core/application/usecases/category/)
1. ✅ `CreateCategoryUseCase`
2. ✅ `GetCategoriesUseCase`
3. ✅ `GetCategoryByIdUseCase`
4. ✅ `UpdateCategoryUseCase`
5. ✅ `DeleteCategoryUseCase`

**Repository:** [infrastructure/repositories/category-repo.ts](infrastructure/repositories/category-repo.ts)
- Extends `BaseRepository<Category, number>`
- Auto-increment ID strategy

**API Endpoints:** [app/api/categories/](app/api/categories/)
- `GET /api/categories` - Get all
- `POST /api/categories` - Create new
- `GET /api/categories/[id]` - Get by ID
- `PATCH /api/categories/[id]` - Update
- `DELETE /api/categories/[id]` - Delete

**UI Page:** [app/(features)/admin/dashboard/categories/page.tsx](app/(features)/admin/dashboard/categories/page.tsx)
- ✅ List view with inline editing
- ✅ Create form
- ✅ Update form
- ✅ Delete action
- ✅ Server Actions in `actions.ts`


## Domain: [core/domain/product.ts](core/domain/product.ts)
```typescript
interface Product {
  id: number              // Auto-increment
  categoryId: number
  name: string
  price: number
  originalPrice: number
  image: string
  detail: string
  sizes?: SizeOption[]    // Multiple size options
  colors?: string[]       // Color variants
  createdAt: Date
  updatedAt: Date
}

interface SizeOption {
  label: string           // e.g., "500g", "1kg", "2kg"
  price: number
  originalPrice?: number
}
```

**Use Cases:** [core/application/usecases/product/](core/application/usecases/product/)
1. ✅ `CreateProductUseCase`
2. ✅ `FilterProductsUseCase` - With categoryId & search
3. ✅ `GetProductByIdUseCase`
4. ✅ `UpdateProductUseCase`
5. ✅ `DeleteProductUseCase`

**Repository:** [infrastructure/repositories/product-repo.ts](infrastructure/repositories/product-repo.ts)
- Auto-increment ID
- Size normalization logic

**API Endpoints:** [app/api/products/](app/api/products/)
- `GET /api/products?categoryId=1&search=tom` - Filter with params
- `POST /api/products` - Create
- `GET /api/products/[id]` - Get by ID
- `PATCH /api/products/[id]` - Update
- `DELETE /api/products/[id]` - Delete

**UI Pages:** [app/(features)/admin/dashboard/products/](app/(features)/admin/dashboard/products/)
- ✅ `page.tsx` - Main products page with grid layout
- ✅ `actions.ts` - Server Actions for CRUD operations
- ✅ `components/ProductList.tsx` - Product grid with filtering
- ✅ `components/ProductForm.tsx` - Create/Edit modal form


## Domain: [core/domain/order.ts](core/domain/order.ts)
```typescript
interface Order {
  id: number                    // Auto-increment
  zaloUserId: string            // Customer Zalo ID
  checkoutSdkOrderId?: string   // Payment gateway order ID
  status: "pending" | "shipping" | "completed"
  paymentStatus: "pending" | "success" | "failed"
  items: OrderItem[]
  delivery: DeliveryInfo
  total: number
  note?: string
  createdAt: Date
  updatedAt: Date
}

interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  size?: string
  color?: string
}

interface DeliveryInfo {
  name: string
  phone: string
  address: string
  location?: { lat: number; lng: number }
}
```

**Use Cases:** [core/application/usecases/order/](core/application/usecases/order/)
1. ✅ `CreateOrderUseCase`
2. ✅ `GetOrdersUseCase` - Filter by status, zaloUserId
3. ✅ `GetOrderByIdUseCase`
4. ✅ `UpdateOrderUseCase`
5. ✅ `DeleteOrderUseCase`
6. ✅ `LinkOrderUseCase` - Link to payment gateway
7. ✅ `CheckPaymentStatusUseCase`
8. ✅ `PaymentCallbackUseCase` - Handle payment callback
9. ✅ `CheckOrderStatusUseCase`
10. ✅ `MacRequestUseCase` - Generate MAC for payment

**Payment Integration:**
- ✅ Zalo Payment SDK
- ✅ VNPay Gateway
- ✅ IPN (Instant Payment Notification) handler

**API Endpoints:** [app/api/orders/](app/api/orders/)
- `GET /api/orders?status=pending&zaloUserId=xxx` - Get with filters
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get by ID
- `PATCH /api/orders/[id]` - Update
- `DELETE /api/orders/[id]` - Delete
- `POST /api/orders/link` - Link to payment
- `POST /api/orders/callback` - Payment callback
- `GET /api/orders/status` - Check payment status
- `POST /api/orders/mac` - MAC request
- `POST /api/orders/ipn` - VNPay IPN webhook

**UI Implementation:** ✅ **COMPLETE**

**Server Actions:** [app/(features)/admin/dashboard/orders/actions.ts](app/(features)/admin/dashboard/orders/actions.ts)
- ✅ `getOrdersAction()` - Get orders with filters
- ✅ `createOrderAction()` - Create new order
- ✅ `updateOrderAction()` - Update order status/payment
- ✅ `deleteOrderAction()` - Delete order
- ✅ Uses injected use cases from `depends.ts`
- ✅ Proper `revalidatePath()` after mutations

**Main Page:** [app/(features)/admin/dashboard/orders/page.tsx](app/(features)/admin/dashboard/orders/page.tsx)
- ✅ Server Component with data fetching
- ✅ Uses `getOrdersUseCase()` for initial data
- ✅ JSON serialization for Date objects
- ✅ Passes data to OrderList component

**Components:** [app/(features)/admin/dashboard/orders/components/](app/(features)/admin/dashboard/orders/components/)

1. **OrderList.tsx** - Main table component with:
   - ✅ Status filter (All, Pending, Shipping, Completed) with counts
   - ✅ Payment status filter (All, Pending, Success, Failed)
   - ✅ Inline status updates via dropdown
   - ✅ Color-coded status badges (order & payment)
   - ✅ Customer info display (name, phone)
   - ✅ Total price with currency formatting
   - ✅ Actions: View details, Delete
   - ✅ Empty state handling
   - ✅ Dark mode support

2. **OrderDetailModal.tsx** - Detailed order view with:
   - ✅ Order header (ID, created date, status badges)
   - ✅ Customer information section (name, phone, address, Zalo ID, location)
   - ✅ Order items table (product names, quantities, prices, subtotals)
   - ✅ Total price calculation
   - ✅ Payment information (Checkout SDK Order ID)
   - ✅ Notes section (if available)
   - ✅ Modal overlay with close button
   - ✅ Responsive design
   - ✅ Dark mode support

## Domain [core/domain/customer.ts](core/domain/customer.ts)
```typescript
interface Customer {
  id: string              // External platform ID (Zalo/FB/Telegram)
  name?: string
  avatar?: string
  phone?: string
  email?: string
  foundation: string      // "Zalo" | "Facebook" | "Telegram"
  address?: string
  createdAt?: Date
  updatedAt?: Date
}
```

**Use Cases:** [core/application/usecases/customer/](core/application/usecases/customer/)
1. ✅ `CreateCustomerUseCase`
2. ✅ `GetAllCustomersUseCase`
3. ✅ `GetCustomerByIdUseCase`
4. ✅ `UpdateCustomerUseCase`
5. ✅ `DeleteCustomerUseCase`
6. ✅ `SearchCustomersByNameUseCase`

**API Endpoints:** [app/api/customers/](app/api/customers/)
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get by ID
- `PATCH /api/customers/[id]` - Update
- `DELETE /api/customers/[id]` - Delete
- `GET /api/customers/search?name=...` - Search by name

**UI Pages:** [app/(features)/admin/dashboard/customers/](app/(features)/admin/dashboard/customers/)
- ✅ `page.tsx` - Main customers page with table layout
- ✅ `actions.ts` - Server Actions for CRUD operations
- ✅ `components/CustomerList.tsx` - Customer table with filtering
- ✅ `components/CustomerForm.tsx` - Create/Edit modal form

## Domain [core/domain/banner.ts](core/domain/banner.ts)
```typescript
interface Banner {
  id: number          // Auto-increment
  url: string         // Image URL
  createdAt: Date
  updatedAt: Date
}
```

**Use Cases:** ✅ Full CRUD (5 use cases)
1. ✅ `GetBannersUseCase`
2. ✅ `CreateBannerUseCase`
3. ✅ `GetBannerByIdUseCase`
4. ✅ `UpdateBannerUseCase`
5. ✅ `DeleteBannerUseCase`

**API Endpoints:** [app/api/banners/](app/api/banners/)
- `GET /api/banners` - Get all banners
- `POST /api/banners` - Create banner
- `GET /api/banners/[id]` - Get by ID
- `PATCH /api/banners/[id]` - Update
- `DELETE /api/banners/[id]` - Delete

**UI Pages:** [app/(features)/admin/dashboard/banners/](app/(features)/admin/dashboard/banners/)
- ✅ `page.tsx` - Main banners page with grid layout
- ✅ `actions.ts` - Server Actions for CRUD operations
- ✅ `components/BannerList.tsx` - Banner grid with previews
- ✅ `components/BannerForm.tsx` - Create/Edit modal form

## Domain [core/domain/post.ts](core/domain/post.ts)
```typescript
interface Post {
  id: string          // MongoDB ObjectId
  title: string
  body: string
  createdAt: Date
  updatedAt: Date
}
```

**Use Cases:** ✅ 4 use cases (Create, Get, Update, Delete)

**UI Page:** [app/(features)/admin/dashboard/posts/page.tsx](app/(features)/admin/dashboard/posts/page.tsx)
- ✅ PostForm component
- ✅ PostList component
- ✅ PostFilter component
- ✅ Zustand store (usePostStore)
- ✅ Server Actions


## Domain [core/domain/campaign.ts](core/domain/campaign.ts)
```typescript
interface Campaign {
  id: number
  name: string
  description: string
  image: string
  startDate: Date
  endDate: Date
  status: "upcoming" | "active" | "ended"
  type: "discount" | "branding" | "kol"
  products: number[]        // Product IDs
  platforms: CampaignPlatform[]
  createdAt: Date
  updatedAt: Date
}

interface CampaignPlatform {
  platform: "facebook" | "tiktok" | "zalo" | "shopee"
  campaignId: string        // External platform campaign ID
  utmParams: {
    source: string
    medium: string
    campaign: string
  }
  metrics?: {
    impressions?: number
    clicks?: number
    ctr?: number
  }
}
```

**Use Cases:** [core/application/usecases/campaign/](core/application/usecases/campaign/)
1. ✅ `GetAllCampaignsUseCase`
2. ✅ `GetCampaignByIdUseCase`
3. ✅ `GetCampaignsByStatusUseCase`
4. ✅ `CreateCampaignUseCase`
5. ✅ `UpdateCampaignUseCase`
6. ✅ `DeleteCampaignUseCase`

**Repository:** [infrastructure/repositories/campaign-repo.ts](infrastructure/repositories/campaign-repo.ts)
- Extends `BaseRepository<Campaign, number>`
- Methods: CRUD + filter by status, active campaigns

**API Endpoints:** [app/api/campaigns/](app/api/campaigns/)
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns?status=active` - Filter by status
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get by ID
- `PATCH /api/campaigns/[id]` - Update
- `DELETE /api/campaigns/[id]` - Delete

**UI Pages:** [app/(features)/admin/dashboard/campaigns/](app/(features)/admin/dashboard/campaigns/)
- ✅ `page.tsx` - Main campaigns page
- ✅ `actions.ts` - Server Actions for CRUD
- ✅ `components/CampaignList.tsx` - Campaign listing
- ✅ `components/CampaignForm.tsx` - Create/Edit form


## Components [app/(features)/admin/dashboard/components/](app/(features)/admin/dashboard/components/)

1. **DashboardStats.tsx** - KPI Cards:
   - ✅ Total Revenue (with currency formatting)
   - ✅ Total Orders (with pending count)
   - ✅ Total Customers
   - ✅ Total Products
   - ✅ Color-coded icon backgrounds
   - ✅ Optional trend indicators
   - ✅ Responsive grid layout

2. **OrdersChart.tsx** - Visual Analytics:
   - ✅ Order Status chart (horizontal progress bars)
   - ✅ Payment Status chart (horizontal progress bars)
   - ✅ Percentage calculations
   - ✅ Animated transitions
   - ✅ Color-coded indicators (yellow/blue/green for status)
   - ✅ Dark mode support

3. **RecentOrders.tsx** - Activity Feed:
   - ✅ Last 5 orders display
   - ✅ Order ID, status, and payment badges
   - ✅ Customer name and timestamp
   - ✅ Total amount with currency formatting
   - ✅ Link to full orders page
   - ✅ Hover effects and transitions

**Features Implemented:**
- ✅ Real-time data aggregation from existing modules
- ✅ No additional database queries needed
- ✅ Clean Architecture (uses existing use cases)
- ✅ Statistics cards with key business metrics
- ✅ Visual analytics with progress bars
- ✅ Recent activity feed
- ✅ Quick action cards for all modules
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Dark mode support throughout
- ✅ Currency formatting (VND)
- ✅ Empty state handling
- ✅ Error handling with fallbacks

**Analytics Metrics:**
- Revenue: Total from successful payments
- Orders: Total, pending, completed counts
- Order Status: Percentage breakdown
- Payment Status: Success/pending/failed distribution
- Recent Activity: Last 5 orders with details



💡 **Tóm gọn:**

* **Analytics & Insights:** Dashboard tổng quan, phân tích chi tiết, dự đoán AI.
* **Trợ lý AI:** Chatbot nội bộ giúp truy vấn dữ liệu & gợi ý hành động.
* **Customer Care:** Tích hợp ticket, gửi tin nhắn/email, lịch sử chăm sóc, đánh giá hài lòng, template AI.


## Next Steps


### **📊 1. Phân tích & Báo cáo (Analytics & Insights)**

**Mục tiêu:** Cung cấp góc nhìn tổng hợp về doanh số, khách hàng, hiệu suất nhân viên và chiến dịch marketing để ra quyết định chiến lược.

**Subpages chi tiết:**

#### **1.1 Doanh thu & đơn hàng**

* **KPI chính:** Tổng doanh thu, tổng đơn hàng, đơn hàng trung bình, tỷ lệ hủy / hoàn trả.
* **Charts:**

  * Doanh thu theo ngày/tuần/tháng (line chart).
  * Đơn hàng theo trạng thái: Pending / Shipping / Completed / Cancelled (pie/bar chart).
  * Top sản phẩm bán chạy, top khách hàng theo doanh thu.
* **Insights:** So sánh với kỳ trước, xác định sản phẩm / dịch vụ cần ưu tiên.

#### **1.2 Hành vi khách hàng & nhóm khách hàng**

* **KPI chính:** Số khách hàng mới, khách hàng quay lại, tỷ lệ churn.
* **Charts:**

  * Nhóm khách hàng theo phân khúc: VIP / trung bình / mới.
  * Thói quen mua hàng: thời gian mua, giá trị đơn trung bình, loại sản phẩm ưa thích.
* **Insights:** Nhóm khách hàng cần chăm sóc, upsell, cross-sell.

#### **1.3 Hiệu suất nhân viên / sale**

* **KPI chính:** Doanh số theo nhân viên, số đơn hàng xử lý, tỷ lệ conversion.
* **Charts:**

  * Top performer, biểu đồ ranking nhân viên.
  * Tỷ lệ follow-up khách hàng thành công.
* **Insights:** Phân tích hiệu quả từng sale, hỗ trợ đào tạo hoặc điều chỉnh chiến lược.

#### **1.4 Chiến dịch marketing**

* **KPI chính:** CTR, impression, conversion rate theo chiến dịch / nền tảng.
* **Charts:**

  * Hiệu quả theo kênh: Facebook, Zalo, TikTok.
  * ROI / doanh thu trên từng chiến dịch.
* **Insights:** Chiến dịch nào hiệu quả, nên tăng ngân sách hay điều chỉnh nội dung.

#### **1.5 Báo cáo AI dự đoán (Forecasting) 🧠**

* Dự đoán doanh thu tuần/tháng tới dựa trên dữ liệu lịch sử.
* Forecast tồn kho, sản phẩm sắp bán hết.
* Nhận diện xu hướng khách hàng, dự đoán churn hoặc upsell.
* **Charts:** Line chart dự đoán vs thực tế, heatmap theo nhóm sản phẩm.

---

### **🧠 2. Trợ lý AI CRM (Internal Chatbot)**

**Mục tiêu:** Giúp nhân viên nhanh chóng hỏi – nhận phản hồi từ CRM mà không cần tra cứu thủ công.

**Ví dụ câu hỏi & chức năng:**

* “Hôm nay có ai cần chăm sóc lại không?” → Liệt kê khách hàng cần follow-up.
* “Doanh thu tháng này giảm bao nhiêu %?” → Trả về báo cáo so sánh.
* “Top 5 khách hàng chưa mua lại 60 ngày?” → Trả về danh sách và giá trị đơn hàng.
* “Sản phẩm nào bán chạy tuần này?” → Dữ liệu real-time từ hệ thống.
* **Tính năng bổ sung:**

  * GPT tự gợi ý template chăm sóc khách hàng (liên kết module 4.5).
  * Hỗ trợ generate báo cáo nhanh dưới dạng PDF/Excel.

---

### **❤️ 3. Chăm sóc khách hàng (Customer Care)**

**Mục tiêu:** Tối ưu trải nghiệm khách hàng, ghi nhận tương tác và tự động hóa chăm sóc.

**Subpages chi tiết:**

### **3.1 Ticket CSKH**

* Danh sách yêu cầu hỗ trợ, phân loại, gán người xử lý.
* Status: Pending / In Progress / Solved.

### **3.2 Gửi tin nhắn / Email**

* Soạn & gửi theo nhóm khách hàng.
* Tích hợp template sẵn (3.5) hoặc AI gợi ý nội dung cá nhân hóa.

### **3.3 Lịch sử chăm sóc**

* Ai chăm sóc khách hàng, khi nào, nội dung gì.
* Cho phép lọc theo nhân viên, khách hàng, thời gian.

### **3.4 Đánh giá hài lòng**

* Kết quả khảo sát NPS, CSAT.
* Biểu đồ xu hướng theo thời gian.

### **3.5 Mẫu tin nhắn / kịch bản AI**

* Lưu trữ template chăm sóc.
* GPT tự gợi ý nội dung dựa trên lịch sử tương tác và hành vi khách hàng.

---

