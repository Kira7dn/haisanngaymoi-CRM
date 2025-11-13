import type { User } from "@/core/domain/user";
import type { UserService, UpsertUserPayload } from "@/core/application/interfaces/user-service";
import clientPromise from "@/infrastructure/db/mongo";

/**
 * MongoDB document interface for User collection
 */
interface UserDocument {
  _id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export const userRepository: UserService = {
  async upsert(payload: UpsertUserPayload): Promise<User> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const now = new Date();
    const update: Partial<UserDocument> = {
      name: payload.name ?? "",
      avatar: payload.avatar ?? "",
      phone: payload.phone ?? "",
      email: payload.email ?? "",
      address: payload.address ?? "",
      updatedAt: now,
    };
    const doc = await db.collection<UserDocument>("users").findOneAndUpdate(
      { _id: payload.id },
      { $set: update, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "after" }
    );
    if (!doc) throw new Error("Failed to upsert user");
    return {
      id: doc._id,
      name: doc.name,
      avatar: doc.avatar,
      phone: doc.phone,
      email: doc.email,
      address: doc.address,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  async getById(id: string): Promise<User | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const doc = await db.collection<UserDocument>("users").findOne({ _id: id });
    return doc ? {
      id: doc._id,
      name: doc.name,
      avatar: doc.avatar,
      phone: doc.phone,
      email: doc.email,
      address: doc.address,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } : null;
  },
};
