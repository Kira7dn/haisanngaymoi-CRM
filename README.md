# 🧭 NextJS 16 Fullstack Clean Architecture Guide

### 🚀 Mục tiêu

* Xây dựng ứng dụng **Next.js 16** theo mô hình **Clean / Onion Architecture**
* Kết hợp **Server Components + Client Components**
* CRUD dữ liệu với **MongoDB**
* Quản lý **state bằng Zustand**
* Triển khai **Server Actions thay cho API route**
* Viết **unit / integration / UI tests** đầy đủ bằng **Vitest**

---

## 📁 Cấu trúc thư mục tổng thể

```
src/
├─ app/
│  ├─ posts/
│  │   ├─ page.tsx
│  │   ├─ actions.ts
│  │   ├─ components/
│  │   │   ├─ PostList.tsx
│  │   │   ├─ PostFilter.tsx
│  │   │   └─ PostForm.tsx
│  │   ├─ store/usePostStore.ts
│  │   └─ __tests__/
│  │       ├─ actions.spec.ts
│  │       └─ components/
│  │           └─ PostList.spec.tsx
│  └─ layout.tsx
│
├─ core/
│  ├─ domain/
│  │   ├─ post.ts
│  │   └─ __tests__/post.spec.ts
│  ├─ application/
│  │   ├─ usecases/
│  │   │   ├─ get-posts.ts
│  │   │   ├─ create-post.ts
│  │   │   ├─ update-post.ts
│  │   │   ├─ delete-post.ts
│  │   │   └─ __tests__/usecases.spec.ts
│
├─ infrastructure/
│  ├─ db/mongo.ts
│  ├─ repositories/
│  │   ├─ post-repo.ts
│  │   └─ __tests__/post-repo.spec.ts
│
├─ shared/
│  └─ types/
│
└─ vitest.config.ts
```

---

## ⚙️ 1. Cài đặt

```bash
npm install mongodb zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom mongodb-memory-server
```

File `.env.local`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/mydb
MONGODB_DB=mydb
```

---

## ⚙️ 2. Cấu trúc Clean Architecture

| Layer          | Vai trò                         | Ví dụ                                      |
| -------------- | ------------------------------- | ------------------------------------------ |
| Domain         | Định nghĩa entity               | `core/domain/post.ts`                      |
| Application    | Chứa use case (logic nghiệp vụ) | `core/application/usecases/create-post.ts` |
| Infrastructure | Kết nối MongoDB, repo           | `infrastructure/repositories/post-repo.ts` |
| UI (App)       | Giao diện, server actions       | `app/posts/`                               |

---

## 🧱 3. Domain

```ts
// src/core/domain/post.ts
export interface Post {
  id: string
  title: string
  content: string
}
```

---

## ⚙️ 4. MongoDB Connection

```ts
// src/infrastructure/db/mongo.ts
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
const options = {}
let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options)
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise
export default clientPromise
```

---

## ⚙️ 5. Repository Layer

```ts
// src/infrastructure/repositories/post-repo.ts
import clientPromise from "../db/mongo"
import { ObjectId } from "mongodb"
import { Post } from "@/core/domain/post"

export const postRepository = {
  async getAll(): Promise<Post[]> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    return db.collection("posts").find().sort({ _id: -1 }).toArray() as Post[]
  },

  async create(post: Omit<Post, "id">): Promise<Post> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const result = await db.collection("posts").insertOne(post)
    return { ...post, id: result.insertedId.toString() }
  },

  async update(id: string, post: Partial<Post>): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const res = await db.collection("posts").updateOne({ _id: new ObjectId(id) }, { $set: post })
    return res.modifiedCount > 0
  },

  async delete(id: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const res = await db.collection("posts").deleteOne({ _id: new ObjectId(id) })
    return res.deletedCount > 0
  },
}
```

---

## ⚙️ 6. Use Cases

```ts
// create-post.ts
import { postRepository } from "@/infrastructure/repositories/post-repo"
export async function createPostUseCase(data) {
  return await postRepository.create(data)
}

// update-post.ts
export async function updatePostUseCase(id: string, data) {
  return await postRepository.update(id, data)
}

// delete-post.ts
export async function deletePostUseCase(id: string) {
  return await postRepository.delete(id)
}

// get-posts.ts
export async function getPostsUseCase() {
  return await postRepository.getAll()
}
```

---

## ⚙️ 7. State Management (Zustand)

```ts
// app/posts/store/usePostStore.ts
"use client"
import { create } from "zustand"
import { Post } from "@/core/domain/post"

interface PostStore {
  posts: Post[]
  filter: string
  setPosts: (posts: Post[]) => void
  setFilter: (filter: string) => void
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  filter: "",
  setPosts: (posts) => set({ posts }),
  setFilter: (filter) => set({ filter }),
}))
```

---

## ⚙️ 8. Server Actions

```ts
// app/posts/actions.ts
"use server"
import { revalidatePath } from "next/cache"
import {
  createPostUseCase,
  deletePostUseCase,
  updatePostUseCase,
} from "@/core/application/usecases"

export async function createPostAction(formData: FormData) {
  const title = formData.get("title")?.toString() || ""
  const content = formData.get("content")?.toString() || ""
  await createPostUseCase({ title, content })
  revalidatePath("/posts")
}

export async function deletePostAction(id: string) {
  await deletePostUseCase(id)
  revalidatePath("/posts")
}

