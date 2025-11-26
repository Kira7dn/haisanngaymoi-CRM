# [ ] 📦 Customer Messaging Module — Clean Architecture Specification

## 🎯 Mục tiêu

Xây dựng module **Customer/Message** cho CRM nhằm:

### ✔️ Tập trung toàn bộ hội thoại đa nền tảng:

| Nền tảng              | API          | Loại tin nhắn       |
| --------------------- | ------------ | ------------------- |
| Facebook Messenger    | Graph API    | Text, Image, File   |
| Zalo Official Account | OA API       | Text, Image, Button |
| TikTok Messages       | Business API | Text, Order Inquiry |

---

### ✔️ Giao diện quản lý hội thoại tại `/crm/customers/message`

* Danh sách khách hàng có hội thoại
* Chat box real-time
* Lịch sử tương tác đa nền tảng (merged by Customer)
* Tag, phân loại, assign cho nhân viên

---


## 🏗️ 1. Domain Model (Final Corrected)

### 🧬 `Customer` (đã có, mở rộng thêm platformAccounts)

```ts
type Platform = "facebook" | "zalo" | "tiktok" | "website";

export interface PlatformAccount {
  platform: Platform;
  platformUserId: string; // sender_id, zaloUserId, tiktok_open_id
  avatarUrl?: string;
  displayName?: string;
}

export interface Customer {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  platformAccounts: PlatformAccount[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 🧵 `Conversation` — phiên chat theo customer + platform

```ts
export interface Conversation {
  id: string;
  customerId: number;
  platform: Platform;
  status: "open" | "pending" | "closed";
  assignedTo?: number; // UserId
  lastMessageAt: Date;
  createdAt: Date;
}
```

---

### 💬 `Message` — tin nhắn

```ts
export interface Message {
  id: string;
  conversationId: string;
  sender: "customer" | "agent" | "system";
  platformMessageId?: string;
  content: string;
  attachments?: Attachment[];
  sentAt: Date;
  isRead?: boolean;
}
```

---

## ⚙️ 2. Application Layer

| UseCase                             | Mục đích                               |
| ----------------------------------- | -------------------------------------- |
| `ReceiveMessageUseCase`             | Nhận tin nhắn inbound từ APIs/webhooks |
| `SendMessageUseCase`                | Agent gửi tin từ CRM → nền tảng gốc    |
| `SyncMessagesUseCase`               | Đồng bộ lịch sử khi reconnect          |
| `GetConversationsByCustomerUseCase` | Hiển thị lịch sử chat                  |
| `AssignConversationUseCase`         | Phân công nhân viên                    |

---

## 🔌 3. Infrastructure Layer

### 📍 Webhook Routes

```
/app/api/webhooks/facebook/route.ts
/app/api/webhooks/zalo/route.ts
/app/api/webhooks/tiktok/route.ts
```

Nhiệm vụ:
✔ Nhận payload từ platform
✔ Convert → `Message` Domain
✔ Gọi `ReceiveMessageUseCase`

---

### ☁️ MessagingGateways (Dynamic)

```ts
export interface MessagingGateway {
  sendMessage(platformUserId: string, content: string): Promise<void>;
  fetchHistory?(platformUserId: string): Promise<Message[]>;
}
```

---

### 🏭 Factory Pattern (Select Correct Gateway)

```ts
export class MessagingGatewayFactory {
  static create(platform: Platform): MessagingGateway {
    switch (platform) {
      case "facebook": return new FacebookGateway();
      case "zalo":     return new ZaloGateway();
      case "tiktok":   return new TikTokGateway();
      default: throw new Error(`Unsupported platform ${platform}`);
    }
  }
}
```

---

## 🚀 4. SendMessageUseCase (Prepared for Implementation)

```ts
export class SendMessageUseCase {
  constructor(private messageRepo: MessageRepository) {}

