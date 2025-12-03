# AI Architecture Analysis - Clean/Onion Architecture Review

## Current Implementation Analysis

### 📊 Files Analyzed:
1. `infrastructure/adapters/external/ai/revenue-forecast-service.ts`
2. `infrastructure/adapters/external/ai/risk-assessment-service.ts`
3. `infrastructure/adapters/external/ai/ai-config.ts`

---

## ❌ Violations of Clean Architecture

### 1. **Business Logic in Infrastructure Layer**

**Problem**: Services contain business logic that should be in Use Cases

**Examples**:

#### Revenue Forecast Service (Lines 70-99):
```typescript
// ❌ Statistical calculations in infrastructure
const totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0)
const avgDailyRevenue = totalRevenue / historicalData.length

// ❌ Business rules for statistical forecast
generateStatisticalForecast(historicalData: RevenueDataPoint[]): RevenueForecast {
  const recentData = historicalData.slice(-7)
  const avgDailyRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length
  const growthRate = (secondAvg - firstAvg) / firstAvg
  // ... growth rate calculation logic
}
```

**Why it's wrong**:
- Statistical forecast algorithm is business logic
- Growth rate calculation is a domain concern
- Should be in Use Case or Domain Service

#### Risk Assessment Service (Lines 186-284):
```typescript
// ❌ Rule-based risk assessment in infrastructure
generateRuleBasedAssessment(metrics: BusinessMetrics): RiskAssessment {
  // Revenue risk rules
  if (metrics.revenueChangePercent < -30) {
    risks.push({ severity: "critical", ... })
    riskScore += 30
  }

  // Operational risk rules
  if (metrics.errorRate > 15) {
    risks.push({ severity: "high", ... })
    riskScore += 20
  }

  // Customer risk rules
  if (metrics.churnRiskRate > 30) {
    risks.push({ severity: "high", ... })
    riskScore += 15
  }
}
```

**Why it's wrong**:
- Risk scoring rules are business logic
- Threshold values (-30%, 15%, 30%) are domain rules
- Risk level determination is business logic

### 2. **Prompts in Infrastructure Layer**

**Problem**: AI prompts are part of business logic, not infrastructure details

**Examples**:

#### Revenue Forecast (Lines 77-99):
```typescript
// ❌ Vietnamese business prompts in infrastructure
const prompt = `Bạn là chuyên gia phân tích kinh doanh...
Dữ liệu lịch sử (${historicalData.length} ngày gần nhất)...
Cân nhắc:
- Xu hướng theo ngày trong tuần
- Xu hướng gần đây
- Hiệu ứng thời vụ
...`
```

#### Risk Assessment (Lines 96-163):
```typescript
// ❌ Complex business prompt in infrastructure
const prompt = `Bạn là chuyên gia phân tích rủi ro kinh doanh...
Phân tích các chỉ số này và xác định:
1. Rủi ro nghiêm trọng cần xử lý ngay
2. Rủi ro trung hạn cần theo dõi
...`
```

**Why it's wrong**:
- Prompts define HOW to analyze business data (business logic)
- Prompt engineering affects business outcomes
- Should be configurable by Use Cases

### 3. **Schema Validation in Infrastructure**

**Problem**: Zod schemas define business rules and data structures

**Examples**:

#### Revenue Forecast Schema (Lines 9-27):
```typescript
// ❌ Business data structure in infrastructure
const RevenueForecastSchema = z.object({
  nextDay: z.object({
    prediction: z.number().describe("Predicted revenue for next day"),
    confidence: z.enum(["low", "medium", "high"]),
    reasoning: z.string(),
  }),
  trends: z.array(z.string()),
  recommendations: z.array(z.string()),
})
```

**Why it's wrong**:
- Schema defines business domain entities
- Should be in Domain layer or Application layer
- Infrastructure should only adapt external format

### 4. **No Abstraction/Interface**

**Problem**: Use Cases directly depend on concrete implementations

**Missing**:
```typescript
// ❌ No interface in Application layer
// Use Cases call `new RevenueForecastService()` directly
```

