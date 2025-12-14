# Form Sections Migration Guide

## ✅ Completed Migrations

### 1. AIGenerationSection
- **Status**: ✅ **100% Complete**
- **ViewModel**: `AIGenerationViewModel`
- **Events**: `AIGenerationEvents`
- **Files**:
  - [AIGenerationSection.tsx](./form-sections/AIGenerationSection.tsx)
  - Selector in [postForm.selectors.ts](./postForm.selectors.ts#L98-L110)
  - Events in [usePostFormMachine.ts](./_hook/usePostFormMachine.ts#L278-L287)

**Result**: Props reduced from **10 → 2** (80% reduction)

---

### 2. QualityScoreDisplaySection
- **Status**: ✅ **100% Complete**
- **ViewModel**: `QualityScoreViewModel` (read-only, no events)
- **Files**:
  - [QualityScoreDisplaySection.tsx](./form-sections/QualityScoreDisplaySection.tsx)
  - Selector in [postForm.selectors.ts](./postForm.selectors.ts#L161-L171)

**Result**: Read-only section, perfectly demonstrates ViewModel-only pattern

---

### 3. PlatformSelectorSection
- **Status**: ✅ **100% Complete**
- **ViewModel**: `PlatformSelectorViewModel`
- **Events**: `PlatformSelectorEvents`
- **Files**:
  - [PlatformSelectorSection.tsx](./form-sections/PlatformSelectorSection.tsx)
  - Selector in [postForm.selectors.ts](./postForm.selectors.ts#L116-L133)
  - Events in [usePostFormMachine.ts](./_hook/usePostFormMachine.ts#L292-L303)

**Result**: Complex toggle logic now encapsulated in event creator

---

## 📋 Remaining Sections (Ready to Migrate)

All selectors and event creators are **ALREADY DEFINED**. Only component refactoring needed.

### 4. ContentInputSection
- **Status**: 🔧 Ready to migrate
- **ViewModel**: `ContentInputViewModel` ✅ Defined
- **Events**: `ContentInputEvents` ✅ Defined
- **Current Props**: ~9 props
- **After Migration**: 2 props

**Migration Steps:**
```typescript
// 1. Import types
import type { ContentInputViewModel } from '../postForm.selectors'
import type { ContentInputEvents } from '../_hook/usePostFormMachine'

// 2. Update interface
export interface ContentInputSectionProps {
  viewModel: ContentInputViewModel
  events: ContentInputEvents
}

// 3. Destructure in component
const { title, body, isDisabled, hasContent, variations } = viewModel
const { onChangeTitle, onChangeBody, onSelectVariation } = events

// 4. Replace all prop usages
```

---

### 5. MediaHashtagScheduleSection
- **Status**: 🔧 Ready to migrate
- **ViewModel**: `MediaScheduleViewModel` ✅ Defined
- **Events**: `MediaScheduleEvents` ✅ Defined
- **Current Props**: ~8 props
- **After Migration**: 2 props

**Migration Steps:** Same as ContentInputSection

---

## 🎯 Migration Checklist (Copy per section)

For each remaining section:

- [ ] **Step 1**: Import ViewModel and Events types
- [ ] **Step 2**: Update Props interface to `{ viewModel, events }`
- [ ] **Step 3**: Destructure ViewModel at top of component
- [ ] **Step 4**: Destructure Events at top of component
- [ ] **Step 5**: Replace all old props with ViewModel fields
- [ ] **Step 6**: Replace all old handlers with Events
- [ ] **Step 7**: Test component renders correctly
- [ ] **Step 8**: Update PostFormView to pass ViewModels

---

## 📊 Migration Impact

| Section | Before | After | Reduction |
|---------|--------|-------|-----------|
| AIGenerationSection | 10 props | 2 props | **80%** |
| QualityScoreDisplay | 1 prop | 1 prop | 0% (already optimal) |
| PlatformSelector | 5 props | 2 props | **60%** |
| ContentInput | ~9 props | 2 props | **78%** (estimated) |
| MediaSchedule | ~8 props | 2 props | **75%** (estimated) |

**Average Reduction**: ~73% fewer props to manage

---

## 🏗️ Wiring in PostForm.tsx

### Current Pattern (for migrated sections)

```typescript
// In PostForm.tsx

// 1. Create ViewModels
const aiGenerationViewModel = useMemo(
  () => selectAIGenerationViewModel(machineState, state),
  [machineState, state]
)

const qualityScoreViewModel = useMemo(
  () => selectQualityScoreViewModel(machineState, state),
  [machineState, state]
)

const platformSelectorViewModel = useMemo(
  () => selectPlatformSelectorViewModel(machineState, state),
  [machineState, state]
)

// 2. Create Events
const aiGenerationEvents = useMemo(
  () => createAIGenerationEvents(send, setField),
  [send, setField]
)

const platformSelectorEvents = useMemo(
  () => createPlatformSelectorEvents(setField, state.platforms),
  [setField, state.platforms]
)

// 3. Pass to View
<PostFormView
  {...existingProps}
  aiGenerationViewModel={aiGenerationViewModel}
  aiGenerationEvents={aiGenerationEvents}
  qualityScoreViewModel={qualityScoreViewModel}
  platformSelectorViewModel={platformSelectorViewModel}
  platformSelectorEvents={platformSelectorEvents}
/>
```

### TODO: Add remaining sections

```typescript
// For ContentInput
const contentInputViewModel = useMemo(
  () => selectContentInputViewModel(machineState, state),
  [machineState, state]
)

const contentInputEvents = useMemo(
  () => createContentInputEvents(setField, updateMultipleFields),
  [setField, updateMultipleFields]
)

// For MediaSchedule
const mediaScheduleViewModel = useMemo(
  () => selectMediaScheduleViewModel(machineState, state),
  [machineState, state]
)

const mediaScheduleEvents = useMemo(
  () => createMediaScheduleEvents(setField),
  [setField]
)
```

---

## 🧪 Testing After Migration

### Unit Test Template

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionName from './SectionName'

describe('SectionName', () => {
  it('should render with ViewModel', () => {
    const viewModel = {
      // ... mock ViewModel
    }

    const events = {
      onAction: vi.fn()
    }

    render(<SectionName viewModel={viewModel} events={events} />)

    // Assertions
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('should call event on user interaction', () => {
    const viewModel = { /* ... */ }
    const events = { onAction: vi.fn() }

    render(<SectionName viewModel={viewModel} events={events} />)

    // Trigger event
    fireEvent.click(screen.getByRole('button'))

    expect(events.onAction).toHaveBeenCalled()
  })
})
```

---

## 🎓 Key Learnings from Completed Migrations

### 1. **Read-Only Sections** (QualityScoreDisplay)
- Only need ViewModel
- No events required
- Simplest pattern

### 2. **Interactive Sections** (AIGeneration, PlatformSelector)
- ViewModel + Events
- Events handle all user interactions
- Component becomes pure presenter

### 3. **Complex Logic** (PlatformSelector with compatibility)
- Keep domain logic in component (compatibility mapping)
- ViewModel provides state
- Events handle state changes

---

## 🚀 Performance Optimization

After all migrations, consider:

### Composite Selector

```typescript
// In postForm.selectors.ts
export function selectAllViewModels(
  machineState: MachineSnapshot,
  formState: PostFormState
) {
  return {
    aiGeneration: selectAIGenerationViewModel(machineState, formState),
    qualityScore: selectQualityScoreViewModel(machineState, formState),
    platformSelector: selectPlatformSelectorViewModel(machineState, formState),
    contentInput: selectContentInputViewModel(machineState, formState),
    mediaSchedule: selectMediaScheduleViewModel(machineState, formState)
  }
}
```

### Usage in PostForm

```typescript
const viewModels = useMemo(
  () => selectAllViewModels(machineState, state),
  [machineState, state]
)

// Destructure
const {
  aiGeneration,
  qualityScore,
  platformSelector,
  contentInput,
  mediaSchedule
} = viewModels
```

**Benefit**: Single memoization, single selector call, better performance

---

## 📚 Additional Resources

- [FORM_SECTION_STANDARD.md](./FORM_SECTION_STANDARD.md) - Complete standard
- [postForm.selectors.ts](./postForm.selectors.ts) - All selectors
- [usePostFormMachine.ts](./_hook/usePostFormMachine.ts) - All event creators

---

## ✅ Completion Criteria

Section is considered **migrated** when:

1. ✅ Props interface uses `{ viewModel, events }`
2. ✅ Component destructures ViewModel and Events
3. ✅ No direct state management in component
4. ✅ No XState coupling
5. ✅ Unit tests pass
6. ✅ Integrated in PostFormView
7. ✅ Old props removed

---

**Last Updated**: 2025-06-14
**Next Steps**: Migrate ContentInputSection and MediaHashtagScheduleSection
