# AI Agent Optimization Guide - Marketing Posts Copilot

## 📋 Overview

This guide documents the optimizations made to the Posts Copilot AI agent to create strategic, sales-driven content marketing plans for the CRM system.

## 🎯 Key Improvements

### 1. **Strategic Marketing Framework Integration**

The agent now applies proven marketing frameworks:

- **AIDA Framework** (Attention → Interest → Desire → Action)
  - Attention: Compelling hooks that stop the scroll
  - Interest: Educational content that builds trust
  - Desire: Product benefits and customer transformations
  - Action: Clear CTAs aligned with sales funnel

- **70-20-10 Content Rule**
  - 70% Educational/Value content (builds authority)
  - 20% Brand stories (builds connection)
  - 10% Direct sales (drives conversion)

- **PAS Framework** (Problem-Agitate-Solution)
  - Identify customer pain points
  - Amplify the problem's impact
  - Present product as the solution

### 2. **Enhanced Product Integration**

The agent now receives detailed product context:
```typescript
Product Catalog includes:
- Product name, price, original price (discount visibility)
- Detailed description (for benefit articulation)
- Sizes and colors (for specific targeting)
- Selected products for focused campaigns
```

**Usage in content:**
- Natural product benefit integration (not just features)
- Storytelling approach to product showcases
- Problem-solution positioning with products
- Customer transformation narratives

### 3. **Content Quality Standards**

Each post element has specific requirements:

**Idea (Hook):**
- Compelling attention-grabber
- Format: Question, pain point, bold statement, or curiosity gap
- Must resonate with target audience's desires/problems

**Title:**
- Benefit-driven and SEO-friendly
- Max 100 characters
- Includes keywords from niche

**Body Structure:**
```
1. Opening Hook (1-2 sentences)
   - Pain point or compelling benefit
   - Creates immediate relevance

2. Main Content (3-5 key points)
   - Educational value or insights
   - Product integration when relevant
   - Customer-focused benefits

3. Call-to-Action (1-2 sentences)
   - Clear, specific next step
   - Aligned with sales funnel stage
   - Examples: "Shop now", "Learn more", "Comment below"
```

**Hashtags:**
- 5-10 strategic hashtags
- Mix of: branded, niche-specific, trending
- Optimized for platform algorithms

### 4. **Content Variety & Distribution**

The agent creates diverse content types:

- **Educational Posts** (70%):
  - How-to guides
  - Industry tips and insights
  - Best practices
  - Expert advice

- **Brand Stories** (20%):
  - Behind-the-scenes content
  - Company values and mission
  - Customer success stories
  - Team spotlights

- **Direct Sales** (10%):
  - Product spotlights
  - Special offers
  - Product launches
  - Seasonal promotions

**Smart Scheduling:**
- 1-2 posts per day
- Content types balanced across the week
- No clustering of similar content
- Strategic timing (considers platform best practices)

### 5. **Brand Voice & Identity**

The agent strictly follows brand guidelines:

```typescript
Brand Identity includes:
- brandDescription: Core brand identity
- niche: Market positioning
- contentStyle: Tone preference
- language: Vietnamese/English/Bilingual
- brandVoice.tone: Personality traits
- brandVoice.writingPatterns: Specific style rules
- keyPoints: USPs and selling points
- ctaLibrary: Pre-approved CTAs
- contentsInstruction: Custom AI instructions
```

## 🚀 How to Use the Optimized Agent

### For Single Posts (`addDraftPost`)

**Use case:** Create one high-quality post immediately

```
User prompt examples:
- "Create a post about the freshness of our seafood"
- "Write an educational post about choosing quality seafood"
- "Draft a product spotlight for [Product Name]"
```

**Agent will:**
1. Apply brand voice and writing patterns
2. Integrate selected products naturally
3. Follow content structure guidelines
4. Save immediately to database

### For Batch Content Plans (`batchDraft`)

**Use case:** Create strategic 30-day marketing calendar

```
User prompt examples:
- "Create a 30-day marketing plan for our seafood products"
- "Generate 20 posts focused on [specific product category]"
- "Plan content for this month with mix of educational and promotional posts"
```

**Agent will:**
1. Apply AIDA framework across the calendar
2. Balance 70-20-10 content rule
3. Create diverse content types
4. Integrate products with storytelling
5. Schedule strategically (1-2 posts/day)
6. Add to PREVIEW (user must "save schedule")

**Important workflow:**
1. Agent creates posts → Added to preview
2. User reviews on calendar
3. User says "save schedule" → Persists to database
4. OR user says "undo schedule" → Discards preview

### For AI-Generated Schedules (`generatePostSchedule`)

**Use case:** Fully automated 30-day plan

```
User prompt examples:
- "Generate post schedule"
- "Create post schedule for next month"
```

**Agent will:**
- Auto-generate 20-30 posts
- Apply all marketing principles
- Add to preview for review

## 📊 Content Creation Best Practices (Embedded in Agent)

