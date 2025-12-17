'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { BrandMemory } from '@/core/domain/brand-memory'
import { Product } from '@/core/domain/catalog/product'

/* ================================
 * Store Interface
 * ================================ */
interface PostSettingStore {
  brand: BrandMemory
  products: Product[]
  isLoading: boolean
  error?: string

  loadProducts: () => Promise<void>
  setBrand: (brand: BrandMemory) => void
  toggleProduct: (productId: string) => void
  reset: () => void
}

/* ================================
 * Initial Brand (pure domain)
 * ================================ */
const initialBrand: BrandMemory = {
  brandDescription: 'Mô tả thương hiệu của bạn',
  niche: 'Thị trường ngách của bạn',
  contentStyle: 'professional',
  language: 'vietnamese',
  brandVoice: {
    tone: 'Giọng văn thương hiệu',
    writingPatterns: [
      'Kể chuyện người thật',
      'Ưu tiên thông tin chính xác',
      'Tránh quảng cáo thổi phồng',
    ],
  },
  ctaLibrary: [
    'Nhắn tin nhận giá tươi hôm nay',
    'Đặt hàng nhanh 60s',
    'Gọi ngay để được tư vấn',
  ],
  keyPoints: [
    'Đánh bắt trong ngày',
    'Vận chuyển 0-4 độ C',
    'Hoàn toàn không ướp đá',
    'Cam kết tươi sống',
  ],
  contentsInstruction: '',
  selectedProductIds: [],
}

/* ================================
 * Store Implementation
 * ================================ */
export const usePostSettingStore = create<PostSettingStore>()(
  persist(
    (set, get) => ({
      brand: initialBrand,
      products: [],
      isLoading: false,
      error: undefined,

      /* ---------- Load Products ---------- */
      loadProducts: async () => {
        try {
          set({ isLoading: true, error: undefined })

          const res = await fetch('/api/products')
          if (!res.ok) throw new Error('Failed to load products')

          const products: Product[] = await res.json()

          set({
            products,
            isLoading: false,
          })
        } catch (err: any) {
          set({
            error: err.message ?? 'Unknown error',
            isLoading: false,
          })
        }
      },

      /* ---------- Brand ---------- */
      setBrand: (brand) => set({ brand }),

      /* ---------- Selection (SINGLE SOURCE OF TRUTH) ---------- */
      toggleProduct: (productId: string) => {
        const { brand } = get()
        const selected = new Set(brand.selectedProductIds)

        selected.has(productId)
          ? selected.delete(productId)
          : selected.add(productId)

        set({
          brand: {
            ...brand,
            selectedProductIds: Array.from(selected),
          },
        })
      },

      /* ---------- Reset ---------- */
      reset: () =>
        set({
          brand: initialBrand,
          products: [],
          isLoading: false,
          error: undefined,
        }),
    }),
    {
      name: 'post-setting',
      storage: createJSONStorage(() => localStorage),

      /* 💾 Persist ONLY business memory */
      partialize: (state) => ({
        brand: state.brand,
      }),
    }
  )
)
