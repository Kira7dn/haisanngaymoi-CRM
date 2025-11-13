# 🧭 NextJS 16 Fullstack Clean Architecture - Hải Sản Ngay Mới CRM

### 🚀 Mục tiêu

* Xây dựng ứng dụng **Next.js 16** theo mô hình **Clean / Onion Architecture**
* Kết hợp **Server Components + Client Components**
* **Full-stack E-commerce** với MongoDB, Payment Gateway, Queue System
* Quản lý **state bằng Zustand**
* **API Routes** với Clean Architecture thay vì Server Actions
* Viết **unit / integration / UI tests** đầy đủ bằng **Vitest**
* **Payment Integration**: VNPay, ZaloPay với webhook handling
* **Queue System**: BullMQ cho background job processing

---

## 📁 Cấu trúc thư mục tổng thể

```
.
├─ app/
│  ├─ api/
│  │  ├─ banners/           # CRUD banners
│  │  ├─ categories/        # CRUD categories
│  │  ├─ checkout/          # Payment operations
│  │  │  ├─ callback/       # Payment callback
│  │  │  ├─ link/           # Link order to payment
│  │  │  ├─ mac/            # Generate payment MAC
│  │  │  └─ status/         # Check payment status
│  │  ├─ health/            # Health check
│  │  ├─ ipn/               # VNPay IPN webhook
│  │  ├─ orders/            # CRUD orders
│  │  ├─ products/          # CRUD products
│  │  ├─ stations/          # CRUD stations
│  │  ├─ user/              # User management
│  │  └─ utils/             # Utility APIs (location, phone decode)
│  ├─ (features)/
│  │  └─ posts/             # Demo posts feature
│  └─ (policies)/
│     ├─ cookies/
│     ├─ privacy/
│     └─ terms/
│
├─ core/
│  ├─ domain/
│  │  ├─ banner.ts
│  │  ├─ category.ts
│  │  ├─ order.ts
│  │  ├─ post.ts
│  │  ├─ station.ts
│  │  ├─ user.ts
│  │  └─ __tests__/
│  ├─ application/
│  │   ├─ interfaces/
│  │   │  ├─ location-service.ts
│  │   │  ├─ order-service.ts
│  │   │  ├─ payment-gateway.ts
│  │   │  ├─ phone-service.ts
│  │   │  ├─ queue-service.ts
│  │   │  └─ vnpay-gateway.ts
│  │   └─ usecases/
│  │       ├─ banner/        # get-banners, create-banner, update-banner, delete-banner
│  │       ├─ category/      # get-categories, create-category, update-category, delete-category
│  │       ├─ checkout/      # check-order-status, mac-request
│  │       ├─ location/      # decode-location
│  │       ├─ order/         # CRUD + link-order + payment-callback
│  │       ├─ phone/         # decode-phone
│  │       ├─ station/       # get-stations, create-station, update-station, delete-station
│  │       ├─ user/          # upsert-user, get-user-by-id
│  │       └─ vnpay/         # handle-vnpay-ipn
│
├─ infrastructure/
│  ├─ db/
│  │  ├─ mongo.ts
│  │  └─ __tests__/
│  ├─ gateways/
│  │  ├─ zalopay-gateway.ts
│  │  ├─ zalo-location-gateway.ts
│  │  ├─ zalo-phone-gateway.ts
│  │  ├─ vnpay-gateway.ts
│  │  └─ __tests__/
│  ├─ queue/
│  │  ├─ bullmq-adapter.ts
│  │  ├─ order-worker.ts
│  │  └─ __tests__/
│  └─ repositories/
│     ├─ banner-repo.ts
│     ├─ category-repo.ts
│     ├─ order-repo.ts
│     ├─ product-repo.ts
│     ├─ station-repo.ts
│     └─ user-repo.ts
│
├─ lib/
│  ├─ container.ts          # Dependency Injection Container
│  ├─ webhook.ts            # Webhook utilities
│  └─ utils.ts
│
├─ @shared/
│  └─ ui/
│     ├─ button.tsx
│     ├─ carousel.tsx
│     └─ tabs.tsx
│
├─ __tests__/
│  ├─ integration/
│  │  ├─ check-out.test.ts
│  │  ├─ location.test.ts
│  │  ├─ payment-worker.test.ts
│  │  └─ ...
│  └─ unit/
│
└─ vitest.config.ts
```

