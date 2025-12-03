/**
 * Brand Memory Dependencies Factory
 * Creates use case instances with injected dependencies
 */

import { BrandMemoryRepository } from "@/infrastructure/repositories/brand-memory-repo"
import { GetBrandMemoryUseCase } from "@/core/application/usecases/marketing/brand-memory/get-brand-memory"
import { SaveBrandMemoryUseCase } from "@/core/application/usecases/marketing/brand-memory/save-brand-memory"
import type { BrandMemoryService } from "@/core/application/interfaces/brand-memory-service"

/**
 * Create brand memory repository instance
 */
const createBrandMemoryRepository = async (): Promise<BrandMemoryService> => {
  return new BrandMemoryRepository()
}

/**
 * Create GetBrandMemoryUseCase instance
 */
export const createGetBrandMemoryUseCase = async () => {
  const service = await createBrandMemoryRepository()
  return new GetBrandMemoryUseCase(service)
}

/**
 * Create SaveBrandMemoryUseCase instance
 */
export const createSaveBrandMemoryUseCase = async () => {
  const service = await createBrandMemoryRepository()
  return new SaveBrandMemoryUseCase(service)
}
