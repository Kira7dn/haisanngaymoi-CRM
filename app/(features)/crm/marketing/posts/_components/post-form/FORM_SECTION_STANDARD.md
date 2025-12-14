# Form Section Standard - ViewModel + Events Pattern

## 📋 Overview

This document defines the **standard pattern** for all form sections in the CRM when using XState workflow management.

**Core Principle:**
> Form Sections communicate via **ViewModels + Events**, never directly with XState machine or workflow state.

---

## 🎯 Architecture Pattern

```
┌──────────────────────────────────────────────────┐
│ PostForm (Controller)                            │
│  ├─ XState Machine (workflow orchestration)      │
│  ├─ Selectors (machine → ViewModel)              │
│  ├─ Event Creators (UI intent → machine events)  │
│  └─ Wire ViewModels + Events to Sections         │
└──────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ViewModel             Events
         │                    │
         ▼                    ▼
┌──────────────────────────────────────────────────┐
│ FormSection (Pure UI Component)                  │
│  ├─ Render based on ViewModel                    │
│  ├─ Call events on user interactions             │
│  ├─ NO workflow logic                            │
│  └─ NO XState coupling                           │
└──────────────────────────────────────────────────┘
```

---

## ✅ Standard Section Props Interface

### Template

```typescript
// ViewModels (data for rendering)
export interface [Section]ViewModel {
  // State data
  field1: string
  field2: boolean

  // Computed/derived state
  isDisabled: boolean
  isLoading: boolean

  // Reference data
  options: Option[]
}

// Events (user interactions)
export interface [Section]Events {
  onAction1: () => void
  onAction2: (param: string) => void
  onAction3: (value: ComplexType) => void
}

// Section Props
export interface [Section]Props {
  viewModel: [Section]ViewModel
  events: [Section]Events
}
```

### Example: AIGenerationSection

```typescript
export interface AIGenerationViewModel {
  mode: 'simple' | 'multi-pass'
  isGenerating: boolean
  isDisabled: boolean
  progress: string[]
  similarityWarning: string | null
  hasBrandMemory: boolean
  showSettings: boolean
}

export interface AIGenerationEvents {
  onGenerate: () => void
  onToggleSettings: () => void
  onChangeMode: (mode: 'simple' | 'multi-pass') => void
}

export interface AIGenerationSectionProps {
  viewModel: AIGenerationViewModel
  events: AIGenerationEvents
}
```

---

## 📁 File Organization

### Required Files

```
/post-form/
├── postForm.machine.ts         # XState machine definition
├── postForm.selectors.ts       # Selectors (machine → ViewModels)
├── _hook/
│   ├── usePostFormMachine.ts   # Machine hook + Event creators
│   └── usePostFormState.ts     # Form data state
├── form-sections/
│   ├── AIGenerationSection.tsx # Section components
│   └── ...
├── PostForm.tsx                # Controller (wires everything)
└── PostFormView.tsx            # View layer
```

### Selectors File Structure

```typescript
// postForm.selectors.ts
import type { ActorRefFrom } from 'xstate'
import type { postFormMachine } from './postForm.machine'
import type { PostFormState } from './_hook/usePostFormState'

type MachineSnapshot = ReturnType<ActorRefFrom<typeof postFormMachine>['getSnapshot']>

export interface SectionViewModel {
  // ... fields
}

export function selectSectionViewModel(
  machineState: MachineSnapshot,
  formState: PostFormState
): SectionViewModel {
  return {
    // ... transform machine + form state to ViewModel
  }
}
```

### Event Creators File Structure

```typescript
// In usePostFormMachine.ts
export interface SectionEvents {
  onAction: () => void
}

export function createSectionEvents(
  send: (event: any) => void,
  setField: (key: string, value: any) => void
): SectionEvents {
  return {
    onAction: () => send({ type: 'ACTION_EVENT' })
  }
}
```

---

## 🏗️ Implementation Checklist

### Phase 1: Define Contracts

- [ ] Create ViewModel interface in `postForm.selectors.ts`
- [ ] Create Events interface in `usePostFormMachine.ts`
- [ ] Document responsibilities in comments

### Phase 2: Create Selectors

- [ ] Implement selector function
- [ ] Map machine state → ViewModel
- [ ] Map form state → ViewModel
- [ ] Add unit tests for selector