### 1. Start with Customer Pain Points
```
❌ BAD: "Our seafood is fresh and high-quality"
✅ GOOD: "Tired of seafood that smells fishy and tastes bland? Here's why freshness matters..."
```

### 2. Use Storytelling for Products
```
❌ BAD: "Tôm hùm Alaska - 500,000đ/kg"
✅ GOOD: "Câu chuyện về chú tôm hùm Alaska đầu tiên trong ngày:
Từ biển Cô Tô lúc 5 sáng → Bàn ăn nhà bạn lúc 5 chiều.
Tươi sống, không ướp đá..."
```

### 3. Clear, Specific CTAs
```
❌ BAD: "Liên hệ chúng tôi"
✅ GOOD: "👉 Nhắn tin ngay để nhận bảng giá tươi hôm nay + tư vấn FREE"
```

### 4. Platform Optimization
- Engagement-driving questions
- Visual content references
- Hashtag strategy
- Platform-specific best practices

## 🎨 Agent Prompt Architecture

### Core Components

1. **Role Definition:**
   ```
   "You are an expert content marketing strategist and social media planner
    specializing in [brand.niche]"
   ```

2. **Brand Context (Dynamic):**
   - Full brand identity
   - Product catalog with details
   - Writing patterns and voice
   - Special instructions

3. **Marketing Expertise:**
   - Framework knowledge (AIDA, PAS)
   - Content balancing (70-20-10)
   - Customer journey understanding
   - Sales funnel alignment

4. **Action Descriptions:**
   - Detailed requirements for each action
   - Marketing strategy guidelines
   - Quality standards
   - Scheduling rules

5. **Best Practices:**
   - Customer-first approach
   - Storytelling techniques
   - CTA optimization
   - Brand consistency

## 📈 Expected Outcomes

With the optimized agent, users can expect:

1. **Higher Quality Content:**
   - Professional marketing copy
   - Compelling hooks and CTAs
   - Brand-aligned voice

2. **Better Sales Performance:**
   - Content drives customer journey
   - Products integrated naturally
   - Clear conversion paths

3. **Time Efficiency:**
   - 30-day plans in minutes
   - Consistent quality at scale
   - Less editing required

4. **Strategic Alignment:**
   - Balanced content mix
   - Framework-driven approach
   - Brand consistency

## 🔧 Technical Implementation

### Files Modified

1. **PostsCopilot.tsx** ([PostsCopilot.tsx:172-544](app/(features)/crm/marketing/posts/_components/PostsCopilot.tsx#L172-L544))
   - `batchDraft` tool description enhanced with marketing strategy
   - `addDraftPost` action enhanced with brand context
   - Main `instructions` completely rewritten with marketing expertise

### Key Changes

**batchDraft Description:**
```typescript
description: `Create a strategic 30-day content marketing plan...

  MARKETING STRATEGY REQUIREMENTS:
  - Apply AIDA framework
  - Follow 70-20-10 rule
  - Product integration with storytelling

  CONTENT QUALITY REQUIREMENTS:
  - Structured content guidelines
  - Hook → Value → CTA pattern

  SCHEDULING REQUIREMENTS:
  - Smart distribution
  - Content balance

  PRODUCT INTEGRATION:
  - Natural benefit weaving
  - Problem-solving approach
`
```

**Main Instructions:**
```typescript
instructions: `You are an expert content marketing strategist...

  BRAND IDENTITY & CONTEXT:
  [Dynamic brand data]

  PRODUCT CATALOG:
  [Dynamic product data with details]

  YOUR MARKETING EXPERTISE:
  [5 core competencies]

  AVAILABLE ACTIONS:
  [Detailed action guides with strategies]

  CONTENT CREATION BEST PRACTICES:
  [5 key principles]
`
```

## 💡 Usage Tips

### For Best Results:

1. **Configure Brand Settings First:**
   - Complete brand description
   - Define clear brand voice
   - Add writing patterns
   - Select relevant products

2. **Be Specific in Prompts:**
   ```
   ❌ "Create posts"
   ✅ "Create 20 posts for January focused on premium seafood
       with 70% educational content about freshness"
   ```

3. **Review and Refine:**
   - Check preview posts on calendar
   - Edit individual posts if needed
   - Save when satisfied

4. **Leverage Product Selection:**
   - Select specific products for campaigns
   - Agent will focus content on those products
   - Better targeting and relevance

## 🔍 Monitoring & Iteration

Track these metrics to validate agent effectiveness:

- Content approval rate (preview → saved)
- Editing required per post
- User satisfaction with content quality
- Sales correlation with content campaigns
- Engagement metrics on published posts

## 📚 Related Documentation

- [Post Domain Entity](core/domain/marketing/post.ts)
- [Brand Memory Entity](core/domain/brand-memory.ts)
- [Product Domain Entity](core/domain/catalog/product.ts)
- [Post Store](app/(features)/crm/marketing/posts/_store/usePostStore.ts)

---

**Last Updated:** 2025-12-23
**Optimized By:** Claude Code
**Status:** Production Ready ✅
