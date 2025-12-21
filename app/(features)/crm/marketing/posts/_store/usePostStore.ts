"use client"

import { create } from "zustand"
import { toast } from "@shared/hooks/use-toast"
import type { Post } from "@/core/domain/marketing/post"
import type { PostPayload } from "@/core/application/interfaces/marketing/post-repo"

export interface PostScheduleItem {
  title: string
  idea: string
  scheduledDate: string
  platform: string
}

interface PostStore {
  // ===== State =====
  posts: Post[]
  filter: string

  previewPosts: PostScheduleItem[]

  isGeneratingSchedule: boolean
  isLoading: boolean
  hasLoaded: boolean
  serverProcessTime: number | null

  // Month-based loading state
  loadedMonths: Set<string> // Format: "YYYY-MM"
  currentViewedMonth: string | null

  // ===== Actions =====
  setPosts: (posts: Post[]) => void
  setFilter: (filter: string) => void

  setPreviewPosts: (posts: PostScheduleItem[]) => void
  clearPreviewPosts: () => void

  setIsGeneratingSchedule: (value: boolean) => void

  // Data fetching
  loadPosts: (force?: boolean) => Promise<void>
  loadPostsByMonth: (year: number, month: number) => Promise<void>
  findPostById: (id: string) => Promise<Post | undefined>

  // CRUD operations with toaster
  createPost: (payload: PostPayload) => Promise<{ success: boolean; postId: string }>
  updatePost: (postId: string, payload: PostPayload) => Promise<{ success: boolean }>
  deletePost: (postId: string) => Promise<void>

  // Planner operations
  generateSchedule: (brandMemory: any, selectedProducts: any[]) => Promise<PostScheduleItem[]>
  savePlannerPosts: () => Promise<{ success: boolean; savedCount?: number }>
  undoSchedule: () => { success: boolean; discardedCount: number }
}