**Should have**:
```typescript
// ✅ Application layer interface
export interface AIAnalysisService {
  generateForecast(data: AnalysisRequest): Promise<AnalysisResponse>
}
```

### 5. **Caching Logic in Infrastructure**

**Problem**: Caching strategy is business decision, not infrastructure

**Example** (Lines 54-65):
```typescript
// ❌ Caching TTL and strategy in infrastructure
const cacheKey = generateCacheKey("revenue-forecast", historicalData)
const cache = await CacheFactory.getInstance({
  defaultTTL: 1800, // 30 minutes - business decision!
})
```

**Why it's wrong**:
- Cache duration (30 min) is business decision
- Use Case should decide if/when to cache

---

## ✅ Correct Clean Architecture Approach

### Recommended Structure:

```
core/
├── domain/
│   ├── analytics/
│   │   ├── revenue-forecast.ts          # Domain entity
│   │   ├── risk-assessment.ts           # Domain entity
│   │   └── business-metrics.ts          # Value objects
│   └── services/
│       └── risk-calculation.ts          # Domain service (business rules)
│
├── application/
    ├── interfaces/
    │   └── ai-analysis-service.ts       # ✅ INTERFACE (abstraction)
    │
    └── usecases/
        ├── analytics/
        │   ├── generate-revenue-forecast.ts
        │   │   // ✅ Contains:
        │   │   // - Business validation
        │   │   // - Prompt building logic
        │   │   // - Caching decisions
        │   │   // - Fallback strategies
        │   │
        │   └── assess-business-risks.ts
        │       // ✅ Contains:
        │       // - Risk scoring rules
        │       // - Threshold definitions
        │       // - Opportunity detection
        │       // - Recommendation logic

infrastructure/
└── adapters/
    └── external/
        └── ai/
            ├── openai-adapter.ts        # ✅ Only API calls
            └── anthropic-adapter.ts     # ✅ Generic adapter
```

---

## 🔧 Proposed Refactoring

### Phase 1: Extract Interfaces (Application Layer)

```typescript
// core/application/interfaces/ai-analysis-service.ts
export interface AnalysisRequest {
  data: unknown
  prompt: string
  schema: z.ZodType<any>
  temperature?: number
  maxTokens?: number
}

export interface AnalysisResponse<T> {
  result: T
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

export interface AIAnalysisService {
  generateStructuredOutput<T>(request: AnalysisRequest): Promise<AnalysisResponse<T>>
}
```

### Phase 2: Move Business Logic to Use Cases

```typescript
// core/application/usecases/analytics/generate-revenue-forecast.ts
export interface GenerateRevenueForecastRequest {
  historicalData: RevenueDataPoint[]
  daysToForecast: number[]  // [1, 7, 30]
}

export interface GenerateRevenueForecastResponse {
  forecast: RevenueForecast
  cached: boolean
}

export class GenerateRevenueForecastUseCase {
  constructor(
    private aiService: AIAnalysisService,
    private cacheService: CacheService
  ) {}

  async execute(request: GenerateRevenueForecastRequest): Promise<GenerateRevenueForecastResponse> {
    // ✅ Business logic: Check cache (Use Case decides)
    const cacheKey = this.buildCacheKey(request)
    const cached = await this.cacheService.get<RevenueForecast>(cacheKey)
    if (cached) return { forecast: cached, cached: true }

    // ✅ Business logic: Build prompt (Use Case knows business context)
    const prompt = this.buildForecastPrompt(request.historicalData)

    // ✅ Business logic: Define schema (Use Case defines domain)
    const schema = RevenueForecastSchema

    // ✅ Call infrastructure adapter (generic)
    const response = await this.aiService.generateStructuredOutput<RevenueForecast>({
      data: request.historicalData,
      prompt,
      schema,
      temperature: 0.2,
      maxTokens: 2000,
    })

    // ✅ Business logic: Cache decision (Use Case decides TTL)
    await this.cacheService.set(cacheKey, response.result, 1800) // 30 min

    return { forecast: response.result, cached: false }
  }

  // ✅ Business logic method
  private buildForecastPrompt(data: RevenueDataPoint[]): string {
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
    const avgDailyRevenue = totalRevenue / data.length

    return `Bạn là chuyên gia phân tích kinh doanh...
    Dữ liệu lịch sử: ${data.length} ngày
    Doanh thu TB: ${avgDailyRevenue.toFixed(0)} VND
    ...`
  }

  // ✅ Business logic method
  private buildCacheKey(request: GenerateRevenueForecastRequest): string {
    return `revenue-forecast:${JSON.stringify(request.historicalData)}`
  }
}
```