---

## ⚙️ 1. Cài đặt

```bash
npm install
```

File `.env.local`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=ClusterName
MONGODB_DB=database_name
VNP_HASH_SECRET=your_vnpay_secret
CHECKOUT_SDK_PRIVATE_KEY=your_checkout_key
ZALO_APP_SECRET=your_zalo_app_secret
REDIS_URL=redis://localhost:6379
ENABLE_ORDER_WORKER=true
```

---

## 🧱 3. Domain Layer - Core Entities

### **Order Entity**
- **Định nghĩa**: Đại diện cho đơn hàng trong hệ thống e-commerce
- **Mục đích**: Quản lý thông tin đơn hàng, thanh toán, giao hàng
- **File**: `core/domain/order.ts`

### **Banner Entity**
- **Định nghĩa**: Đại diện cho banner quảng cáo trên website
- **Mục đích**: Hiển thị thông tin quảng cáo, khuyến mãi
- **File**: `core/domain/banner.ts`

### **Category Entity**
- **Định nghĩa**: Đại diện cho danh mục sản phẩm
- **Mục đích**: Phân loại và tổ chức sản phẩm
- **File**: `core/domain/category.ts`

### **Product Entity**
- **Định nghĩa**: Đại diện cho sản phẩm trong catalog
- **Mục đích**: Lưu trữ thông tin chi tiết sản phẩm
- **File**: `core/domain/product.ts`

### **Station Entity**
- **Định nghĩa**: Đại diện cho điểm bán/trạm trong hệ thống
- **Mục đích**: Quản lý các địa điểm kinh doanh
- **File**: `core/domain/station.ts`

### **User Entity**
- **Định nghĩa**: Đại diện cho người dùng hệ thống
- **Mục đích**: Quản lý thông tin tài khoản và profile
- **File**: `core/domain/user.ts`

### **Post Entity (Demo)**
- **Định nghĩa**: Entity demo cho bài viết blog
- **Mục đích**: Minh họa Clean Architecture pattern
- **File**: `core/domain/post.ts`

---

## ⚙️ 4. Application Layer

### **Use Cases** (Business Logic):

#### **Order Management** (`core/application/usecases/order/`)
- `get-orders.ts` - List orders with filters
- `create-order.ts` - Create new order
- `get-order-by-id.ts` - Get specific order
- `update-order.ts` - Update order
- `delete-order.ts` - Delete order
- `link-order.ts` - Link order to payment
- `payment-callback.ts` - Handle payment callback

#### **Payment Operations** (`core/application/usecases/checkout/`)
- `mac-request.ts` - Generate payment MAC
- `check-order-status.ts` - Check payment status

#### **External Integrations**:
- `decode-location.ts` - Decode location from Zalo
- `decode-phone.ts` - Decode phone from Zalo
- `handle-vnpay-ipn.ts` - Process VNPay IPN

#### **CRUD Operations**:
- **Banner**: get-banners, create-banner, update-banner, delete-banner
- **Category**: get-categories, create-category, update-category, delete-category
- **Station**: get-stations, create-station, update-station, delete-station
- **User**: upsert-user, get-user-by-id

### **Interfaces** (Dependency Inversion):
```typescript
// core/application/interfaces/payment-gateway.ts
export interface PaymentGateway {
  processPaymentUpdate(orderId: number, sdkOrderId: string, miniAppId?: string): Promise<void>;
}

