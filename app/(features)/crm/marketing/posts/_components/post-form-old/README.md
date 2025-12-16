# PostForm Component Architecture

## 📖 Overview

The PostForm is a sophisticated form component for creating and editing marketing posts across multiple platforms (Facebook, TikTok, YouTube, Zalo, Instagram, WordPress). It features AI-powered content generation, quality scoring, and a state machine-driven workflow.

## 🏗️ Architecture

### Design Pattern: **Clean Architecture + ViewModel + Context**

```
┌─────────────────────────────────────────────────────────┐
│                   PostFormModal                         │
│               (Dialog Container)                        │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    PostForm                             │
│                 (Controller Layer)                      │
│  • Bootstrap initial data                               │
│  • Manage form state                                    │
│  • Orchestrate XState machine                          │
│  • Create ViewModels from state                        │
│  • Provide Context to children                         │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  PostFormView                           │
│                 (View Layer)                            │
│  • Pure presentation                                    │
│  • Consume Context                                      │
│  • No business logic                                    │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│   Section 1  │ │ Section 2 │ │  Section 3  │
│ (ViewModel)  │ │ (Context) │ │  (Context)  │
└──────────────┘ └───────────┘ └─────────────┘
```

## 📁 File Structure

```
post-form/
├── PostForm.tsx                    # ⚙️ Controller (main orchestration)
├── PostForm.optimized.tsx          # ⚡ Optimized version with memoization
├── PostFormView.tsx                # 🎨 View layer (presentation)
├── PostFormModal.tsx               # 🪟 Dialog wrapper
├── PostFormContext.tsx             # 🔄 React Context + hooks
├── postForm.machine.ts             # 🤖 XState workflow machine
├── postForm.selectors.ts           # 📊 ViewModel selectors
│
├── _hook/
│   ├── usePostFormState.ts         # 📝 Form state management
│   ├── usePostFormMachine.ts       # 🎭 Machine integration
│   ├── usePostFormActions.ts       # 🎬 Async actions
│   └── usePostFormInitialData.ts   # 🚀 Bootstrap data
│
├── form-sections/
│   ├── AIGenerationSection.tsx                  # 🤖 AI generation UI
│   ├── ContentInputSection.tsx                  # ✍️ Content inputs
│   ├── ContentInputSection.optimized.tsx        # ⚡ Optimized version
│   ├── PlatformSelectorSection.tsx              # 🎯 Platform selection
│   ├── QualityScoreDisplaySection.tsx           # 📊 Score display
│   ├── QualityScoreDisplaySection.optimized.tsx # ⚡ Optimized version
│   └── MediaHashtagScheduleSection.tsx          # 📷 Media & schedule
│
├── _utils/
│   └── performanceMonitor.ts       # 📈 Performance tracking
│
└── docs/
    ├── ARCHITECTURE_REVIEW.md      # 📋 Comprehensive review
    ├── IMPLEMENTATION_GUIDE.md     # 🚀 Optimization guide
    └── README.md                   # 📖 This file
```

## 🎯 Key Features

### 1. **AI-Powered Content Generation**
- ✅ Simple mode (single-pass, 3-5s)
- ✅ Multi-pass mode (5-stage pipeline, 15-25s)
- ✅ Brand voice integration
- ✅ Quality scoring (out of 100)
- ✅ Content similarity detection

### 2. **Multi-Platform Support**
- ✅ Facebook, TikTok, YouTube, Zalo
- ✅ Instagram, WordPress
- ✅ Platform-specific content type validation
- ✅ Compatibility warnings

### 3. **Workflow Management**
- ✅ XState machine for state transitions
- ✅ Draft/Schedule/Publish modes
- ✅ Unsaved changes detection
- ✅ Delete confirmation

### 4. **Type Safety**
- ✅ Full TypeScript coverage
- ✅ Type-safe ViewModels
- ✅ Strongly-typed events

## 🔧 Technical Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **XState 5** - State machine
- **React Context** - State management
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library

## 🚀 Usage

### Basic Usage

```tsx
import PostFormModal from './post-form/PostFormModal'

function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <PostFormModal
      open={open}
      onClose={() => setOpen(false)}
    />
  )
}
```

### Edit Existing Post

```tsx
<PostFormModal
  open={open}
  onClose={() => setOpen(false)}
  post={existingPost}  // Pass Post object
/>
```

### Pre-fill with Idea

```tsx
<PostFormModal
  open={open}
  onClose={() => setOpen(false)}
  initialIdea="Promote sustainable fishing practices"
  initialScheduledAt={new Date('2025-12-20')}
/>
```

## 🎨 Component API

### PostFormModal Props

```typescript
interface PostFormModalProps {
  open: boolean                 // Dialog open state
  onClose: () => void          // Close handler
  post?: Post                  // Existing post to edit
  initialScheduledAt?: Date    // Pre-fill scheduled date
}
```

### PostForm Props