### Phase 3: Create Event Creators

- [ ] Implement event creator function
- [ ] Map UI intents → machine events
- [ ] Map UI intents → form state updates
- [ ] Document event flows

### Phase 4: Refactor Section Component

- [ ] Update props interface
- [ ] Extract ViewModel destructuring
- [ ] Extract Events destructuring
- [ ] Remove direct dependencies
- [ ] Test component in isolation

### Phase 5: Wire in Controller

- [ ] Import selector
- [ ] Import event creator
- [ ] Create ViewModel with `useMemo`
- [ ] Create Events with `useMemo`
- [ ] Pass to View layer
- [ ] Test integration

---

## 🚫 Anti-Patterns (What NOT to Do)

### ❌ **DON'T**: Pass Machine State Directly

```typescript
// BAD
<Section
  machineState={machineState}
  send={send}
/>
```

**Why:** Couples section to XState, makes it untestable, breaks encapsulation.

---

### ❌ **DON'T**: Pass Individual Fields

```typescript
// BAD
<Section
  field1={state.field1}
  field2={state.field2}
  field3={state.field3}
  isLoading={machineState.matches('loading')}
  onChange1={(v) => setField('field1', v)}
  onChange2={(v) => setField('field2', v)}
/>
```

**Why:** Props explosion, hard to maintain, no clear boundaries.

---

### ❌ **DON'T**: Mix Concerns

```typescript
// BAD
export interface SectionProps {
  viewModel: ViewModel  // ✅ Good
  onAction: () => void  // ❌ Mixed with Events
  state: FormState      // ❌ Leaking implementation
}
```

**Why:** Unclear contract, hard to understand what belongs where.

---

### ❌ **DON'T**: Inline ViewModels

```typescript
// BAD
<Section
  viewModel={{
    field1: state.field1,  // Inline object creation
    field2: isLoading
  }}
/>
```

**Why:** Re-creates on every render, no memoization, no reusability.

---

## ✅ Patterns (What TO Do)

### ✅ **DO**: Use Selectors with useMemo

```typescript
// GOOD
const sectionViewModel = useMemo(
  () => selectSectionViewModel(machineState, state),
  [machineState, state]
)
```

---

### ✅ **DO**: Group Related Events

```typescript
// GOOD
const sectionEvents = useMemo(
  () => createSectionEvents(send, setField),
  [send, setField]
)
```

---

### ✅ **DO**: Document ViewModel Fields

```typescript
// GOOD
export interface AIGenerationViewModel {
  /** Current generation mode selected by user */
  mode: 'simple' | 'multi-pass'

  /** Whether AI generation is currently in progress */
  isGenerating: boolean

  /** Whether generation button should be disabled (no platform selected) */
  isDisabled: boolean
}
```

---

### ✅ **DO**: Use Semantic Event Names

```typescript
// GOOD
export interface SectionEvents {
  onGenerate: () => void           // User intent: "generate content"
  onChangeMode: (mode) => void     // User intent: "change mode"
  onToggleSettings: () => void     // User intent: "toggle settings"
}

// BAD
export interface SectionEvents {
  onClick: () => void              // Too generic
  handleClick: () => void          // Not user-intent
  doGeneration: () => void         // Implementation detail
}
```

---

## 🧪 Testing Strategy

### Unit Test: Selectors

```typescript
describe('selectAIGenerationViewModel', () => {
  it('should map machine state to ViewModel', () => {
    const machineState = createMachineState({ ... })
    const formState = createFormState({ ... })

    const viewModel = selectAIGenerationViewModel(machineState, formState)

    expect(viewModel.isGenerating).toBe(true)
    expect(viewModel.mode).toBe('multi-pass')
  })
})
```

### Unit Test: Event Creators

```typescript
describe('createAIGenerationEvents', () => {
  it('should create event handlers', () => {
    const send = vi.fn()
    const setField = vi.fn()

    const events = createAIGenerationEvents(send, setField)
    events.onGenerate()

    expect(send).toHaveBeenCalledWith({ type: 'GENERATE_REQUEST' })
  })
})
```

### Component Test: Section

