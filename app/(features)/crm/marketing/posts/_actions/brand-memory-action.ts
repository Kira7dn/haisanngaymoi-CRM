"use server"

import { revalidatePath } from "next/cache"
import { createGetBrandMemoryUseCase, createSaveBrandMemoryUseCase } from "@/app/api/brand-memory/depends"
import type { BrandMemoryPayload } from "@/core/application/interfaces/brand-memory-service"
/**
 * Get brand memory settings
 */
export async function getBrandMemoryAction() {
  try {
    const useCase = await createGetBrandMemoryUseCase()
    const result = await useCase.execute({})
    return { success: true, brandMemory: result.brandMemory }
  } catch (error) {
    console.error("Failed to get brand memory:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Save brand memory settings
 */
export async function saveBrandMemoryAction(payload: BrandMemoryPayload) {
  try {
    const useCase = await createSaveBrandMemoryUseCase()
    const result = await useCase.execute(payload)
    revalidatePath("/crm/campaigns/posts")
    return { success: true, brandMemory: result.brandMemory }
  } catch (error) {
    console.error("Failed to save brand memory:", error)
    return { success: false, error: String(error) }
  }
}