// core/application/interfaces/order-service.ts
export interface OrderService {
  getById(id: number): Promise<Order | null>;
  update(id: number, data: Partial<Order>): Promise<Order | null>;
  // ... more methods
}
```

---

## 🏗️ 5. Infrastructure Layer

### **Payment Gateways**:

#### **ZaloPay Gateway** (`infrastructure/gateways/zalopay-gateway.ts`)
```typescript
export class ZaloPayGateway implements PaymentGateway {
  async processPaymentUpdate(orderId: number, sdkOrderId: string, miniAppId?: string): Promise<void> {
    // Check payment status via ZaloPay API
    // Update order payment status in database
  }
}
```
- **Mục đích**: Xử lý thanh toán qua ZaloPay
- **Chức năng**: Query payment status, update order status

#### **VNPay Gateway** (`infrastructure/gateways/vnpay-gateway.ts`)
```typescript
export class VnpayGatewayImpl implements VnpayGateway {
  async validateSignature(params: VnpayIpnParams): Promise<boolean> {
    // HMAC SHA512 signature validation
  }

  parsePaymentResult(params: VnpayIpnParams): VnpayIpnResult {
    // Parse payment response from VNPay
  }
}
```
- **Mục đích**: Xử lý thanh toán qua VNPay
- **Chức năng**: IPN signature validation, payment result parsing

### **External API Integrations**:

#### **Zalo Location Gateway** (`infrastructure/gateways/zalo-location-gateway.ts`)
```typescript
export class ZaloLocationGateway implements LocationService {
  async decodeLocation(token: string, accessToken: string): Promise<{location: {lat: number, lng: number}, address: string | null}> {
    // Call Zalo Open API for location data
    // Perform reverse geocoding with Nominatim
    // Return coordinates and address
  }
}
```
- **Mục đích**: Decode location từ Zalo Mini App tokens
- **Chức năng**: Zalo API call + reverse geocoding

#### **Zalo Phone Gateway** (`infrastructure/gateways/zalo-phone-gateway.ts`)
```typescript
export class ZaloPhoneGateway implements PhoneService {
  async decodePhone(token: string, accessToken: string): Promise<string> {
    // Call Zalo Open API for phone number
    // Parse and return phone number
  }
}
```
- **Mục đích**: Decode phone number từ Zalo Mini App tokens
- **Chức năng**: Zalo API call, phone number extraction

### **Queue System**:

#### **BullMQ Adapter** (`infrastructure/queue/bullmq-adapter.ts`)
```typescript
export class BullMQAdapter implements QueueService {
  async addJob(queueName: string, jobName: string, data: any, options: { delay?: number }): Promise<string> {
    // Add job to Redis queue with BullMQ
  }
}
```
- **Mục đích**: Background job processing với Redis
- **Chức năng**: Queue management, delayed job execution

#### **Order Worker** (`infrastructure/queue/order-worker.ts`)
```typescript
export const createOrderWorker = (paymentGateway: PaymentGateway) => {
  // BullMQ Worker processing payment status check jobs
  // Calls payment gateway to update order status
};
```
- **Mục đích**: Process background jobs cho order payments
- **Chức năng**: Payment status checking, order updates

### **Data Access Layer**:

#### **MongoDB Repositories** (`infrastructure/repositories/`)
```typescript
// infrastructure/repositories/order-repo.ts
export const orderRepository = {
  async getById(id: number): Promise<Order | null> {
    // MongoDB queries for orders
  },
  async update(id: number, data: Partial<Order>): Promise<Order | null> {
    // Update operations
  }
};
```
- **Mục đích**: Data access abstraction cho MongoDB
- **Chức năng**: CRUD operations cho tất cả entities

---

## 🔗 6. Dependency Injection Container

```typescript
// lib/container.ts
export const paymentGateway: PaymentGateway = new ZaloPayGateway();
export const queueService: QueueService = new BullMQAdapter();
export const locationService: LocationService = new ZaloLocationGateway();

// Use cases with injected dependencies
export const linkOrderUseCase = new LinkOrderUseCase(orderService, queueService);
export const handleVnpayIpnUseCase = new HandleVnpayIpnUseCase(vnpayGateway, orderService);

