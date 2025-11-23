import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Widget } from "../dashboard/ModuleGrid"

export type WidgetModule =
    | "finance"
    | "customer"
    | "order"
    | "product"
    | "risk"
    | "forecast"
    | "inventory"

const STORAGE_KEYS = {
    WIDGETS: "dashboard-layout",
    MODULE_ORDER: "dashboard-module-order",
}

const DEFAULT_MODULE_ORDER: WidgetModule[] = [
    "finance",
    "customer",
    "order",
    "product",
    "risk",
    "forecast",
    "inventory",
]

interface DashboardState {
    widgets: Widget[]
    defaultWidgets: Widget[]
    moduleOrder: WidgetModule[]

    // Widget actions
    setDefaultWidgets: (widgets: Widget[]) => void
    saveWidgets: (widgets: Widget[]) => void
    resetWidgets: () => void
    toggleWidgetVisibility: (id: string) => void
    updateWidgetLayout: (module: WidgetModule, updatedItems: Widget[]) => void

    // Module ordering actions
    setModuleOrder: (order: WidgetModule[]) => void
    moveModuleUp: (module: WidgetModule) => void
    moveModuleDown: (module: WidgetModule) => void
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            widgets: [],
            defaultWidgets: [],
            moduleOrder: DEFAULT_MODULE_ORDER,

            setDefaultWidgets: (defaultWidgets) => {
                const existing = get().widgets
                set({ defaultWidgets })

                const merged = existing.length
                    ? mergeWithDefaults(defaultWidgets, existing)
                    : defaultWidgets

                set({ widgets: merged })
            },

            saveWidgets: (widgets) => set({ widgets }),

            resetWidgets: () => set({ widgets: get().defaultWidgets }),

            toggleWidgetVisibility: (id) => {
                set({
                    widgets: get().widgets.map((widget) =>
                        widget.id === id
                            ? { ...widget, visible: !widget.visible }
                            : widget
                    ),
                })
            },

            updateWidgetLayout: (module, updatedItems) => {
                const widgets = get().widgets
                let changed = false

                const newWidgets = widgets.map((widget) => {
                    if (widget.module !== module) return widget

                    const updated = updatedItems.find((i) => i.id === widget.id)
                    if (!updated) return widget

                    const hasChanged =
                        widget.x !== updated.x ||
                        widget.y !== updated.y ||
                        widget.w !== updated.w ||
                        widget.h !== updated.h

                    if (hasChanged) {
                        changed = true
                        return { ...widget, ...updated }
                    }
                    return widget
                })

                if (changed) set({ widgets: newWidgets })
            },

            setModuleOrder: (moduleOrder) => set({ moduleOrder }),

            moveModuleUp: (module) => {
                const { moduleOrder, setModuleOrder } = get()
                const index = moduleOrder.indexOf(module)
                if (index > 0) {
                    const newOrder = [...moduleOrder]
                        ;[newOrder[index - 1], newOrder[index]] = [
                            newOrder[index],
                            newOrder[index - 1],
                        ]
                    setModuleOrder(newOrder)
                }
            },

            moveModuleDown: (module) => {
                const { moduleOrder, setModuleOrder } = get()
                const index = moduleOrder.indexOf(module)
                if (index < moduleOrder.length - 1) {
                    const newOrder = [...moduleOrder]
                        ;[newOrder[index + 1], newOrder[index]] = [
                            newOrder[index],
                            newOrder[index + 1],
                        ]
                    setModuleOrder(newOrder)
                }
            },
        }),
        {
            name: STORAGE_KEYS.WIDGETS,
            storage: createJSONStorage(() => localStorage),

            // Only persist layout & order — NOT defaultWidgets
            partialize: (state) => ({
                widgets: state.widgets.map((w) => ({
                    id: w.id,
                    module: w.module,
                    visible: w.visible,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                })),
                moduleOrder: state.moduleOrder,
            }),
        }
    )
)

// Helper: Merge defaults with saved widgets
function mergeWithDefaults(defaults: Widget[], saved: Widget[]): Widget[] {
    return defaults.map((dw) => {
        const savedWidget = saved.find((s) => s.id === dw.id)
        return savedWidget
            ? {
                ...dw,
                x: savedWidget.x ?? dw.x ?? 0,
                y: savedWidget.y ?? dw.y ?? 0,
                w: savedWidget.w ?? dw.w,
                h: savedWidget.h ?? dw.h,
                visible: savedWidget.visible ?? dw.visible,
            }
            : dw
    })
}
