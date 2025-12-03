/**
 * Brand Memory Repository
 * MongoDB implementation of BrandMemoryService
 */

import { BaseRepository } from "@/infrastructure/db/base-repository"
import type { BrandMemory } from "@/core/domain/brand-memory"
import { DEFAULT_BRAND_MEMORY } from "@/core/domain/brand-memory"
import type { BrandMemoryService, BrandMemoryPayload } from "@/core/application/interfaces/brand-memory-service"

/**
 * Brand Memory Repository
 * Uses singleton pattern - only one brand memory per organization
 */
export class BrandMemoryRepository extends BaseRepository<BrandMemory, string> implements BrandMemoryService {
  protected collectionName = "brand_memory"
  private readonly SINGLETON_ID = "default" // Use string directly, not ObjectId

  /**
   * Get the current brand memory
   * Returns default if not found
   */
  async get(): Promise<BrandMemory> {
    const collection = await this.getCollection()
    const doc = await collection.findOne({ _id: this.SINGLETON_ID } as any)

    if (!doc) {
      // Return default brand memory if not found
      return { ...DEFAULT_BRAND_MEMORY, id: this.SINGLETON_ID }
    }

    return this.toDomain(doc)
  }

  /**
   * Create or update brand memory (upsert)
   */
  async upsert(payload: BrandMemoryPayload): Promise<BrandMemory> {
    const collection = await this.getCollection()

    const now = new Date()
    const updateData = {
      ...payload,
      updatedAt: now
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const result = await collection.findOneAndUpdate(
      { _id: this.SINGLETON_ID } as any,
      {
        $set: updateData,
        $setOnInsert: {
          _id: this.SINGLETON_ID,
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    if (!result) {
      throw new Error("Failed to upsert brand memory")
    }

    return this.toDomain(result)
  }

  /**
   * Delete brand memory
   */
  async delete(): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ _id: this.SINGLETON_ID } as any)
    return result.deletedCount > 0
  }

  /**
   * Override convertId to use string ID
   */
  protected convertId(value: any): string {
    return String(value)
  }
}