### Phase 3: Simplify Infrastructure Adapter

```typescript
// infrastructure/adapters/external/ai/openai-adapter.ts
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import type { AIAnalysisService, AnalysisRequest, AnalysisResponse } from "@/core/application/interfaces/ai-analysis-service"

export class OpenAIAdapter implements AIAnalysisService {
  private model = openai("gpt-4o-mini")

  // ✅ Pure infrastructure: Only API calls
  async generateStructuredOutput<T>(request: AnalysisRequest): Promise<AnalysisResponse<T>> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured")
    }

    const result = await generateObject({
      model: this.model,
      schema: request.schema,
      prompt: request.prompt,
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens ?? 2000,
    })

    return {
      result: result.object as T,
      usage: {
        inputTokens: result.usage?.promptTokens ?? 0,
        outputTokens: result.usage?.completionTokens ?? 0,
      },
    }
  }
}
```

### Phase 4: Move Schemas to Domain

```typescript
// core/domain/analytics/revenue-forecast.ts
import { z } from "zod"

export const RevenueForecastSchema = z.object({
  nextDay: z.object({
    prediction: z.number(),
    confidence: z.enum(["low", "medium", "high"]),
    reasoning: z.string(),
  }),
  next7Days: z.object({
    prediction: z.number(),
    confidence: z.enum(["low", "medium", "high"]),
    reasoning: z.string(),
  }),
  next30Days: z.object({
    prediction: z.number(),
    confidence: z.enum(["low", "medium", "high"]),
    reasoning: z.string(),
  }),
  trends: z.array(z.string()),
  recommendations: z.array(z.string()),
})

export type RevenueForecast = z.infer<typeof RevenueForecastSchema>

// ✅ Domain validation
export function validateRevenueForecast(data: unknown): RevenueForecast {
  return RevenueForecastSchema.parse(data)
}
```

### Phase 5: Extract Domain Service (Rule-based Logic)

```typescript
// core/domain/services/risk-calculation-service.ts
export class RiskCalculationService {
  // ✅ Pure domain logic
  calculateRevenueRisk(changePercent: number): { severity: RiskSeverity; score: number } {
    if (changePercent < -30) return { severity: "critical", score: 30 }
    if (changePercent < -15) return { severity: "high", score: 20 }
    if (changePercent < -5) return { severity: "medium", score: 10 }
    return { severity: "low", score: 0 }
  }

  calculateOperationalRisk(errorRate: number): { severity: RiskSeverity; score: number } {
    if (errorRate > 15) return { severity: "high", score: 20 }
    if (errorRate > 10) return { severity: "medium", score: 10 }
    return { severity: "low", score: 0 }
  }

  calculateCustomerRisk(churnRate: number): { severity: RiskSeverity; score: number } {
    if (churnRate > 30) return { severity: "high", score: 15 }
    if (churnRate > 20) return { severity: "medium", score: 8 }
    return { severity: "low", score: 0 }
  }

  determineOverallRisk(totalScore: number): RiskLevel {
    if (totalScore >= 50) return "critical"
    if (totalScore >= 30) return "high"
    if (totalScore >= 15) return "medium"
    return "low"
  }
}
```

---

## 📋 Comparison Table

| Aspect | ❌ Current | ✅ Proposed |
|--------|-----------|-------------|
| **Prompts** | Infrastructure | Use Case |
| **Schemas** | Infrastructure | Domain |
| **Business Rules** | Infrastructure | Use Case / Domain Service |
| **Caching Strategy** | Infrastructure | Use Case |
| **Fallback Logic** | Infrastructure | Use Case |
| **Statistical Calculations** | Infrastructure | Domain Service |
| **Risk Scoring** | Infrastructure | Domain Service |
| **Abstraction** | None | Interface in Application |
| **Testability** | Hard (depends on AI) | Easy (mock interface) |
| **Reusability** | Low (coupled) | High (generic adapter) |

