"use client"

import { useState, ReactNode, useEffect, useRef } from "react"
import { GridStack } from "gridstack"
import { ChevronUp, ChevronDown, Eye, EyeOff, ChevronRight } from "lucide-react"
import { Button } from "@shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@shared/ui/sidebar"

export type WidgetModule = "finance" | "customer" | "order" | "product" | "risk" | "forecast" | "inventory"

export interface Widget {
  id: string
  title: string | ReactNode
  component: ReactNode
  visible: boolean
  module: WidgetModule
  x?: number
  y?: number
  w?: number  // width in grid columns (12 column grid)
  h?: number  // height in grid rows
  minW?: number
  minH?: number
}

interface GridStackDashboardProps {
  widgets: Widget[]
  onLayoutChange?: (widgets: Widget[]) => void
  editMode?: boolean
}

export function GridStackDashboard({
  widgets,
  onLayoutChange,
  editMode = false,
}: GridStackDashboardProps) {
  const [moduleOrder, setModuleOrder] = useState<WidgetModule[]>([
    "finance",
    "customer",
    "order",
    "product",
    "risk",
    "forecast",
    "inventory",
  ])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<WidgetModule>>(
    new Set(moduleOrder) // All groups collapsed by default
  )
  const gridRefs = useRef<Map<WidgetModule, GridStack>>(new Map())

  const toggleGroupCollapse = (module: WidgetModule) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(module)) {
        newSet.delete(module)
      } else {
        newSet.add(module)
      }
      return newSet
    })
  }

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

  // Initialize GridStack instances for each module
  useEffect(() => {
    const grids = gridRefs.current

    // Clean up existing grids
    grids.forEach((grid) => {
      grid.destroy(false)
    })
    grids.clear()

    // Initialize new grids for each module
    moduleOrder.forEach((module) => {
      const moduleWidgets = widgets.filter((w) => w.module === module && w.visible)
      if (moduleWidgets.length > 0) {
        const gridEl = document.querySelector(`.grid-stack-${module}`) as HTMLElement
        if (gridEl) {
          const grid = GridStack.init({
            column: 12,
            cellHeight: 80,
            acceptWidgets: false, // Don't allow widgets from other modules
            disableResize: !editMode,
            disableDrag: !editMode,
            float: true,
            removable: false,
          }, gridEl)

          grids.set(module, grid)

          // Listen to change events
          grid.on('change', () => {
            if (!onLayoutChange) return

            const updatedWidgets = grid.save(false) as Array<{ id?: string, x?: number, y?: number, w?: number, h?: number }>

            // Update widget positions and call onLayoutChange directly
            const newWidgets = widgets.map((widget) => {
              if (widget.module !== module) return widget
              const gridItem = updatedWidgets.find((item) => item.id === widget.id)
              if (gridItem) {
                return {
                  ...widget,
                  x: gridItem.x,
                  y: gridItem.y,
                  w: gridItem.w,
                  h: gridItem.h,
                }
              }
              return widget
            })

            onLayoutChange(newWidgets)
          })
        }
      }
    })

    return () => {
      grids.forEach((grid) => {
        grid.destroy(false)
      })
      grids.clear()
    }
  }, [moduleOrder, editMode, widgets, onLayoutChange])

  // Update widget visibility
  useEffect(() => {
    const grids = gridRefs.current
    moduleOrder.forEach((module) => {
      const grid = grids.get(module)
      if (!grid) return

      const moduleWidgets = widgets.filter((w) => w.module === module && w.visible)

      // Remove widgets that are no longer visible
      const existingIds = new Set(moduleWidgets.map((w) => w.id))
      grid.getGridItems().forEach((el) => {
        const id = el.getAttribute('gs-id')
        if (id && !existingIds.has(id)) {
          grid.removeWidget(el)
        }
      })

      // Add new visible widgets
      moduleWidgets.forEach((widget) => {
        const exists = grid.getGridItems().some((el) => el.getAttribute('gs-id') === widget.id)
        if (!exists) {
          const widgetEl = document.querySelector(`[data-widget-id="${widget.id}"]`) as HTMLElement
          if (widgetEl) {
            grid.makeWidget(widgetEl)
          }
        }
      })
    })
  }, [widgets, moduleOrder])

  const toggleWidgetVisibility = (id: string) => {
    if (!onLayoutChange) return

    const newWidgets = widgets.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    )
    onLayoutChange(newWidgets)
  }

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
        <SidebarProvider className="w-54 shrink-0 border-r border-gray-200 dark:border-gray-800">
          <Sidebar side="left" collapsible="none">
            <SidebarContent>
              <div className="py-2 border-b border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Nhấn để ẩn/hiện widget
                </p>
              </div>

              {moduleOrder.map((module) => {
                const moduleWidgets = groupedWidgets[module] || []
                if (moduleWidgets.length === 0) return null
                const isCollapsed = collapsedGroups.has(module)

                return (
                  <SidebarGroup key={module} className="pl-0 py-1">
                    <SidebarGroupLabel asChild>
                      <button
                        onClick={() => toggleGroupCollapse(module)}
                        className="w-full flex items-center justify-between pl-0"
                      >
                        <span className="text-sm font-semibold">{moduleNames[module]}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-90"
                            }`}
                        />
                      </button>
                    </SidebarGroupLabel>
                    {!isCollapsed && (
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {moduleWidgets.map((widget) => (
                            <SidebarMenuItem key={widget.id}>
                              <SidebarMenuButton
                                onClick={() => toggleWidgetVisibility(widget.id)}
                                className={`w-full transition-colors ${widget.visible}`}
                              >
                                <span className="flex-1 truncate text-xs">{widget.title}</span>
                                <span className="shrink-0">
                                  {widget.visible ? (
                                    <Eye className="w-3 h-3" />
                                  ) : (
                                    <EyeOff className="w-3 h-3" />
                                  )}
                                </span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </SidebarGroup>
                )
              })}
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      )}

      {/* Main Dashboard Area */}
      <div className="flex-1 min-w-0">
        {editMode && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              💡 Kéo thả và thay đổi kích thước các widget trong từng khu vực module tương ứng
            </p>
          </div>
        )}

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

                {/* GridStack Container */}
                <div
                  className={`grid-stack grid-stack-${module}`}
                >
                  {moduleWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="grid-stack-item"
                      data-widget-id={widget.id}
                      gs-id={widget.id}
                      gs-x={widget.x ?? 0}
                      gs-y={widget.y ?? 0}
                      gs-w={widget.w ?? 3}
                      gs-h={widget.h ?? 3}
                      gs-min-w={widget.minW ?? 2}
                      gs-min-h={widget.minH ?? 2}
                      style={{
                        // @ts-ignore
                        "--gs-item-margin-top": "4px",
                        "--gs-item-margin-bottom": "4px",
                        "--gs-item-margin-left": "4px",
                        "--gs-item-margin-right": "4px",
                      }}
                    >
                      <Card className="grid-stack-item-content p-2 py-4 gap-2 hover:shadow-lg 
                      transition-all hover:-translate-y-0.5">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            {widget.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 overflow-y-scroll scrollbar-hidden">
                          {widget.component}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