export const usePostStore = create<PostStore>((set, get) => ({
  // ===== Initial State =====
  posts: [],
  filter: "",

  previewPosts: [],

  isGeneratingSchedule: false,
  isLoading: false,
  hasLoaded: false,
  serverProcessTime: null,

  // Month-based loading state
  loadedMonths: new Set<string>(),
  currentViewedMonth: null,

  // ===== Simple setters =====
  setPosts: (posts) => set({ posts }),

  setFilter: (filter) => set({ filter }),

  setPreviewPosts: (posts) => set({ previewPosts: posts }),

  clearPreviewPosts: () => set({ previewPosts: [] }),

  setIsGeneratingSchedule: (value) =>
    set({ isGeneratingSchedule: value }),

  // ===== Async actions =====
  loadPosts: async (force = false) => {
    const { isLoading, posts } = get()

    // 👉 chống gọi API trùng
    if (!force && (isLoading || posts.length > 0)) {
      return
    }

    // Load current month and adjacent months
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11

    set({ isLoading: true })

    try {
      // Load current month, previous month, and next month
      await Promise.all([
        get().loadPostsByMonth(currentYear, currentMonth),
        get().loadPostsByMonth(
          currentMonth === 0 ? currentYear - 1 : currentYear,
          currentMonth === 0 ? 11 : currentMonth - 1
        ),
        get().loadPostsByMonth(
          currentMonth === 11 ? currentYear + 1 : currentYear,
          currentMonth === 11 ? 0 : currentMonth + 1
        ),
      ])

      set({ hasLoaded: true, isLoading: false })
    } catch (error) {
      console.error("[PostStore] Failed to load posts:", error)
      set({ isLoading: false, hasLoaded: true })
    }
  },

  loadPostsByMonth: async (year: number, month: number) => {
    const { isLoading, loadedMonths, posts } = get()
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}` // Format: "YYYY-MM"

    // Skip if already loaded or currently loading
    if (loadedMonths.has(monthKey)) {
      console.log(`[PostStore] Month ${monthKey} already loaded, skipping`)
      return
    }

    console.log(`[PostStore] Loading posts for ${monthKey}...`)

    try {
      const { getPostsAction } = await import("../_actions/get-post-action")

      // Calculate date range for the month
      const startDate = new Date(year, month, 1, 0, 0, 0, 0)
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

      const response = await getPostsAction({
        dateRange: {
          startDate,
          endDate
        }
      })

      console.log(`[PostStore] Loaded ${response.posts.length} posts for ${monthKey}`)

      // Merge new posts with existing posts (avoid duplicates)
      const existingIds = new Set(posts.map(p => p.id))
      const newPosts = response.posts.filter(p => !existingIds.has(p.id))

      set({
        posts: [...posts, ...newPosts],
        loadedMonths: new Set([...loadedMonths, monthKey]),
        serverProcessTime: response.serverProcessTime,
      })
    } catch (error) {
      console.error(`[PostStore] Failed to load posts for ${monthKey}:`, error)
    }
  },

  findPostById: async (id: string) => {
    const { posts, loadPosts } = get()

    // 1️⃣ thử tìm trong cache
    const cached = posts.find((p) => p.id === id)
    if (cached) return cached

    // 2️⃣ nếu chưa có → load
    await loadPosts()

    // 3️⃣ tìm lại sau load
    return get().posts.find((p) => p.id === id)
  },

  // ===== CRUD Operations =====
  createPost: async (payload: PostPayload) => {
    try {
      const { createPostAction } = await import("../_actions/create-post-action")

      const result = await createPostAction({ payload })

      // Reload posts to get the new post
      await get().loadPosts(true)

      toast({
        title: "Post created successfully",
        description: `Post "${payload.title}" has been created`,
      })

      return result
    } catch (error) {
      console.error("[PostStore] Failed to create post:", error)
      const message = error instanceof Error ? error.message : "Failed to create post"
      toast({
        title: "Create failed",
        description: message,
        variant: "destructive",
      })
      throw error
    }
  },

  updatePost: async (postId: string, payload: PostPayload) => {
    try {
      const { updatePostAction } = await import("../_actions/update-post-action")

      const result = await updatePostAction({ postId, payload })

      // Reload posts to get updated data
      await get().loadPosts(true)

      toast({
        title: "Post updated successfully",
        description: `Changes to "${payload.title}" have been saved`,
      })

      return result
    } catch (error) {
      console.error("[PostStore] Failed to update post:", error)
      const message = error instanceof Error ? error.message : "Failed to update post"
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      })
      throw error
    }
  },

  deletePost: async (postId: string) => {
    try {
      const { deletePostAction } = await import("../_actions/delete-post-action")

      await deletePostAction(postId)

      // Remove from local state
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
      }))

      toast({
        title: "Post deleted successfully",
      })
    } catch (error) {
      console.error("[PostStore] Failed to delete post:", error)
      const message = error instanceof Error ? error.message : "Failed to delete post"
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      })
      throw error
    }
  },

  // ===== Planner Operations =====
  generateSchedule: async (brandMemory: any, selectedProducts: any[]) => {
    set({ isGeneratingSchedule: true })

    try {
      // Validate brand memory
      if (!brandMemory.brandDescription || brandMemory.brandDescription === 'Mô tả thương hiệu của bạn') {
        throw new Error('Please configure brand settings first')
      }

      const { generatePlanAction } = await import("../_actions/generate-plan-action")

      const result = await generatePlanAction({
        brandMemory,
        selectedProducts,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate schedule')
      }

      set({ previewPosts: result.schedule })
      toast({
        title: `Generated ${result.schedule.length} post ideas`,
      })

      return result.schedule
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate'
      toast({
        title: message,
        variant: "destructive",
      })
      return []
    } finally {
      set({ isGeneratingSchedule: false })
    }
  },

  savePlannerPosts: async () => {
    const { previewPosts } = get()

    if (previewPosts.length === 0) {
      toast({
        title: 'No schedule to save',
        description: 'Please generate a schedule first.',
        variant: "destructive",
      })
      return { success: false, savedCount: 0 }
    }

    try {
      const { createPlanAction } = await import("../_actions/create-planner-action")

      const result = await createPlanAction(previewPosts)

      if (result.success) {
        set({ previewPosts: [] })
        await get().loadPosts(true)
        toast({
          title: `Saved ${result.savedCount} posts successfully`,
        })
        return { success: true, savedCount: result.savedCount }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save schedule'
      toast({
        title: message,
        variant: "destructive",
      })
      return { success: false, savedCount: 0 }
    }
  },

  undoSchedule: () => {
    const { previewPosts } = get()

    if (previewPosts.length === 0) {
      toast({
        title: 'No schedule to undo',
        description: 'The preview is already empty.',
      })
      return { success: false, discardedCount: 0 }
    }

    const count = previewPosts.length
    set({ previewPosts: [] })
    toast({
      title: `Discarded ${count} preview posts`,
    })
    return { success: true, discardedCount: count }
  },
}))
