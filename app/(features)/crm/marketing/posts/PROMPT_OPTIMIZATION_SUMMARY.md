# Posts Copilot AI Agent - Prompt Optimization Summary

## 🎯 Mục tiêu

Tối ưu AI agent để tạo kế hoạch marketing chuyên nghiệp, hiệu quả bán hàng cao cho CRM system.

---

## 📊 Các Cải Tiến Chính

### 1. **Tuân Thủ Best Practices của CopilotKit**

#### ❌ Trước đây (SAI):
```typescript
// Tool description quá dài, chứa hướng dẫn chi tiết
useFrontendTool({
  name: 'batchDraft',
  description: `Create a strategic 30-day content marketing plan...
    MARKETING STRATEGY REQUIREMENTS:
    - Apply AIDA framework...
    - Follow 70-20-10 rule...
    (100+ dòng hướng dẫn)
  `
})
```

#### ✅ Bây giờ (ĐÚNG):
```typescript
// Tool description ngắn gọn (1-2 câu)
useFrontendTool({
  name: 'batchDraft',
  description: 'Create a strategic 30-day marketing content calendar with 15-30 posts following AIDA framework and 70-20-10 rule. Each post must include scheduledDate (YYYY-MM-DD). Posts added to preview (not saved to DB).',
  // ...
})

// Hướng dẫn chi tiết trong CopilotSidebar instructions
<CopilotSidebar
  instructions={`
    When using batchDraft:
    - Apply AIDA framework...
    - Follow 70-20-10 rule...
    (chi tiết hướng dẫn ở đây)
  `}
/>
```