```typescript
interface PostFormProps {
  post?: Post
  onClose?: () => void
  initialScheduledAt?: Date
  initialIdea?: string
  registerHandleClose?: (handler: () => Promise<void>) => void
}
```

## 📊 Performance Characteristics

### Current Architecture (Unoptimized)

| Metric | Value |
|--------|-------|
| Initial Render | ~150ms |
| Re-renders per state change | 5-7 components |
| Event handler recreation | Every render |
| Selector computations | 5 × renders |
| Bundle size | ~45KB |

### Optimized Architecture

| Metric | Value | Improvement |
|--------|-------|-------------|
| Initial Render | ~150ms | - |
| Re-renders per state change | 1-2 components | ✅ 70% |
| Event handler recreation | Once (mount) | ✅ 100% |
| Selector computations | 1-2 × renders | ✅ 80% |
| Bundle size | ~45KB | - |

See [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) for detailed analysis.

## 🔄 State Management

### Form State

Managed by `usePostFormState`:

```typescript
interface PostFormState {
  // Content
  title: string
  body: string
  media: PostMedia | null
  hashtags: string

  // Publishing
  platforms: Platform[]
  contentType: ContentType
  scheduledAt?: string

  // AI Generation
  idea: string
  product: Product | null
  contentInstruction: string
  variations: Variation[]

  // Quality
  scoringData: ScoringData | null
  similarityWarning: string | null
  generationProgress: string[]

  // UI
  showSettings: boolean
  generationMode: 'simple' | 'multi-pass'

  // System
  hasBrandMemory: boolean
  products: Product[]
}
```

### Workflow States (XState)

```
idle → editing → generating → generated
                     ↓
                  submitting → success
                     ↓
              confirmingClose → closed
                     ↓
              confirmingDelete → deleting → deleted
```

## 🧪 Testing

### Unit Tests

```bash
npm test post-form
```

### Integration Tests

```bash
npm test post-form/integration
```

### Performance Tests

```bash
npm test post-form/performance
```

## 🐛 Debugging

### Enable Performance Monitoring

```tsx
import { usePerformanceMonitor } from './_utils/performanceMonitor'

// In component
const monitor = usePerformanceMonitor('PostForm', true)

// Log metrics
useEffect(() => {
  monitor.logMetrics()
}, [])
```

### React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Record interaction
4. Analyze flame graph

### XState Inspector

```tsx
import { inspect } from '@xstate/inspect'

// In development
if (process.env.NODE_ENV === 'development') {
  inspect({ iframe: false })
}
```

## 🔒 Security Considerations

1. **Input Sanitization**: All user inputs are sanitized before submission
2. **XSS Protection**: Content is escaped before rendering
3. **CSRF Protection**: Forms include CSRF tokens
4. **File Upload**: Media uploads are validated and size-limited

## ♿ Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader support (ARIA labels)
- ✅ Focus management
- ✅ Color contrast (WCAG AA)

## 🌍 Internationalization

Currently supports:
- Vietnamese (primary)
- English (UI labels)

## 📈 Performance Optimization

### Quick Wins (Implemented)

1. ✅ Memoized Context value
2. ✅ Stable event creators
3. ✅ React.memo for sections
4. ✅ useCallback for handlers

### Advanced (Available)

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for:
- Context splitting
- Selector optimization
- Deep equality replacement
- Performance monitoring

## 🤝 Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Write JSDoc comments

### Before Committing

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## 📚 Related Documentation

- [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) - Detailed architecture analysis
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Performance optimization guide
- [XState Documentation](https://xstate.js.org/docs/)
- [React Performance](https://react.dev/learn/render-and-commit)

## 🎓 Learning Resources

### Architecture Patterns
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [ViewModel Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)
- [Presentation/Container Pattern](https://www.patterns.dev/posts/presentational-container-pattern)

### State Management
- [XState Guide](https://xstate.js.org/docs/guides/start.html)
- [React Context](https://react.dev/reference/react/useContext)

### Performance
- [React Optimization](https://react.dev/reference/react/memo)
- [useMemo vs useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

## 🆘 Troubleshooting

### Common Issues

**Issue:** Form doesn't update after AI generation
- **Solution:** Check machine state is transitioning correctly

**Issue:** Excessive re-renders
- **Solution:** Use performance monitor to identify cause

**Issue:** Context consumers re-rendering
- **Solution:** Implement context splitting or use optimized version

### Getting Help

1. Check existing documentation
2. Review code comments
3. Use performance monitoring
4. Check React DevTools

## 📝 Changelog

### v2.0.0 (Current)
- ✅ Complete refactor with Context pattern
- ✅ XState machine integration
- ✅ Performance optimizations available
- ✅ Comprehensive documentation

### v1.0.0
- Initial implementation with prop drilling
- Basic AI generation
- Platform selection

## 📄 License

Internal use only - LinkStrategy CRM

---

**Last Updated:** 2025-12-15
**Maintained By:** Development Team
**Status:** ✅ Production Ready
