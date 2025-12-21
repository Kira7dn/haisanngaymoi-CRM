import { usePostStore } from '../_store/usePostStore'
import { usePostSettingStore } from '../_store/usePostSettingStore'

/**
 * Hook wrapper cho planner operations từ store
 * Kết hợp brand/product settings và delegate logic vào store
 */
export function useGenerateSchedule() {
  const {
    previewPosts,
    generateSchedule: generateScheduleStore,
    savePlannerPosts,
    undoSchedule,
  } = usePostStore()
  const { brand, products } = usePostSettingStore()

  const generateSchedule = async () => {
    // Get selected products from settings store
    const selectedProducts = products.filter((p) =>
      brand.selectedProductIds?.includes(p.id)
    )

    // Delegate to store
    return generateScheduleStore(brand, selectedProducts)
  }

  const saveSchedule = async () => {
    return savePlannerPosts()
  }

  return {
    generateSchedule,
    saveSchedule,
    undoSchedule,
    hasPreview: previewPosts.length > 0,
    previewCount: previewPosts.length,
  }
}
