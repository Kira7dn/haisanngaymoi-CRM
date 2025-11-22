"use client"

import { useState, ReactNode, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { DraggableWidget } from "./DraggableWidget"
import { ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Button } from "@shared/ui/button"

export type WidgetModule = "finance" | "customer" | "order" | "product" | "risk" | "forecast" | "inventory"

export interface Widget {
  id: string
  title: string | ReactNode
  component: ReactNode
  visible: boolean
  module: WidgetModule
  gridArea?: string
  colSpan?: number  // 1-12 columns
  rowSpan?: number  // 1-N rows
}

interface DraggableDashboardProps {
  widgets: Widget[]
  onLayoutChange?: (widgets: Widget[]) => void
  editMode?: boolean
}

export function DraggableDashboard({
  widgets: initialWidgets,
  onLayoutChange,
  editMode = false,
}: DraggableDashboardProps) {
  const [widgets, setWidgets] = useState(initialWidgets)
  const [moduleOrder, setModuleOrder] = useState<WidgetModule[]>([
    "finance",
    "customer",
    "order",
    "product",
    "risk",
    "forecast",
    "inventory",
  ])

  // Load module order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem("dashboard-module-order")
    if (savedOrder) {
      try {
        setModuleOrder(JSON.parse(savedOrder))
      } catch (error) {
        console.error("Failed to load module order:", error)
      }
    }
  }, [])

  // Save module order to localStorage
  const saveModuleOrder = (newOrder: WidgetModule[]) => {
    setModuleOrder(newOrder)
    localStorage.setItem("dashboard-module-order", JSON.stringify(newOrder))
  }

  // Move module up in the order
  const moveModuleUp = (module: WidgetModule) => {
    const currentIndex = moduleOrder.indexOf(module)
    if (currentIndex > 0) {
      const newOrder = [...moduleOrder]
        ;[newOrder[currentIndex], newOrder[currentIndex - 1]] = [
          newOrder[currentIndex - 1],
          newOrder[currentIndex],
        ]
      saveModuleOrder(newOrder)
    }
  }

  // Move module down in the order
  const moveModuleDown = (module: WidgetModule) => {
    const currentIndex = moduleOrder.indexOf(module)
    if (currentIndex < moduleOrder.length - 1) {
      const newOrder = [...moduleOrder]
        ;[newOrder[currentIndex], newOrder[currentIndex + 1]] = [
          newOrder[currentIndex + 1],
          newOrder[currentIndex],
        ]
      saveModuleOrder(newOrder)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle layout changes through useEffect to avoid state updates during render
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(widgets)
    }
  }, [widgets, onLayoutChange])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const activeWidget = items[oldIndex]
        const overWidget = items[newIndex]

        // Enforce module constraint: only allow reordering within the same module
        if (activeWidget.module !== overWidget.module) {
          console.warn(`Cannot move widget from ${activeWidget.module} to ${overWidget.module} module`)
          return items // Return unchanged
        }

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleWidgetVisibility = (id: string) => {
    setWidgets((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    )
  }

  const visibleWidgets = widgets.filter((w) => w.visible)

  // Group widgets by module
  const moduleNames: Record<WidgetModule, string> = {
    finance: "💰 Tài chính",
    customer: "👥 Khách hàng",
    order: "📦 Đơn hàng",
    product: "🏷️ Sản phẩm",
    risk: "⚠️ Rủi ro",
    forecast: "📈 Dự báo",
    inventory: "📦 Tồn kho"
  }

  const groupedWidgets = widgets.reduce((acc, widget) => {
    if (!acc[widget.module]) {
      acc[widget.module] = []
    }
    acc[widget.module].push(widget)
    return acc
  }, {} as Record<WidgetModule, Widget[]>)

  return (
    <div className={`flex ${editMode ? "gap-4" : ""}`}>
      {/* Vertical Sidebar - Widget List (Edit Mode Only) */}
      {editMode && (
        <div className="w-72 shrink-0">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Danh sách Widget
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Nhấn vào biểu tượng mắt để ẩn/hiện widget.
            </p>
            <div className="space-y-3 pr-1">
              {moduleOrder.map((module) => {
                const moduleWidgets = groupedWidgets[module] || []
                if (moduleWidgets.length === 0) return null

                return (
                  <div key={module} className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-2">
                      {moduleNames[module]}
                    </h4>
                    <div className="space-y-1">
                      {moduleWidgets.map((widget) => (
                        <button
                          key={widget.id}
                          onClick={() => toggleWidgetVisibility(widget.id)}
                          className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors text-left ${widget.visible
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                            : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{widget.visible ? <Eye /> : <EyeOff />}</span>
                            <span className="flex-1 truncate">{widget.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Area */}
      <div className="flex-1 min-w-0">
        {editMode && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              💡 Kéo thả các widget trong từng khu vực module tương ứng
            </p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6 pr-2">
            {moduleOrder.map((module) => {
              const moduleWidgets = groupedWidgets[module]?.filter((w) => w.visible) || []
              if (moduleWidgets.length === 0) return null

              const moduleIndex = moduleOrder.indexOf(module)
              const isFirst = moduleIndex === 0
              const isLast = moduleIndex === moduleOrder.length - 1

              return (
                <div key={module} className="space-y-3">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {moduleNames[module]}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({moduleWidgets.length} widget{moduleWidgets.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    {editMode && <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveModuleUp(module)}
                        disabled={isFirst}
                        className="h-7 w-7 p-0"
                        title="Di chuyển lên"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveModuleDown(module)}
                        disabled={isLast}
                        className="h-7 w-7 p-0"
                        title="Di chuyển xuống"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>}
                  </div>
                  <SortableContext
                    items={moduleWidgets.map((w) => w.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"
                      style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
                    >
                      {moduleWidgets.map((widget) => (
                        <DraggableWidget
                          key={widget.id}
                          id={widget.id}
                          title={widget.title}
                          disabled={!editMode}
                          module={widget.module}
                          colSpan={widget.colSpan || 3}
                          rowSpan={widget.rowSpan || 1}
                        >
                          {widget.component}
                        </DraggableWidget>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>
        </DndContext>
      </div>
    </div>
  )
}
