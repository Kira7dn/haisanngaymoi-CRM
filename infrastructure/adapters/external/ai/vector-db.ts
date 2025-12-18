/**
 * Vector Database Service using Qdrant
 * Provides vector storage and similarity search for content embeddings
 */

import { QdrantClient } from "@qdrant/js-client-rest"

/**
 * Content Type for vector embeddings
 * Distinguishes between different types of content
 */
export type EmbeddingCategory =
  | "published_post"
  | "knowledge_resource"
  | "draft_content"

/**
 * Content Embedding stored in vector DB
 */
export interface ContentEmbedding {
  id: string
  content: string
  embedding: number[]
  metadata: {
    embeddingCategory: EmbeddingCategory
    postId?: string
    productId?: number                // ✅ NEW
    resourceId?: string
    title?: string
    chunkIndex?: number
  }
  createdAt: Date
}

/**
 * Similarity search result
 */
export interface SimilarityResult {
  id: string
  content: string
  score: number
  metadata: {
    embeddingCategory: EmbeddingCategory
    postId?: string
    productId?: number                // ✅ NEW
    title?: string
    resourceId?: string
    chunkIndex?: number
  }
}

/**
 * Vector Database Service
 */
export class VectorDBService {
  private client: QdrantClient
  private initialized = false
  private readonly collectionName = "content_embeddings"
  private readonly vectorSize = 1536 // OpenAI text-embedding-3-small dimension

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
    })
  }

  /**
   * Initialize collection (create if not exists)
   */
  async bootstrap(): Promise<void> {
    if (this.initialized) return

    const collections = await this.client.getCollections()
    const exists = collections.collections.some(
      c => c.name === this.collectionName
    )

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: { size: this.vectorSize, distance: "Cosine" },
      })

      await Promise.all([
        this.index("embeddingCategory", "keyword"),
        this.index("postId", "keyword"),
        this.index("resourceId", "keyword"),
        this.index("productId", "integer"),
      ])
    }

    this.initialized = true
  }

  private index(field: string, type: "keyword" | "integer") {
    return this.client.createPayloadIndex(this.collectionName, {
      field_name: field,
      field_schema: { type },
    })
  }

  /**
   * Store content embedding
   */
  async storeEmbedding(data: ContentEmbedding): Promise<void> {
    await this.bootstrap()

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [{
        id: crypto.randomUUID(),
        vector: data.embedding,
        payload: {
          embeddingId: data.id,
          embeddingCategory: data.metadata.embeddingCategory,
          content: data.content,

          postId: data.metadata.postId,
          productId: data.metadata.productId,
          resourceId: data.metadata.resourceId,
          title: data.metadata.title,
          chunkIndex: data.metadata.chunkIndex,

          createdAt: data.createdAt.toISOString(),
        }
      }]
    })
  }

  /**
   * Search for similar content
   * Returns content with similarity score > threshold
   */
  async searchSimilar(
    vector: number[],
    options: {
      limit?: number
      scoreThreshold?: number
      filter?: {
        embeddingCategory?: EmbeddingCategory | EmbeddingCategory[]
        postId?: string
        productId?: number
        resourceId?: string
      }
    } = {}
  ): Promise<SimilarityResult[]> {
    await this.bootstrap()

    const must: any[] = []

    Object.entries(options.filter ?? {}).forEach(([key, value]) => {
      if (value !== undefined) {
        must.push({ key, match: { value } })
      }
    })

    const res = await this.client.search(this.collectionName, {
      vector,
      limit: options.limit ?? 5,
      score_threshold: options.scoreThreshold ?? 0.7,
      filter: must.length ? { must } : undefined,
      with_payload: true,
    })

    return res.map(r => ({
      id: String(r.id),
      content: r.payload!.content as string,
      score: r.score,
      metadata: {
        embeddingCategory: r.payload!.embeddingCategory as EmbeddingCategory,
        postId: r.payload!.postId as string | undefined,
        productId: r.payload!.productId as number | undefined,
        resourceId: r.payload!.resourceId as string | undefined,
        title: r.payload!.title as string | undefined,
        chunkIndex: r.payload!.chunkIndex as number | undefined,
      },
    }))
  }


  /**
 * Delete embedding by its resourceId (stored in Qdrant payload)
 */
  /**
 * Delete all embeddings by resourceId
 * (resourceId is stored as flat payload field)
 */
  async deleteByResourceId(resourceId: string): Promise<void> {
    if (!resourceId) {
      throw new Error("deleteByResourceId requires a non-empty resourceId")
    }

    await this.bootstrap()

    const filter = {
      must: [
        {
          key: "resourceId",
          match: { value: resourceId },
        },
      ],
    }

    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter,
      })
    } catch (error) {
      throw new Error(
        `Failed to delete embeddings by resourceId=${resourceId}: ${error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }



  /**
   * Delete all embeddings for a post
   */
  /**
 * Delete all embeddings belonging to a post
 */
  async deleteByPostId(postId: string): Promise<void> {
    if (!postId) {
      throw new Error("deleteByPostId requires a non-empty postId")
    }

    await this.bootstrap()

    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: "postId",
              match: { value: postId },
            },
          ],
        },
      })
    } catch (error) {
      throw new Error(
        `Failed to delete embeddings by postId=${postId}: ${error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

}



