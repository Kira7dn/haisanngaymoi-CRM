# AI Content Generation - Technical Documentation

## Overview

The AI Content Generation system enables automated creation of high-quality social media content using a sophisticated three-layer memory architecture inspired by modern AI systems.

## Architecture

### Three-Layer Memory System

```
┌─────────────────────────────────────────────────────┐
│          AI Content Generation System                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Layer 1: Structured Memory (MongoDB)       │   │
│  │  - Brand voice & strategy                   │   │
│  │  - Product information                      │   │
│  │  - CTA library & key points                │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌─────────────────────────────────────────────┐   │
│  │  Layer 2: Semantic Memory (Qdrant)          │   │
│  │  - Content embeddings (OpenAI)              │   │
│  │  - Similarity search                        │   │
│  │  - Anti-duplication system                  │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌─────────────────────────────────────────────┐   │
│  │  Layer 3: Episodic Memory (Cache)           │   │
│  │  - Multi-pass generation states             │   │
│  │  - Session management                       │   │
│  │  - Intermediate results (30min TTL)         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Layer 1: Structured Memory

### Purpose
Stores brand identity, voice, and content strategy for consistent content generation.

### Implementation
- **Domain**: `core/domain/brand-memory.ts`
- **Repository**: `infrastructure/repositories/brand-memory-repo.ts`
- **Use Cases**:
  - `get-brand-memory.ts`
  - `save-brand-memory.ts`
- **Database**: MongoDB (singleton pattern)

### Data Structure
```typescript
interface BrandMemory {
  id: string
  productDescription: string
  niche: string
  contentStyle: 'professional' | 'casual' | 'promotional' | 'educational'
  language: 'vietnamese' | 'english' | 'bilingual'
  brandVoice: {
    tone: string
    writingPatterns: string[]
  }
  ctaLibrary: string[]
  keyPoints: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Usage
```typescript
// Server Action
import { getBrandMemoryAction, saveBrandMemoryAction } from '@/app/(features)/crm/campaigns/posts/actions'

// Get brand memory
const result = await getBrandMemoryAction()
const brandMemory = result.brandMemory

// Update brand memory
await saveBrandMemoryAction({
  productDescription: 'Fresh seafood from Cô Tô',
  brandVoice: {
    tone: 'warm, expert, trustworthy',
    writingPatterns: ['Tell real stories', 'Focus on quality']
  }
})
```

## Layer 2: Semantic Memory

### Purpose
Prevents content duplication through vector similarity search and enables semantic understanding of content.

### Implementation
- **Vector DB**: Qdrant Cloud
- **Embedding Service**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Adapters**:
  - `infrastructure/adapters/vector-db.ts`
  - `infrastructure/adapters/embedding-service.ts`
- **Use Cases**:
  - `store-content-embedding.ts`
  - `check-content-similarity.ts`

### Setup

1. **Create Qdrant Account**: https://cloud.qdrant.io/
2. **Get Credentials**: Cluster URL and API Key
3. **Environment Variables**:
```env
QDRANT_URL=https://xxx-xxx.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-api-key-here
OPENAI_API_KEY=your-openai-key
```

### Usage

#### Check Content Similarity
```typescript
import { checkContentSimilarityAction } from '@/app/(features)/crm/campaigns/posts/actions'

const result = await checkContentSimilarityAction({
  content: 'New post content...',
  title: 'Post title',
  platform: 'facebook',
  similarityThreshold: 0.8 // 0.0 to 1.0
})

if (result.isSimilar) {
  console.log(`Warning: ${result.warning}`)
  console.log('Similar content:', result.similarContent)
}
```

#### Store Embedding
```typescript
import { storeContentEmbeddingAction } from '@/app/(features)/crm/campaigns/posts/actions'

// After creating a post
await storeContentEmbeddingAction({
  postId: post.id,
  content: post.body,
  title: post.title,
  platform: 'facebook',
  topic: 'seafood quality'
})
```

### Collection Schema
- **Name**: `content_embeddings`
- **Vector Size**: 1536 dimensions
- **Distance Metric**: Cosine similarity
- **Capacity**: ~10,000 posts (1GB free tier)

## Layer 3: Episodic Memory

### Purpose
Maintains short-term memory of multi-pass generation process to improve content quality through iterative refinement.

### Implementation
- **Cache Service**: `infrastructure/adapters/cache-service.ts`
- **Storage**: In-memory Map with TTL (30 minutes)
- **Use Case**: `generate-post-multi-pass.ts`

### Multi-Pass Generation Pipeline

```
Idea Generation (Pass 1)
    ↓
Angle Exploration (Pass 2)
    ↓
Outline Creation (Pass 3)
    ↓
Draft Writing (Pass 4)
    ↓
Enhancement (Pass 5)
    ↓
Final Content
```

### Generation Session Structure
```typescript
interface GenerationSession {
  sessionId: string
  ideaPass?: {
    ideas: string[]
    selectedIdea: string
  }
  anglePass?: {
    angles: string[]
    selectedAngle: string
  }
  outlinePass?: {
    outline: string
    sections: string[]
  }
  draftPass?: {
    draft: string
    wordCount: number
  }
  enhancePass?: {
    enhanced: string
    improvements: string[]
  }
  metadata: {
    topic?: string
    platform?: string
    startedAt: Date
    lastUpdatedAt: Date
  }
  expiresAt: Date
}
```

### Usage

#### Single-Pass Generation (Simple)
```typescript
import { generatePostContentAction } from '@/app/(features)/crm/campaigns/posts/actions'

const result = await generatePostContentAction({
  topic: 'Fresh seafood quality',
  platform: 'facebook'
})

console.log(result.content.title)
console.log(result.content.content)
```

#### Multi-Pass Generation (High Quality)
```typescript
import { generatePostMultiPassAction } from '@/app/(features)/crm/campaigns/posts/actions'

const result = await generatePostMultiPassAction({
  topic: 'Fresh seafood quality',
  platform: 'facebook',
  sessionId: 'optional-session-id' // For resuming
})

console.log('Title:', result.title)
console.log('Content:', result.content)
console.log('Metadata:', result.metadata)
// Metadata shows:
// - ideasGenerated: 3
// - anglesExplored: 3
// - passesCompleted: ['idea', 'angle', 'outline', 'draft', 'enhance']
// - improvements: ['clarity improved', 'CTA strengthened', ...]
```

## Complete Workflow Example

### 1. Configure Brand Memory
```typescript
// Admin configures brand once
await saveBrandMemoryAction({
  productDescription: 'Premium fresh seafood from Cô Tô Island',
  niche: 'Fresh seafood, ocean-to-table quality',
  contentStyle: 'professional',
  language: 'vietnamese',
  brandVoice: {
    tone: 'warm, expert, trustworthy',
    writingPatterns: [
      'Tell real customer stories',
      'Focus on quality and freshness',
      'Avoid hype and exaggeration'
    ]
  },
  ctaLibrary: [
    'Nhắn tin nhận giá tươi hôm nay',
    'Đặt hàng nhanh 60s',
    'Gọi ngay để được tư vấn'
  ],
  keyPoints: [
    'Đánh bắt trong ngày',
    'Vận chuyển 0-4 độ C',
    'Hoàn toàn không ướp đá',
    'Cam kết tươi sống'
  ]
})
```

### 2. Generate High-Quality Content
```typescript
// Generate content with multi-pass
const generation = await generatePostMultiPassAction({
  topic: 'Tôm hùm tươi từ Cô Tô',
  platform: 'facebook'
})

// Check for similarity before publishing
const similarity = await checkContentSimilarityAction({
  content: generation.content,
  title: generation.title,
  platform: 'facebook',
  similarityThreshold: 0.85
})

if (similarity.isSimilar) {
  console.log('⚠️ Content too similar to existing posts')
  console.log('Consider regenerating with different angle')
} else {
  console.log('✅ Content is unique')
}
```

### 3. Create Post and Store Embedding
```typescript
// Create the post
const post = await createPostAction(formData)

// Store embedding for future similarity checks
if (post.success) {
  await storeContentEmbeddingAction({
    postId: post.postId,
    content: generation.content,
    title: generation.title,
    platform: 'facebook',
    topic: 'Tôm hùm tươi'
  })
}
```

## API Reference

### Server Actions

All server actions are located in:
```
app/(features)/crm/campaigns/posts/actions.ts
```

#### Brand Memory
- `getBrandMemoryAction()` - Get current brand memory
- `saveBrandMemoryAction(payload)` - Update brand memory

#### Content Generation
- `generatePostContentAction(params)` - Simple generation
- `generatePostMultiPassAction(params)` - Multi-pass generation

#### Semantic Memory
- `checkContentSimilarityAction(params)` - Check similarity
- `storeContentEmbeddingAction(params)` - Store embedding

## Performance Considerations

### Costs
- **OpenAI GPT-4o-mini**: ~$0.01 per generation
- **OpenAI Embeddings**: ~$0.0001 per embedding
- **Qdrant**: Free tier (1GB)
- **MongoDB**: Shared cluster (free)

### Response Times
- **Single-pass**: 3-5 seconds
- **Multi-pass**: 15-25 seconds (5 LLM calls)
- **Similarity check**: 1-2 seconds
- **Store embedding**: 1-2 seconds

### Optimization Tips
1. Use single-pass for quick drafts
2. Use multi-pass for important content
3. Cache brand memory (MongoDB query optimization)
4. Batch similarity checks
5. Run embedding storage asynchronously

## Troubleshooting

### Common Issues

#### 1. "OPENAI_API_KEY not found"
- Add `OPENAI_API_KEY` to `.env.local`
- Restart Next.js server

#### 2. "Qdrant connection failed"
- Verify `QDRANT_URL` and `QDRANT_API_KEY`
- Check cluster status in Qdrant Cloud dashboard
- Ensure network connectivity

#### 3. "Brand memory returns default"
- Brand memory not configured yet
- Use `saveBrandMemoryAction` to configure

#### 4. "Multi-pass generation timeout"
- Increase timeout in server action
- Check OpenAI API status
- Reduce model temperature

#### 5. "Session not found"
- Session expired (30 min TTL)
- Start new generation session

### Debug Mode

Enable detailed logging:
```typescript
// In use case files, add:
console.log('[Debug] Pass completed:', passName)
console.log('[Debug] Cache size:', cache.size())
```

## Future Enhancements

### Planned Features
1. **Redis Integration** - Distributed cache for multi-server
2. **Content Scoring** - Automatic quality scoring
3. **A/B Testing** - Generate variations for testing
4. **Performance Analytics** - Track generated content performance
5. **Custom LLM Models** - Support for other LLM providers

### Configuration Options
All features are optional and fail gracefully:
- System works without Qdrant (no similarity check)
- System works without brand memory (uses defaults)
- Single-pass always available as fallback

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project architecture
- [QDRANT_SETUP_GUIDE.md](../.taskmaster/docs/todos/features/QDRANT_SETUP_GUIDE.md) - Qdrant setup
- [AI Content.md](../.taskmaster/docs/todos/features/AI%20Content.md) - Implementation plan
