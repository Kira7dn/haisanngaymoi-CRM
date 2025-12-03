/**
 * Brand Memory Service Interface
 * Defines operations for brand memory persistence
 */

import type { BrandMemory } from "@/core/domain/brand-memory"

/**
 * Brand Memory Payload for create/update operations
 */
export interface BrandMemoryPayload extends Partial<BrandMemory> {}

/**
 * Brand Memory Service Interface
 */
export interface BrandMemoryService {
  /**
   * Get the current brand memory (should be singleton per organization)
   */
  get(): Promise<BrandMemory | null>

  /**
   * Create or update brand memory
   */
  upsert(payload: BrandMemoryPayload): Promise<BrandMemory>

  /**
   * Delete brand memory
   */
  delete(): Promise<boolean>
}