**Tham khảo:**
- [CopilotKit useCopilotAction Best Practices](https://docs.copilotkit.ai/reference/hooks/useCopilotAction)
- [CopilotKit useFrontendTool Documentation](https://docs.copilotkit.ai/reference/hooks/useFrontendTool)

---

### 2. **Tách biệt rõ ràng: Data vs Instructions**

#### Cấu trúc tối ưu:

**A. `useCopilotReadable` - Cung cấp DATA**
```typescript
useCopilotReadable({
  description: 'Brand memory and content strategy - Complete brand identity...',
  value: {
    brandIdentity: { description, niche, contentStyle, language },
    brandVoice: { tone, writingPatterns },
    brandAssets: { keyPoints, ctaLibrary, contentsInstruction },
    selectedProducts: [...], // Full product details
    productSummary: { totalProducts, selectedCount }
  }
})
```

**Vai trò:** Cung cấp **dữ liệu có cấu trúc** cho AI

**B. `instructions` (CopilotSidebar) - Cung cấp HƯỚNG DẪN**
```typescript
instructions={`
  You are an expert content marketing strategist...

  CONTENT CREATION GUIDELINES:
  When using batchDraft:
  - Apply AIDA framework (Attention → Interest → Desire → Action)
  - Follow 70-20-10 rule: 70% educational, 20% stories, 10% sales
  ...
`}
```

**Vai trò:** Hướng dẫn AI **cách sử dụng dữ liệu** để tạo content marketing

**C. Tool `description` - Định nghĩa ngắn gọn**
```typescript
description: 'Create a strategic 30-day marketing content calendar...'
```

**Vai trò:** Giúp AI **hiểu khi nào dùng tool này**

---

### 3. **Chiến Lược Marketing Được Tích Hợp**

#### Framework được áp dụng:

**AIDA Framework** (Customer Journey)
- **Attention**: Hooks thu hút sự chú ý (pain points, questions, bold statements)
- **Interest**: Nội dung giáo dục xây dựng niềm tin
- **Desire**: Product benefits & customer transformations
- **Action**: CTAs rõ ràng theo từng giai đoạn funnel

**70-20-10 Content Rule** (Content Mix)
- **70%** Educational/Value content → Builds authority
- **20%** Brand stories → Builds connection
- **10%** Direct sales → Drives conversion

**PAS Framework** (Problem-Agitate-Solution)
- Identify customer pain points
- Amplify the problem's impact
- Present product as the solution

---

### 4. **Cấu Trúc Content Chuyên Nghiệp**

Mỗi post phải có:

**Idea (Hook)**
- Compelling attention-grabber
- Format: Question, pain point, bold statement, curiosity gap
- Ví dụ: "Mệt mỏi với hải sản tanh, nhạt? Đây là lý do độ tươi quan trọng..."

**Title**
- Benefit-driven, SEO-friendly
- Max 100 characters
- Ví dụ: "5 Cách Nhận Biết Hải Sản Tươi Sống - Bí Quyết Từ Ngư Dân Cô Tô"

**Body Structure**
```
1. Opening Hook (1-2 câu)
   - Pain point hoặc benefit hấp dẫn

2. Main Content (3-5 điểm chính)
   - Giá trị giáo dục/insights
   - Tích hợp sản phẩm tự nhiên
   - Focus vào customer benefits

3. Call-to-Action (1-2 câu)
   - Hành động cụ thể tiếp theo
   - Align với sales funnel stage
```

**Hashtags**
- 5-10 hashtags chiến lược
- Mix: branded + niche + trending
- Ví dụ: `#HảiSảnCôTô #TươiSống #HảiSảnNgàyMới #SeafoodVietnam`

---

### 5. **Product Integration Storytelling**

#### ❌ Feature-focused (Bad):
```
"Tôm hùm Alaska - 500,000đ/kg
Đánh bắt tươi sống, vận chuyển lạnh"
```

#### ✅ Benefit-focused Storytelling (Good):
```
"Câu chuyện về chú tôm hùm Alaska đầu tiên trong ngày:

Từ biển Cô Tô lúc 5 sáng → Bàn ăn nhà bạn lúc 5 chiều.

Không ướp đá. Không hóa chất. Chỉ có độ tươi nguyên bản và hương vị biển cả.

Đó là lý do tại sao món tôm hùm Alaska của bạn ngọt thịt,
chắc thịt, không tanh - như vừa được đánh bắt.

👉 Nhắn tin ngay để đặt tôm hùm tươi sáng mai"
```

---

### 6. **Content Variety & Distribution**

**Content Types** (đa dạng):
- Educational posts (how-tos, tips)
- Product spotlights (with narratives)
- Social proof & testimonials
- Behind-the-scenes
- Problem-solution posts
- Engagement posts (questions, polls)

**Smart Scheduling**:
- 1-2 posts/day
- Spread across 30 days
- Balance content types (không cluster)
- Strategic timing

---

### 7. **Bug Fixes & Type Safety**

#### Bug Fix: Hashtags Type Handling

**Vấn đề:**
```typescript
// Error: post.hashtags.split is not a function
hashtags: post.hashtags ? post.hashtags.split(',') : []
```

**Giải pháp:**
```typescript
// Handle both string (comma-separated) và array
let hashtagsArray: string[] = []
if (post.hashtags) {
  if (typeof post.hashtags === 'string') {
    hashtagsArray = post.hashtags.split(',').map(tag => tag.trim())
  } else if (Array.isArray(post.hashtags)) {
    hashtagsArray = post.hashtags
  }
}
```

**Type Definition:**
```typescript
handler: async ({ posts }: {
  posts: Array<{
    idea: string
    title: string
    body: string
    scheduledDate?: string
    hashtags?: string | string[] // Support both types
  }>
})
```

---

## 📁 Files Modified

### 1. [PostsCopilot.tsx](app/(features)/crm/marketing/posts/_components/PostsCopilot.tsx)

**Changes:**
- ✅ Refactored `useCopilotReadable` with structured data
- ✅ Shortened tool descriptions to 1-2 sentences
- ✅ Moved detailed guidelines to `instructions`
- ✅ Added marketing frameworks to instructions
- ✅ Fixed hashtags type handling bug

**Key Sections:**
- Lines 41-75: Enhanced `useCopilotReadable` với structured brand data
- Line 94: Shortened `addDraftPost` description
- Line 174: Shortened `batchDraft` description
- Lines 261-271: Hashtags type safety fix
- Lines 433-506: Comprehensive marketing instructions

---

## 🚀 Usage Examples

### Example 1: Batch Draft với Marketing Strategy

**User prompt:**
```
"Tạo kế hoạch marketing 30 ngày cho sản phẩm hải sản của chúng tôi,
tập trung vào việc giáo dục khách hàng về độ tươi và cách bảo quản"
```

**Agent sẽ:**
1. Apply AIDA framework
2. Generate 20-30 posts với ratio 70-20-10
3. Integrate selected products với storytelling
4. Create diverse content types
5. Schedule strategically (1-2 posts/day)
6. Add to preview (user review trước khi save)

### Example 2: Single Draft Post

**User prompt:**
```
"Viết một bài post về lợi ích của việc ăn tôm hùm Alaska"
```

**Agent sẽ:**
1. Apply brand voice: ${brand.brandVoice.tone}
2. Follow writing patterns
3. Create hook về health benefits
4. Integrate product naturally
5. Add strategic hashtags
6. Save immediately to database

---

## 📈 Expected Outcomes

### Content Quality
- ✅ Professional marketing copy
- ✅ Compelling hooks và CTAs
- ✅ Brand-aligned voice
- ✅ SEO-optimized titles

### Sales Performance
- ✅ Content drives customer journey
- ✅ Products integrated naturally
- ✅ Clear conversion paths
- ✅ Strategic funnel alignment

### Efficiency
- ✅ 30-day plans in minutes
- ✅ Consistent quality at scale
- ✅ Less manual editing
- ✅ Framework-driven consistency

---

## 🔧 Technical Architecture

### Separation of Concerns

```
┌─────────────────────────────────────────────────┐
│   CopilotSidebar (instructions)                 │
│   - Role definition                             │
│   - Marketing frameworks                        │
│   - Content guidelines                          │
│   - Action usage instructions                   │
└─────────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│   useCopilotReadable                            │
│   - Structured brand data                       │
│   - Product catalog                             │
│   - Current state                               │
└─────────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│   Tool Descriptions (1-2 sentences)             │
│   - addDraftPost: "Create one post..."          │
│   - batchDraft: "Create 30-day plan..."         │
│   - saveSchedule: "Save preview posts..."       │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
User Input
    ▼
Agent (with instructions + readable context)
    ▼
Tool Selection (based on short description)
    ▼
Tool Execution (with detailed guidelines from instructions)
    ▼
Preview Posts (batchDraft) or Direct Save (addDraftPost)
    ▼
User Review & Save
```

---

## 📚 References

- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [useCopilotAction Hook](https://docs.copilotkit.ai/reference/hooks/useCopilotAction)
- [useFrontendTool Hook](https://docs.copilotkit.ai/reference/hooks/useFrontendTool)
- [useCopilotReadable Hook](https://docs.copilotkit.ai/reference/hooks/useCopilotReadable)
- AIDA Marketing Framework
- Content Marketing 70-20-10 Rule
- PAS Copywriting Formula

---

## ✅ Checklist Tối Ưu Hoàn Thành

- [x] Tách biệt rõ ràng data (useCopilotReadable) vs instructions
- [x] Shortened tool descriptions theo best practices
- [x] Integrated marketing frameworks (AIDA, 70-20-10, PAS)
- [x] Enhanced product integration với storytelling
- [x] Added content quality standards
- [x] Fixed hashtags type handling bug
- [x] Structured brand data in readable context
- [x] Created comprehensive usage documentation
- [x] Validated với CopilotKit official docs

---

**Last Updated:** 2025-12-23
**Optimized By:** Claude Code
**Status:** ✅ Production Ready
