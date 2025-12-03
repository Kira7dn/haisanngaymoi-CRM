/**
 * Save Brand Memory Use Case
 * Creates or updates brand memory settings
 */

import type { BrandMemory } from "@/core/domain/brand-memory"
import { validateBrandMemory } from "@/core/domain/brand-memory"
import type { BrandMemoryService, BrandMemoryPayload } from "@/core/application/interfaces/brand-memory-service"

export interface SaveBrandMemoryRequest extends BrandMemoryPayload {}

export interface SaveBrandMemoryResponse {
  brandMemory: BrandMemory
}

/**
 * Use case for saving brand memory
 */
export class SaveBrandMemoryUseCase {
  constructor(private brandMemoryService: BrandMemoryService) {}

  async execute(request: SaveBrandMemoryRequest): Promise<SaveBrandMemoryResponse> {
    // Validate brand memory data
    const errors = validateBrandMemory(request)
    if (errors.length > 0) {
      throw new Error(`Brand memory validation failed: ${errors.join(', ')}`)
    }

    // Upsert brand memory
    const brandMemory = await this.brandMemoryService.upsert(request)

    return {
      brandMemory
    }
  }
}
