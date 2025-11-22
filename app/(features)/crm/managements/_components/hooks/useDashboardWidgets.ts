import { create } from 'zustand'
import { Widget } from '../GridStackDashboard'

const STORAGE_KEY = 'dashboard-layout'

// Safe localStorage access that works with SSR
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Error setting localStorage:', error)
    }
  }
}

interface DashboardState {
  widgets: Widget[]
  defaultWidgets: Widget[]
  setDefaultWidgets: (widgets: Widget[]) => void
  setWidgets: (widgets: Widget[]) => void
  saveWidgets: (widgets: Widget[]) => void
  resetWidgets: () => void
  initializeFromStorage: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  widgets: [],
  defaultWidgets: [],

  // Set default widgets (called from page)
  setDefaultWidgets: (defaultWidgets) => {
    set({ defaultWidgets })
    // If widgets empty, initialize from storage or use defaults
    if (get().widgets.length === 0) {
      get().initializeFromStorage()
    }
  },

  // Update widgets state only (no localStorage)
  setWidgets: (widgets) => set({ widgets }),

  // Save to localStorage and update state
  saveWidgets: (widgets) => {
    const toSave = widgets.map(w => ({
      id: w.id,
      module: w.module,
      visible: w.visible,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
    }))
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    set({ widgets })
  },

  // Reset from localStorage
  resetWidgets: () => {
    const savedData = safeLocalStorage.getItem(STORAGE_KEY)
    const { defaultWidgets } = get()

    if (savedData) {
      try {
        const savedWidgets: Widget[] = JSON.parse(savedData)
        const merged = defaultWidgets.length > 0
          ? mergeWithDefaults(defaultWidgets, savedWidgets)
          : savedWidgets
        set({ widgets: merged })
      } catch (error) {
        console.error('Failed to parse saved dashboard layout:', error)
        set({ widgets: defaultWidgets })
      }
    } else {
      set({ widgets: defaultWidgets })
    }
  },

  // Initialize from localStorage
  initializeFromStorage: () => {
    const savedData = safeLocalStorage.getItem(STORAGE_KEY)
    const { defaultWidgets } = get()

    if (savedData) {
      try {
        const savedWidgets: Widget[] = JSON.parse(savedData)
        const merged = defaultWidgets.length > 0
          ? mergeWithDefaults(defaultWidgets, savedWidgets)
          : savedWidgets
        set({ widgets: merged })
      } catch (error) {
        console.error('Failed to initialize dashboard store:', error)
        set({ widgets: defaultWidgets })
      }
    } else {
      set({ widgets: defaultWidgets })
    }
  }
}))

// Helper: merge saved layout with defaultWidgets
function mergeWithDefaults(defaultWidgets: Widget[], saved: Widget[]): Widget[] {
  return defaultWidgets.map(defaultWidget => {
    const savedWidget = saved.find(w => w.id === defaultWidget.id)
    return savedWidget
      ? {
        ...defaultWidget,
        visible: savedWidget.visible,
        x: savedWidget.x,
        y: savedWidget.y,
        w: savedWidget.w,
        h: savedWidget.h
      }
      : defaultWidget
  })
}

// Legacy hook for backward compatibility
export function useDashboardWidgets(defaultWidgets: Widget[] = []) {
  const store = useDashboardStore()

  // Set defaults on mount
  if (defaultWidgets.length > 0 && store.defaultWidgets.length === 0) {
    store.setDefaultWidgets(defaultWidgets)
  }

  return {
    widgets: store.widgets,
    saveWidgets: store.saveWidgets,
    resetWidgets: store.resetWidgets
  }
}
