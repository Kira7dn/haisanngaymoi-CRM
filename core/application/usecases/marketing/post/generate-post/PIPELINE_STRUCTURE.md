# Post Generation Pipeline Structure

## Overview

The post generation pipeline has been refactored to use a modular, extensible architecture with the `GenerationPass` interface. Each pass implements a specific stage of content generation and can be independently enabled, disabled, or skipped based on configuration and session state.

## Pipeline Architecture

### Core Interfaces

#### `GenerationPass`
```typescript
export interface GenerationPass {
  readonly name: PassType
  canSkip(session: any): boolean
  execute(ctx: PassContext): AsyncGenerator<GenerationEvent, void, unknown>
}
```

#### `PassContext`
```typescript
export interface PassContext {
  request: any
  sessionId: string
  brandContext: string
  cache: any
  llm: any
}
```

#### `PassType`
```typescript
export type PassType =
  | 'research'  // External research via Perplexity
  | 'rag'       // Knowledge retrieval from vector DB
  | 'idea'      // Content idea generation
  | 'angle'     // Angle exploration
  | 'outline'   // Content structure
  | 'draft'     // Initial draft (streaming)
  | 'enhance'   // Content enhancement (streaming)
  | 'scoring'   // Quality scoring
```

## Pipeline Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         ResearchPass (Optional)          │  Requires: PERPLEXITY_API_KEY
│  • External web research                 │  Provides: insights, risks, angles
│  • Current trends & facts                │  Skips if: No topic or not configured
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│           RAGPass (Optional)             │  Requires: QDRANT_URL + QDRANT_API_KEY
│  • Vector similarity search              │  Provides: relevant past content
│  • Knowledge resource retrieval          │  Skips if: No topic or not configured
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        IdeaGenerationPass (Core)         │  Always runs (unless cached)
│  • Generates 3 content ideas             │  Provides: ideas array + selected
│  • Based on brand context + research     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│           AnglePass (Core)               │  Requires: IdeaPass completed
│  • Explores 3 different angles           │  Provides: angles array + selected
│  • Different perspectives                │  Dependency: selectedIdea
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          OutlinePass (Core)              │  Requires: Idea + Angle completed
│  • Creates content structure             │  Provides: title, outline, sections
│  • Hook → Main Points → CTA             │  Emits: 'title:ready' event
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      DraftStreamingPass (Core)           │  Requires: Outline completed
│  • Writes initial content                │  Provides: draft text
│  • Streams tokens in real-time          │  Emits: 'body:token' events
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     EnhanceStreamingPass (Core)          │  Requires: Draft completed
│  • Improves clarity & engagement         │  Provides: enhanced content
│  • Fixes grammar                         │  Emits: 'body:token' events
│  • Strengthens CTA                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         ScoringPass (Optional)           │  Requires: Draft or Enhance
│  • Quality scoring (0-100)               │  Provides: score, breakdown
│  • Identifies weaknesses                 │  Non-blocking: continues on error
│  • Suggests improvements                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Final Response                   │
│  • Title + Body/Content                  │
│  • Complete metadata                     │
│  • All pass results                      │
└─────────────────────────────────────────┘
```

## Implementation Details

### 1. ResearchPass
**File**: `research-rag-pass.ts`

- Uses Perplexity AI for online research
- Provides current trends, risks, and recommended angles
- **Optional**: Skips if `PERPLEXITY_API_KEY` not configured
- **Graceful failure**: Continues pipeline with empty results on error

### 2. RAGPass
**File**: `research-rag-pass.ts`

- Retrieves relevant knowledge from vector database (Qdrant)
- Filters for `knowledge_resource` content type
- **Optional**: Skips if `QDRANT_URL` and `QDRANT_API_KEY` not configured
- **Graceful failure**: Continues pipeline with empty results on error

### 3. IdeaGenerationPass
**File**: `ideapass.ts`

- Generates 3 unique content ideas
- Uses research context if available
- Automatically selects first idea
- **Core pass**: Always runs (unless cached)

### 4. AnglePass
**File**: `angle-pass.ts`

- Generates 3 different angles for selected idea
- Considers different audience perspectives
- **Dependency**: Requires `ideaPass.selectedIdea`
- **Core pass**: Always runs (unless cached)

### 5. OutlinePass
**File**: `outline-pass.ts`

- Creates content structure (Hook → Main Points → CTA)
- Generates catchy title (max 12 words)
- Emits `title:ready` event
- **Dependencies**: Requires `selectedIdea` and `selectedAngle`
- **Core pass**: Always runs (unless cached)

### 6. DraftStreamingPass
**File**: `draft-pass.ts`

- Writes full content based on outline
- Streams tokens in real-time
- Emits `body:token` events with pass='draft'
- **Dependency**: Requires `outlinePass.outline`
- **Core pass**: Always runs (unless cached)

### 7. EnhanceStreamingPass
**File**: `enhance-pass.ts`

- Improves clarity and engagement
- Fixes grammatical issues
- Strengthens call-to-action
- Streams tokens in real-time
- Emits `body:token` events with pass='enhance'
- **Dependency**: Requires `draftPass.draft`
- **Core pass**: Always runs (unless cached)

### 8. ScoringPass
**File**: `scoring-pass.ts`

- Scores content on 5 criteria (0-20 each):
  - Clarity
  - Engagement
  - Brand Voice
  - Platform Fit
  - Safety
- Identifies weaknesses and suggests fixes
- **Non-blocking**: Continues pipeline even if scoring fails
- **Optional but recommended**: Provides valuable quality metrics

## Session State Management

All pass results are stored in `GenerationSession`:

```typescript
export interface GenerationSession {
  sessionId: string
  researchPass?: { insights, risks, recommendedAngles, sources }
  ragPass?: { context, sources }
  ideaPass?: { ideas, selectedIdea }
  anglePass?: { angles, selectedAngle }
  outlinePass?: { outline, sections, title }
  draftPass?: { draft, wordCount }
  enhancePass?: { enhanced, improvements }
  scoringPass?: { score, scoreBreakdown, weaknesses, suggestedFixes }
  metadata: { topic, platform, startedAt, lastUpdatedAt }
  expiresAt: Date
}
```

## Event Stream

The pipeline emits events for real-time UI updates:

```typescript
export type GenerationEvent =
  | { type: 'pass:start'; pass: PassType }
  | { type: 'title:ready'; title: string }
  | { type: 'body:token'; pass: 'draft' | 'enhance'; content: string }
  | { type: 'pass:complete'; pass: PassType }
  | { type: 'final'; result: MultiPassGenResponse }
  | { type: 'error'; message: string }
