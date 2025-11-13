import type { Category } from "@/core/domain/category";
import type { CategoryService } from "@/core/application/interfaces/category-service";
import clientPromise from "@/infrastructure/db/mongo";

/**
 * MongoDB document interface for Category collection
 */
interface CategoryDocument {
  _id: number;
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const getNextCategoryId = async (): Promise<number> => {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const lastCategory = await db.collection<CategoryDocument>("categories").findOne({}, { sort: { _id: -1 } });
  return lastCategory ? lastCategory._id + 1 : 1;
};

export const categoryRepository: CategoryService & {
  getNextId(): Promise<number>;
} = {
  async getAll(): Promise<Category[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const docs = await db.collection<CategoryDocument>("categories").find({}).sort({ _id: 1 }).toArray();
    return docs.map((d) => ({
      id: d._id,
      name: d.name,
      image: d.image,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  },

  async getById(id: number): Promise<Category | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const doc = await db.collection<CategoryDocument>("categories").findOne({ _id: id });
    return doc ? {
      id: doc._id,
      name: doc.name,
      image: doc.image,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } : null;
  },

  async create(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const id = await getNextCategoryId();
    const now = new Date();
    const doc: CategoryDocument = {
      _id: id,
      name: category.name,
      image: category.image,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<CategoryDocument>("categories").insertOne(doc);
    return { id, name: category.name, image: category.image, createdAt: now, updatedAt: now };
  },

  async update(id: number, category: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<Category | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const updateObj: Partial<CategoryDocument> = {
      ...category,
      updatedAt: new Date()
    };

    const result = await db.collection<CategoryDocument>("categories").findOneAndUpdate(
      { _id: id },
      { $set: updateObj },
      { returnDocument: "after" }
    );

    if (result) {
      return {
        id: result._id,
        name: result.name,
        image: result.image,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    }
    return null;
  },

  async delete(id: number): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection<CategoryDocument>("categories").deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  getNextId: getNextCategoryId,
};
