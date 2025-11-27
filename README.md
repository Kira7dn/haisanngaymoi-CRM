# 🧭 Hải Sản Ngày Mới - CRM Platform

Production-ready CRM system for Hải Sản Ngày Mới (Fresh Seafood from Cô Tô Island)

[![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.20.0-green)](https://www.mongodb.com/)

## Features

### Core Modules
- **Order Management**: Order lifecycle with payment integration (VNPay, ZaloPay)
- **Customer Management**: Multi-platform customer tracking and care system
- **Product Catalog**: Products with categories, variants, and inventory
- **Campaigns**: Marketing campaigns with banner and social media post management
- **Social Media Integration**: TikTok OAuth connect, video publishing, and analytics
- **Analytics**: Revenue, customer, campaign, staff, and forecast analytics
- **Customer Care**: Support tickets, surveys, interaction history, message templates
- **AI Assistants**: Chatbot and AI-powered copilot for business insights

### Technical
- **Clean Architecture**: Domain-driven design with strict layering
- **Next.js 16**: App Router with Server Components and Server Actions
- **MongoDB**: Document database with auto-increment IDs
- **BullMQ + Redis**: Background job processing and caching
- **AWS S3**: Cloud storage for media files
- **Vitest**: Comprehensive testing suite

---

## Project Structure

```
app/
├── api/                          # API Routes
│   ├── analytics/                # Analytics endpoints (revenue, customer, campaign, staff, forecast)
│   ├── auth/                     # Authentication (login, register, change-password, me)
│   ├── campaigns/                # Campaign CRUD
│   ├── categories/               # Category CRUD
│   ├── chatbot/                  # AI chatbot endpoints
│   ├── copilot/                  # AI copilot for business insights
│   ├── customer-care/            # Tickets, surveys, interactions, templates
│   ├── customers/                # Customer CRUD and search
│   ├── inventory/                # Inventory management
│   ├── messages/                 # Messaging campaigns
│   ├── orders/                   # Orders + payment operations
│   ├── products/                 # Product CRUD
│   └── upload/                   # File upload to S3
│
├── (features)/crm/               # CRM UI Pages
│   ├── analytics/                # Analytics dashboards
│   ├── campaigns/                # Campaign, banner, post management
│   ├── copilot/                  # AI copilot chat interface
│   ├── customers/                # Customer list and tickets
│   ├── managements/              # Orders, products, inventory
│   └── users/                    # User management
│
├── (landing-page)/               # Public landing page
└── (policies)/                   # Terms, privacy, cookies

core/
├── application/
│   ├── interfaces/               # Service interfaces
│   └── usecases/                 # Business logic (class-based)
│       ├── admin-user/
│       ├── analytics/
│       ├── banner/
│       ├── campaign/
│       ├── category/
│       ├── chatbot/
│       ├── copilot/
│       ├── customer/
│       ├── customer-care/
│       ├── inventory/
│       ├── location/
│       ├── order/
│       ├── phone/
│       ├── post/
│       ├── product/
│       └── station/
│
└── domain/                       # Pure business entities
    ├── admin-user.ts
    ├── analytics/
    ├── campaigns/
    ├── chatbot/
    ├── copilot/
    ├── customers/
    └── managements/

infrastructure/
├── adapters/
│   ├── ai/                       # AI services (forecasting, risk assessment)
│   ├── cache/                    # Redis and in-memory cache
│   ├── gateways/                 # External integrations (Zalo, Facebook, VNPay, ZaloPay)
│   ├── posts/                    # Social media platform integrations
│   └── storage/                  # S3 storage service
│
├── db/
│   ├── mongo.ts                  # MongoDB connection
│   ├── base-repository.ts        # Base repository with auto MongoDB client
│   └── auto-increment.ts         # Auto-increment ID generator
│
├── queue/
│   ├── bullmq-adapter.ts         # Queue service implementation
│   ├── order-worker.ts           # Order payment worker
│   └── campaign-worker.ts        # Campaign worker
│
└── repositories/                 # Data access implementations
    ├── admin-user-repo.ts
    ├── analytics/
    ├── banner-repo.ts
    ├── campaign-repo.ts
    ├── category-repo.ts
    ├── chatbot/
    ├── customer-care/
    ├── customer-repo.ts
    ├── inventory-repo.ts
    ├── order-repo.ts
    ├── post-repo.ts
    ├── product-repo.ts
    └── station-repo.ts
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (Atlas or local)
- Redis (for queues and caching)
- AWS S3 (for file storage)

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Optional: Run background workers in separate terminals
npm run worker:campaign  # Campaign processing
npm run worker:tiktok    # TikTok token refresh & analytics
```

Visit `http://localhost:3000` for the landing page or `http://localhost:3000/crm/login` for admin access.

### Key Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB=crm_db

# AWS S3
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Redis
REDIS_URL=redis://host:port
ENABLE_ORDER_WORKER=true
ENABLE_CAMPAIGN_WORKER=true
ENABLE_TIKTOK_WORKER=true

# Payment (optional)
VNP_HASH_SECRET=your_vnpay_secret
CHECKOUT_SDK_PRIVATE_KEY=your_zalopay_key

# Zalo (optional)
ZALO_APP_SECRET=your_secret
ZALO_APP_ID=your_id
ZALO_OA_ID=your_oa_id

# TikTok (optional)
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret
TIKTOK_REDIRECT_URI=https://your-domain.com/api/auth/tiktok/callback
```

## Architecture

This project follows **Clean/Onion Architecture** with strict separation of concerns:

### Layers

1. **Domain Layer** (`core/domain/`)
   - Pure business entities and types
   - No dependencies on other layers
   - Example: `Order`, `Customer`, `Product`

2. **Application Layer** (`core/application/`)
   - Use cases that orchestrate business logic
   - Depends only on domain layer
   - Uses dependency injection (interfaces)
   - Example: `CreateOrderUseCase`, `GetCustomerAnalyticsUseCase`

3. **Infrastructure Layer** (`infrastructure/`)
   - Implements data access and external integrations
   - Repositories extend `BaseRepository<T, ID>`
   - Gateways for external APIs (Zalo, VNPay, ZaloPay, etc.)
   - Queue system (BullMQ) and cache (Redis)

4. **UI Layer** (`app/`)
   - Next.js App Router (Server Components + Server Actions)
   - API routes for external integrations
   - Server Actions for UI mutations
   - Each feature has `depends.ts` for dependency injection

### Key Principles

- **Dependency Inversion**: Use cases depend on interfaces, not implementations
- **Factory Pattern**: Each API module has `depends.ts` with factory functions
- **BaseRepository**: All repositories extend base class with auto MongoDB client management
- **No Direct Calls**: UI never calls repositories directly, always through use cases

---

## Development

```bash
# Development
npm run dev                # Start dev server

# Production
npm run build             # Build for production
npm start                 # Start production server

# Testing
npm test                  # Run tests
npm run test:cov          # Generate coverage report

# Linting
npm run lint              # Run ESLint
```

---

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.0 (strict) |
| **Database** | MongoDB 6.20.0 |
| **Queue/Cache** | BullMQ + Redis |
| **Storage** | AWS S3 |
| **UI** | Radix UI + Tailwind CSS v4 |
| **Testing** | Vitest + Testing Library |
| **State** | Zustand |
| **Payment** | VNPay, ZaloPay |
| **Auth** | Cookie-based sessions + bcrypt |

---

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Developer guide for working with this codebase
- **[PRD/Admin.md](PRD/Admin.md)** - Product requirements

---

## License

MIT License

---

**Made for Hải Sản Ngày Mới - Fresh Seafood from Cô Tô Island**
