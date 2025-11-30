import { BaseRepository } from "@/infrastructure/db/base-repository";
import type { Collection, Document } from "mongodb";
import type { Message } from "@/core/domain/messaging/message";
import type {
  MessageService,
  MessagePayload,
} from "@/core/application/interfaces/messaging/message-service";
import { ObjectId as MongoObjectId } from "mongodb";

/**
 * Message Repository
 * Implements MessageService interface for MongoDB persistence
 */
export class MessageRepository
  extends BaseRepository<Message, string>
  implements MessageService {
  protected collectionName = "messages";

  /**
   * Convert MongoDB document to Message domain entity
   */
  protected toDomain(doc: Document): Message {
    return {
      id: doc._id.toString(),
      conversationId: doc.conversationId,
      sender: doc.sender,
      content: doc.content,
      platformMessageId: doc.platformMessageId,
      sentAt: doc.sentAt,
      attachments: doc.attachments || [],
      isRead: doc.isRead ?? false,
    };
  }

  /**
   * Convert Message entity to MongoDB document
   */
  protected toDocument(entity: Partial<Message>): Document {
    const doc: any = {
      conversationId: entity.conversationId,
      sender: entity.sender,
      content: entity.content,
      platformMessageId: entity.platformMessageId,
      attachments: entity.attachments,
      sentAt: entity.sentAt,
      isRead: entity.isRead,
    };

    if (entity.id) {
      doc._id = new MongoObjectId(entity.id);
    }

    return doc;
  }

  async getAll(): Promise<Message[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({}).sort({ sentAt: -1 }).toArray();
    return docs.map((doc) => this.toDomain(doc));
  }

  async getById(id: string): Promise<Message | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ _id: new MongoObjectId(id) });
    return doc ? this.toDomain(doc) : null;
  }

  async create(payload: MessagePayload): Promise<Message> {
    const now = new Date();
    const doc = this.toDocument({
      ...payload,
      sentAt: payload.sentAt || now,
      isRead: payload.isRead ?? false,
    });

    const collection = await this.getCollection();
    const result = await collection.insertOne(doc);

    return this.toDomain({
      ...doc,
      _id: result.insertedId,
    });
  }

  async update(payload: MessagePayload): Promise<Message | null> {
    if (!payload.id) {
      throw new Error("Message ID is required for update");
    }

    const { id, ...updateData } = payload;

    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new MongoObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return result ? this.toDomain(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new MongoObjectId(id) });
    return result.deletedCount > 0;
  }

  async getByConversationId(conversationId: string): Promise<Message[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({ conversationId })
      .sort({ sentAt: 1 })
      .toArray();
    return docs.map((doc) => this.toDomain(doc));
  }

  async getByPlatformMessageId(
    platformMessageId: string
  ): Promise<Message | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ platformMessageId });
    return doc ? this.toDomain(doc) : null;
  }

  async markAsRead(messageId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new MongoObjectId(messageId) },
      { $set: { isRead: true } }
    );
  }
}