```

## Pipeline Registry

**File**: `stream-gen-multi-pass.ts`

```typescript
export const postGenerationPipeline: GenerationPass[] = [
  new ResearchPass(),        // Optional: External research via Perplexity
  new RAGPass(),             // Optional: Retrieve knowledge from vector DB
  new IdeaGenerationPass(),  // Generate content ideas
  new AnglePass(),           // Explore different angles
  new OutlinePass(),         // Create content structure
  new DraftStreamingPass(),  // Write initial draft (streaming)
  new EnhanceStreamingPass(), // Enhance and polish content (streaming)
  new ScoringPass(),         // Score content quality
]
```

## Key Features

### 1. Extensibility
- Add new passes by implementing `GenerationPass`
- Insert passes anywhere in the pipeline array
- No changes to orchestrator needed

### 2. Skip Logic
- Each pass implements `canSkip(session)`
- Skips if already completed (session caching)
- Skips if dependencies not met
- Skips if external services not configured

### 3. Streaming Support
- `DraftStreamingPass` and `EnhanceStreamingPass` stream tokens
- Real-time UI updates via `body:token` events
- Buffer accumulates for final parsing

### 4. Error Handling
- Optional passes fail gracefully (ResearchPass, RAGPass, ScoringPass)
- Core passes throw errors to stop pipeline
- Validation errors with descriptive messages

### 5. Dependency Management
- Passes check session state for required data
- Clear error messages when dependencies missing
- Automatic skip when prerequisites not met

## Usage Example

```typescript
const useCase = new GeneratePostMultiPassUseCase(
  llmService,
  cacheService,
  brandMemoryService,
  researchTopicUseCase,
  postGenerationPipeline // Use default or custom pipeline
)

for await (const event of useCase.execute({ topic: "AI trends" })) {
  switch (event.type) {
    case 'pass:start':
      console.log(`Starting ${event.pass}`)
      break
    case 'title:ready':
      console.log(`Title: ${event.title}`)
      break
    case 'body:token':
      process.stdout.write(event.content) // Stream to UI
      break
    case 'pass:complete':
      console.log(`Completed ${event.pass}`)
      break
    case 'final':
      console.log('Final result:', event.result)
      break
    case 'error':
      console.error('Error:', event.message)
      break
  }
}
```

## Configuration Requirements

### Required (Core Passes)
- LLM Service (Anthropic, OpenAI, etc.)
- Cache Service (in-memory or Redis)
- Brand Memory Service

### Optional (Enhancement Passes)
- `PERPLEXITY_API_KEY` - Enables ResearchPass
- `QDRANT_URL` + `QDRANT_API_KEY` - Enables RAGPass
- `OPENAI_API_KEY` - Required for RAGPass embeddings

## Benefits Over Previous Implementation

1. **Modularity**: Each pass is self-contained and testable
2. **Flexibility**: Easy to add, remove, or reorder passes
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: New passes don't affect existing code
5. **Testability**: Mock individual passes in isolation
6. **Reusability**: Passes can be used in different pipelines
7. **Performance**: Skip logic prevents redundant work
8. **Reliability**: Graceful degradation for optional features

## Future Enhancements

Potential additions to the pipeline:

- **ValidationPass**: Pre-check for brand safety, compliance
- **TranslationPass**: Multi-language support
- **ImageGenerationPass**: Generate accompanying visuals
- **SEOOptimizationPass**: Optimize for search engines
- **A/BTestingPass**: Generate variations for testing
- **PersonalizationPass**: Tailor content to audience segments