---

## 🎯 Benefits of Refactoring

### 1. **Better Separation of Concerns**
- Infrastructure only handles API calls
- Use Cases contain business logic
- Domain contains business rules

### 2. **Easier Testing**
```typescript
// ✅ Easy to test Use Case
const mockAIService = {
  generateStructuredOutput: vi.fn().mockResolvedValue({ result: mockForecast })
}
const useCase = new GenerateRevenueForecastUseCase(mockAIService, mockCache)
```

### 3. **Provider Flexibility**
```typescript
// ✅ Easy to switch providers
const aiService = useOpenAI ? new OpenAIAdapter() : new AnthropicAdapter()
const useCase = new GenerateRevenueForecastUseCase(aiService, cache)
```

### 4. **Reusable Infrastructure**
```typescript
// ✅ One adapter for all AI use cases
const adapter = new OpenAIAdapter()
const forecastUC = new GenerateRevenueForecastUseCase(adapter, cache)
const riskUC = new AssessBusinessRisksUseCase(adapter, cache)
const contentUC = new GeneratePostContentUseCase(adapter, cache)
```

### 5. **Business Logic Visibility**
- Prompts in Use Cases → easy to tune
- Rules in Domain Services → easy to modify
- Infrastructure is dumb adapter → stable

---

## 🚀 Migration Strategy

### Step 1: Create Interfaces (No breaking changes)
- Add `core/application/interfaces/ai-analysis-service.ts`
- Add interface implementations to existing services

### Step 2: Extract Use Cases (Gradual)
- Create `GenerateRevenueForecastUseCase`
- Move prompt building logic
- Move caching logic
- Keep old service for backward compatibility

### Step 3: Move Schemas to Domain
- Create `core/domain/analytics/`
- Export schemas from domain
- Update imports

### Step 4: Extract Domain Services
- Create `RiskCalculationService`
- Move rule-based logic
- Use in Use Cases

### Step 5: Simplify Infrastructure
- Remove business logic from adapters
- Keep only API calls
- Generic `generateStructuredOutput` method

### Step 6: Update Dependencies
- Update `depends.ts` to use Use Cases
- Remove direct service instantiation
- Inject interfaces

---

## 📊 Effort Estimation

| Task | Effort | Priority |
|------|--------|----------|
| Create AI interfaces | 1 hour | High |
| Extract schemas to domain | 1 hour | High |
| Create Use Cases | 4 hours | High |
| Extract domain services | 2 hours | Medium |
| Simplify adapters | 2 hours | Medium |
| Update dependencies | 1 hour | High |
| Testing | 3 hours | High |
| Documentation | 1 hour | Medium |
| **Total** | **~15 hours** | **~2 days** |

---

## ✅ Recommendation

**YES, nên refactor theo Clean Architecture:**

### Reasons:
1. **Current violations are significant** - Business logic in infrastructure
2. **Low refactoring cost** - ~2 days work
3. **High long-term value** - Better maintainability, testability, flexibility
4. **Future-proof** - Easy to add more AI features
5. **Consistency** - Match the rest of the codebase (Posts, Orders, Customers all follow Clean Architecture)

### Priority Order:
1. **High**: Create interfaces, extract Use Cases (enables testing)
2. **Medium**: Move schemas to domain, extract domain services (improves structure)
3. **Low**: Simplify adapters (nice to have, can be done gradually)

### Quick Wins:
- Start with **one Use Case** (e.g., Revenue Forecast)
- Prove the pattern works
- Apply to other AI services
- Keep old services during migration

---

## 📝 Conclusion

**Current State**: ❌ Violates Clean Architecture
- Business logic in infrastructure
- No abstraction
- Hard to test
- Tightly coupled

**Proposed State**: ✅ Follows Clean Architecture
- Business logic in Use Cases & Domain
- Interface abstraction
- Easy to test
- Loosely coupled

**Recommendation**: **Refactor gradually over 2 days** to align with Clean Architecture principles and match the quality of the rest of the codebase.
