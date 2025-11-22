"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@shared/ui/button"
import { Settings, Save, X } from "lucide-react"
import { GridStackDashboard, Widget } from "./GridStackDashboard"
import { useDashboardWidgets } from "./hooks/useDashboardWidgets"

interface CustomizableDashboardClientProps {
  widgets: Widget[]
}

export function CustomizableDashboardClient({ widgets: initialWidgets }: CustomizableDashboardClientProps) {
  const [editMode, setEditMode] = useState(false)
  const { widgets, saveWidgets, resetWidgets } = useDashboardWidgets(initialWidgets)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Khi kéo/thay đổi layout → chỉ cập nhật state hook, nhưng chưa gọi save
  const handleLayoutChange = useCallback((newWidgets: Widget[]) => {
    if (editMode) {
      // Chỉ cập nhật state hook tạm
      saveWidgets(newWidgets) // Lưu trực tiếp vào hook state nhưng chưa ghi localStorage
    }
  }, [editMode, saveWidgets])

  // Khi nhấn Save → lưu thật sự
  const handleSaveLayout = () => {
    saveWidgets(widgets) // ghi vào localStorage
    setEditMode(false)
  }

  // Khi nhấn Cancel → khôi phục layout đã lưu trước đó
  const handleCancelEdit = () => {
    resetWidgets()
    setEditMode(false)
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {editMode ? "Đang chỉnh sửa layout" : "Tùy chỉnh dashboard của bạn"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" /> Hủy
              </Button>
              <Button size="sm" onClick={handleSaveLayout}>
                <Save className="w-4 h-4 mr-2" /> Lưu
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Settings className="w-4 h-4 mr-2" /> Tùy chỉnh
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard */}
      <GridStackDashboard
        widgets={widgets}
        onLayoutChange={handleLayoutChange}
        editMode={editMode}
      />
    </div>
  )
}
