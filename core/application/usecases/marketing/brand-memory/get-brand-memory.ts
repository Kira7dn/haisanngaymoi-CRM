/**
 * Get Brand Memory Use Case
 * Retrieves the current brand memory settings
 */

import type { BrandMemory } from "@/core/domain/brand-memory"
import type { BrandMemoryService } from "@/core/application/interfaces/brand-memory-service"

export interface GetBrandMemoryRequest { }

export interface GetBrandMemoryResponse {
  brandMemory: BrandMemory
}

/**
 * Use case for retrieving brand memory
 */
export class GetBrandMemoryUseCase {
  constructor(private brandMemoryService: BrandMemoryService) { }

  async execute(_request: GetBrandMemoryRequest): Promise<GetBrandMemoryResponse> {
    const brandMemory = await this.brandMemoryService.get()

    if (!brandMemory) {
      throw new Error('Brand memory not found')
    }

    return {
      brandMemory
    }
  }
}
