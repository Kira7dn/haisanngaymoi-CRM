import type { Post } from "@/core/domain/post"
import type { PostService } from "@/core/application/interfaces/post-service"
import clientPromise from "@/infrastructure/db/mongo"
import { ObjectId } from "mongodb"

/**
 * MongoDB document interface for Post collection
 */
interface PostDocument {
  _id: ObjectId;
  title: string;
  body?: string | null;
}

export const postRepository: PostService & {
  create(post: Omit<Post, "id">): Promise<Post>
  update(id: string, post: Partial<Post>): Promise<boolean>
  delete(id: string): Promise<boolean>
} = {
  async getAll(): Promise<Post[]> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const docs = await db
      .collection<PostDocument>("posts")
      .find({})
      .sort({ _id: -1 })
      .toArray()
    return docs.map((d) => ({
      id: String(d._id),
      title: d.title || "Untitled",
      body: d.body ?? undefined,
    }))
  },

  async create(post: Omit<Post, "id">): Promise<Post> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const doc: Omit<PostDocument, "_id"> = {
      title: post.title,
      body: post.body ?? null,
    }
    const { insertedId } = await db.collection<PostDocument>("posts").insertOne(doc as PostDocument)
    return { id: String(insertedId), title: post.title, body: post.body }
  },

  async update(id: string, post: Partial<Post>): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const updateObj: Partial<PostDocument> = {}
    if (post.title !== undefined) updateObj.title = post.title
    if (post.body !== undefined) updateObj.body = post.body

    const res = await db
      .collection<PostDocument>("posts")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateObj })
    return res.modifiedCount > 0
  },

  async delete(id: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const res = await db
      .collection<PostDocument>("posts")
      .deleteOne({ _id: new ObjectId(id) })
    return res.deletedCount > 0
  },
}