// Worker initialization
if (process.env.ENABLE_ORDER_WORKER === 'true') {
  createOrderWorker(paymentGateway);
}
```

---

## 🌐 7. API Routes (Clean Architecture)

### **Order Management**:
```typescript
// app/api/orders/route.ts
export async function GET() {
  const result = await getOrdersUseCase.execute({ status, zaloUserId });
  return NextResponse.json(result.orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createOrderUseCase.execute(body);
  return NextResponse.json(result.order, { status: 201 });
}
```

### **Payment Integration**:
```typescript
// app/api/checkout/callback/route.ts
export async function POST(request: NextRequest) {
  const { data, overallMac } = await request.json();
  const result = await paymentCallbackUseCase.execute({ data, overallMac });
  return NextResponse.json({ returnCode: result.returnCode, returnMessage: result.returnMessage });
}
```

### **Webhook Handling**:
```typescript
// app/api/ipn/route.ts - VNPay IPN
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { result, order } = await handleVnpayIpnUseCase.execute({ body });

  if (result.isSuccess && order) {
    void notifyOrderWebhook(order);
  }

  return NextResponse.json({ returnCode: result.returnCode, returnMessage: result.returnMessage });
}
```

### **Utility APIs**:
```typescript
// app/api/utils/location/route.ts
export async function POST(request: NextRequest) {
  const { token, accessToken } = await request.json();
  const result = await decodeLocationUseCase.execute({ token, accessToken });
  return NextResponse.json(result);
}
```

---

## 🎯 8. Key Features Implemented

| Feature | Implementation | Description |
|---------|----------------|-------------|
| **Payment Processing** | ZaloPay + VNPay | Multiple payment gateways |
| **Webhook Handling** | VNPay IPN | Secure payment notifications |
| **Queue System** | BullMQ + Redis | Background job processing |
| **External APIs** | Zalo Location/Phone | Social login integration |
| **CRUD Operations** | All entities | Full data management |
| **Clean Architecture** | Dependency Injection | Testable, maintainable code |
| **Error Handling** | Structured responses | Proper HTTP status codes |
| **Type Safety** | TypeScript | Full type coverage |

---

## 🧪 9. Testing Strategy

### **Unit Tests**:
```typescript
// Domain tests
describe("Order", () => {
  it("validates order data", () => { /* ... */ });
});

// Use case tests
describe("CreateOrderUseCase", () => {
  it("calls repository correctly", async () => {
    vi.mock("@/infrastructure/repositories/order-repo");
    // ...
  });
});
```

### **Integration Tests**:
```typescript
// Repository integration with MongoDB Memory Server
describe("OrderRepository", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  });

  it("creates and retrieves orders", async () => {
    // Test actual database operations
  });
});
```

### **API Integration Tests**:
```typescript
// Test complete API flows
describe("Order API", () => {
  it("creates order via API", async () => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    expect(response.status).toBe(201);
  });
});
```

---

## 🚀 10. Chạy ứng dụng

```bash
# Development
npm run dev

# Build production
npm run build

# Start production
npm start

# Testing
npm test              # Unit tests
npm run test:ui       # Test UI
npm run test:cov      # Coverage report
npm run test:integration # Integration tests
```

---

## ✅ 11. Tổng kết

| Thành phần | Công nghệ | Vai trò |
|-----------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React |
| **Architecture** | Clean/Onion Architecture | Separation of concerns |
| **Database** | MongoDB | Data persistence |
| **Payment** | ZaloPay + VNPay | Payment processing |
| **Queue** | BullMQ + Redis | Background jobs |
| **External APIs** | Zalo Open API | Location/Phone decode |
| **State** | Zustand | Client state management |
| **Testing** | Vitest + RTL | Unit/Integration/UI tests |
| **Type Safety** | TypeScript | Full type coverage |

**🎉 Đây là một full-stack e-commerce application hoàn chỉnh với Clean Architecture!**