  async execute(input: {
    conversationId: string;
    content: string;
    platform: Platform;
    platformUserId: string;
  }) {
    const gateway = MessagingGatewayFactory.create(input.platform);
    await gateway.sendMessage(input.platformUserId, input.content);

    await this.messageRepo.save({
      conversationId: input.conversationId,
      sender: "agent",
      content: input.content,
      sentAt: new Date(),
    });
  }
}
```

---

## 🎨 5. UI Integration (Next.js)

📍 Route: `/crm/customers/message`

```tsx
<Layout>
  <ConversationSidebar />   // list conversations
  <MessageThread />         // history & chat window
  <MessageInput />          // send message
  <CustomerProfilePanel />  // customer CRM data
</Layout>
```

---

# 📄 `MessageRepository`

📍 File: `infrastructure/repositories/message-repo.ts`

```ts
import { BaseRepository } from "./base-repo";
import type { Collection, Document, ObjectId } from "mongodb";
import type { Message } from "@/core/domain/message";

export class MessageRepository extends BaseRepository<Message, string> {
  protected collectionName = "messages";

  protected convertId(id: string): ObjectId | string {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }

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

  protected toDocument(entity: Partial<Message>): Document {
    return {
      conversationId: entity.conversationId,
      sender: entity.sender,
      content: entity.content,
      platformMessageId: entity.platformMessageId,
      attachments: entity.attachments,
      sentAt: entity.sentAt,
      isRead: entity.isRead,
    };
  }

  async getByConversationId(conversationId: string): Promise<Message[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({ conversationId })
      .sort({ sentAt: 1 })
      .toArray();
    return docs.map((doc) => this.toDomain(doc));
  }

  async markAsRead(messageId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: this.convertId(messageId) },
      { $set: { isRead: true } }
    );
  }
}
```

---

# 🗂️ `ConversationRepository`

📍 File: `infrastructure/repositories/conversation-repo.ts`

```ts
import { BaseRepository } from "./base-repo";
import type { Document, ObjectId } from "mongodb";
import type { Conversation } from "@/core/domain/conversation";

export class ConversationRepository extends BaseRepository<Conversation, string> {
  protected collectionName = "conversations";

  protected convertId(id: string): ObjectId | string {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }

  protected toDomain(doc: Document): Conversation {
    return {
      id: doc._id.toString(),
      customerId: doc.customerId,
      platform: doc.platform,
      status: doc.status,
      assignedTo: doc.assignedTo,
      lastMessageAt: doc.lastMessageAt,
      createdAt: doc.createdAt,
    };
  }

  protected toDocument(entity: Partial<Conversation>): Document {
    return {
      customerId: entity.customerId,
      platform: entity.platform,
      status: entity.status ?? "open",
      assignedTo: entity.assignedTo,
      lastMessageAt: entity.lastMessageAt,
      createdAt: entity.createdAt ?? new Date(),
    };
  }

  async findActiveByCustomer(customerId: number): Promise<Conversation[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({ customerId, status: { $ne: "closed" } })
      .sort({ lastMessageAt: -1 })
      .toArray();
    return docs.map((doc) => this.toDomain(doc));
  }

  async assignToAgent(conversationId: string, agentId: number): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: this.convertId(conversationId) },
      { $set: { assignedTo: agentId } }
    );
  }

  async updateLastMessageTime(conversationId: string, time: Date): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: this.convertId(conversationId) },
      { $set: { lastMessageAt: time } }
    );
  }
}
```

---

## 🎯 Next Step Gợi ý:

Bạn nên tiếp tục với:

### 🔹 Bước tiếp theo hợp lý:

1️⃣ `ReceiveMessageUseCase` – nhận tin từ webhook, lưu vào repo
2️⃣ `depends.ts` – inject MessageRepository & ConversationRepository
3️⃣ Thiết kế `Webhook → UseCase → Repository` flow
4️⃣ UI load conversation & message history

---