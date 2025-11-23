"use client"

import { ReactNode } from "react"
import { Responsive, WidthProvider, Layout } from "react-grid-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { WidgetModule } from "./CustomizableDashboard"

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface Widget {
  id: string
  title: string | ReactNode
  component: ReactNode
  visible: boolean
  module: WidgetModule
  x?: number
  y?: number
  w?: number
  h?: number
  minW?: number
  minH?: number
}

interface ModuleGridProps {
  module: WidgetModule
  items: Widget[]
  editMode: boolean
  onLayoutChange: (items: Widget[]) => void
}

export function ModuleGrid({ module, items, editMode, onLayoutChange }: ModuleGridProps) {
  // Convert widgets to react-grid-layout format
  const layout: Layout[] = items
    .filter(w => w.visible)
    .map(item => ({
      i: item.id,
      x: item.x ?? 0,
      y: item.y ?? 0,
      w: item.w ?? 3,
      h: item.h ?? 3,
      minW: item.minW ?? 2,
      minH: item.minH ?? 2,
    }))

  // Handle layout change
  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!editMode) return

    const updatedItems = items.map(item => {
      const layoutItem = newLayout.find(l => l.i === item.id)
      if (layoutItem) {
        return {
          ...item,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        }
      }
      return item
    })

    onLayoutChange(updatedItems)
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={80}
      isDraggable={editMode}
      isResizable={editMode}
      onLayoutChange={handleLayoutChange}
      compactType="vertical"
      preventCollision={false}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
    >
      {items
        .filter(w => w.visible)
        .map(widget => (
          <div key={widget.id}>
            <Card className="h-full w-full p-2 py-4 gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto scrollbar-hidden">
                {widget.component}
              </CardContent>
            </Card>
          </div>
        ))}
    </ResponsiveGridLayout>
  )
}