```typescript
describe('AIGenerationSection', () => {
  it('should render based on ViewModel', () => {
    const viewModel: AIGenerationViewModel = {
      mode: 'simple',
      isGenerating: false,
      isDisabled: false,
      progress: [],
      similarityWarning: null,
      hasBrandMemory: true,
      showSettings: false
    }

    const events: AIGenerationEvents = {
      onGenerate: vi.fn(),
      onToggleSettings: vi.fn(),
      onChangeMode: vi.fn()
    }

    render(<AIGenerationSection viewModel={viewModel} events={events} />)

    expect(screen.getByText('Generate with AI')).toBeInTheDocument()
  })
})
```

---

## 📚 Migration Guide

### Migrating Existing Section to ViewModel Pattern

#### Step 1: Analyze Current Props

```typescript
// BEFORE
interface OldSectionProps {
  field1: string
  field2: boolean
  onChange1: (v: string) => void
  onChange2: (v: boolean) => void
  isLoading: boolean
}
```

#### Step 2: Group into ViewModel + Events

```typescript
// AFTER
interface SectionViewModel {
  field1: string
  field2: boolean
  isLoading: boolean
}

interface SectionEvents {
  onChangeField1: (v: string) => void
  onChangeField2: (v: boolean) => void
}
```

#### Step 3: Create Selector

```typescript
export function selectSectionViewModel(
  machineState: MachineSnapshot,
  formState: FormState
): SectionViewModel {
  return {
    field1: formState.field1,
    field2: formState.field2,
    isLoading: machineState.matches('loading')
  }
}
```

#### Step 4: Create Event Creator

```typescript
export function createSectionEvents(
  send: Send,
  setField: SetField
): SectionEvents {
  return {
    onChangeField1: (v) => setField('field1', v),
    onChangeField2: (v) => setField('field2', v)
  }
}
```

#### Step 5: Update Component

```typescript
// BEFORE
export default function Section({
  field1,
  field2,
  onChange1,
  onChange2,
  isLoading
}: OldSectionProps) {
  // ...
}

// AFTER
export default function Section({
  viewModel,
  events
}: SectionProps) {
  const { field1, field2, isLoading } = viewModel
  const { onChangeField1, onChangeField2 } = events
  // ...
}
```

---

## 🎓 Benefits of This Pattern

| Aspect | Benefit |
|--------|---------|
| **Testability** | Sections can be tested with mock ViewModels |
| **Reusability** | Sections work anywhere with same ViewModel shape |
| **Maintainability** | Clear contracts, easy to understand |
| **Performance** | Memoized ViewModels prevent unnecessary re-renders |
| **Type Safety** | Strong typing for all interactions |
| **Debugging** | Clear data flow, easy to trace issues |
| **Scalability** | Pattern works for simple and complex sections |

---

## 📖 Real-World Example

See `AIGenerationSection.tsx` for a complete implementation following this standard.

**Files to Reference:**
- [postForm.selectors.ts](./postForm.selectors.ts) - Selector definitions
- [usePostFormMachine.ts](./_hook/usePostFormMachine.ts) - Event creators
- [AIGenerationSection.tsx](./form-sections/AIGenerationSection.tsx) - Section component
- [PostForm.tsx](./PostForm.tsx) - Controller wiring

---

## 🚀 Next Steps

1. **Apply to all existing sections** (PlatformSelector, ContentInput, MediaSchedule, QualityScore)
2. **Create `selectAllViewModels()` composite selector** for performance optimization
3. **Add Storybook stories** for each section with different ViewModel states
4. **Document edge cases** and FAQ based on team questions

---

## ❓ FAQ

### Q: Can a section have multiple ViewModels?

**A:** No. Each section should have one ViewModel. If you need multiple, split into sub-sections.

### Q: Should ViewModels be nested?

**A:** Avoid nesting. Keep ViewModels flat for better performance and clarity.

### Q: Can Events be async?

**A:** Events should be sync. Async operations are handled by the machine/controller.

### Q: How to handle form validation?

**A:** Validation results go in ViewModel. Validation logic stays in machine or use cases.

### Q: What if section needs global state?

**A:** Include in ViewModel via selector. Section never accesses global state directly.

---

## 📝 Changelog

- **2025-06-14**: Initial version created
- **TBD**: Update after applying to all sections

---

## 🤝 Contributing

When adding new form sections:

1. Follow this standard
2. Add selector + event creator
3. Update this doc with examples if needed
4. Get code review focusing on adherence to pattern

---

**This is the CRM Form Section Standard. All new sections MUST follow this pattern.**