export async function updatePostAction(id: string, formData: FormData) {
  const title = formData.get("title")?.toString()
  const content = formData.get("content")?.toString()
  await updatePostUseCase(id, { title, content })
  revalidatePath("/posts")
}
```

---

## ⚙️ 9. UI Components

### `PostForm.tsx`

```tsx
"use client"
import { useTransition } from "react"
import { createPostAction } from "../actions"

export default function PostForm() {
  const [pending, startTransition] = useTransition()
  async function handleSubmit(formData: FormData) {
    startTransition(async () => await createPostAction(formData))
  }

  return (
    <form action={handleSubmit} className="space-y-2 mt-4">
      <input name="title" placeholder="Title" className="border p-1 w-full" required />
      <textarea name="content" placeholder="Content" className="border p-1 w-full" required />
      <button className="bg-blue-500 text-white px-3 py-1 rounded" disabled={pending}>
        {pending ? "Saving..." : "Add Post"}
      </button>
    </form>
  )
}
```

### `PostFilter.tsx`

```tsx
"use client"
import { usePostStore } from "../store/usePostStore"
export default function PostFilter() {
  const { filter, setFilter } = usePostStore()
  return (
    <input
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      placeholder="Search..."
      className="border px-2 py-1 rounded"
    />
  )
}
```

### `PostList.tsx`

```tsx
"use client"
import { useEffect } from "react"
import { usePostStore } from "../store/usePostStore"
import { deletePostAction } from "../actions"

export default function PostList({ initialPosts }) {
  const { posts, setPosts, filter } = usePostStore()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const filtered = posts.filter((p) => p.title.toLowerCase().includes(filter.toLowerCase()))

  return (
    <ul className="mt-4 space-y-1">
      {filtered.map((p) => (
        <li key={p.id} className="flex justify-between border-b py-1">
          {p.title}
          <button onClick={() => deletePostAction(p.id)} className="text-red-500">
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
```

---

## ⚙️ 10. Page

```tsx
// app/posts/page.tsx
import { getPostsUseCase } from "@/core/application/usecases/get-posts"
import PostForm from "./components/PostForm"
import PostFilter from "./components/PostFilter"
import PostList from "./components/PostList"

export default async function PostsPage() {
  const posts = await getPostsUseCase()
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Blog Posts</h1>
      <PostForm />
      <PostFilter />
      <PostList initialPosts={posts} />
    </div>
  )
}
```

---

## 🧪 11. Testing Setup

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config"
export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    coverage: { provider: "v8" },
  },
})
```

### `vitest.setup.ts`

```ts
import "@testing-library/jest-dom"
```

---

## 🧩 12. Test ví dụ

### Domain

```ts
import { describe, it, expect } from "vitest"
import { Post } from "../post"

describe("Post", () => {
  it("creates a valid post", () => {
    const p: Post = { id: "1", title: "A", content: "B" }
    expect(p.title).toBe("A")
  })
})
```

### Use Case

```ts
import { describe, it, expect, vi } from "vitest"
import { createPostUseCase } from "../create-post"
import { postRepository } from "@/infrastructure/repositories/post-repo"

vi.mock("@/infrastructure/repositories/post-repo", () => ({
  postRepository: { create: vi.fn().mockResolvedValue({ id: "1", title: "T", content: "C" }) },
}))

it("calls repo correctly", async () => {
  const res = await createPostUseCase({ title: "T", content: "C" })
  expect(res.id).toBe("1")
  expect(postRepository.create).toHaveBeenCalledOnce()
})
```

### Repository Integration (in-memory Mongo)

```ts
import { MongoMemoryServer } from "mongodb-memory-server"
import { MongoClient } from "mongodb"
import { postRepository } from "../post-repo"

let server: MongoMemoryServer, client: MongoClient

beforeAll(async () => {
  server = await MongoMemoryServer.create()
  process.env.MONGODB_URI = server.getUri()
  process.env.MONGODB_DB = "testdb"
  client = new MongoClient(server.getUri())
  await client.connect()
})

afterAll(async () => {
  await client.close()
  await server.stop()
})

it("inserts and reads", async () => {
  const post = await postRepository.create({ title: "T", content: "C" })
  const all = await postRepository.getAll()
  expect(all.length).toBe(1)
  expect(all[0].title).toBe("T")
})
```

### Component Test

```tsx
import { render, screen } from "@testing-library/react"
import PostList from "../PostList"

it("renders posts", () => {
  render(<PostList initialPosts={[{ id: "1", title: "Hello", content: "World" }]} />)
  expect(screen.getByText("Hello")).toBeInTheDocument()
})
```

---

## 🧪 13. Chạy test

```bash
npx vitest
# hoặc giao diện UI:
npx vitest --ui
```

---

## ✅ 14. Tổng kết

| Thành phần  | Công nghệ               | Vai trò                    |
| ----------- | ----------------------- | -------------------------- |
| Data Layer  | MongoDB                 | Lưu dữ liệu                |
| Repository  | `post-repo.ts`          | CRUD                       |
| Application | Use Case                | Logic nghiệp vụ            |
| UI          | Next.js 16 (App Router) | Giao diện                  |
| State       | Zustand                 | Local store                |
| Action      | Server Actions          | Mutation server-side       |
| Test        | Vitest + RTL            | Unit, Integration, UI test |
