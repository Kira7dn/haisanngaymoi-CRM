import type { Product, SizeOption } from "@/core/domain/product";
import type { ProductService, FilterProductsParams } from "@/core/application/interfaces/product-service";
import clientPromise from "@/infrastructure/db/mongo";

/**
 * MongoDB document interface for Product collection
 */
interface ProductDocument {
  _id: number;
  categoryId: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  detail: string;
  sizes?: SizeOption[];
  colors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const normalizeSizes = (product: ProductDocument): SizeOption[] | undefined => {
  if (!product.sizes || product.sizes.length === 0) return undefined;
  return product.sizes
    .map((s) => {
      if (typeof s === "string") {
        return {
          label: s,
          price: product.price,
          originalPrice: product.originalPrice,
        };
      }
      const label = s.label ?? "";
      if (!label) return null;
      const price = typeof s.price === "number" ? s.price : product.price;
      const originalPrice = typeof s.originalPrice === "number" ? s.originalPrice : product.originalPrice;
      return { label, price, originalPrice };
    })
    .filter((s) => s !== null) as SizeOption[];
};;

const getNextProductId = async (): Promise<number> => {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const lastProduct = await db.collection<ProductDocument>("products").findOne({}, { sort: { _id: -1 } });
  return lastProduct ? lastProduct._id + 1 : 1;
};

export const productRepository: ProductService & {
  getNextId(): Promise<number>;
} = {
  async getAll(): Promise<Product[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const docs = await db.collection<ProductDocument>("products").find({}).sort({ _id: 1 }).toArray();
    return docs.map((d) => ({
      id: d._id,
      categoryId: d.categoryId,
      name: d.name,
      price: d.price,
      originalPrice: d.originalPrice,
      image: d.image,
      detail: d.detail,
      sizes: normalizeSizes(d),
      colors: d.colors,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  },

  async getById(id: number): Promise<Product | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const doc = await db.collection<ProductDocument>("products").findOne({ _id: id });
    return doc ? {
      id: doc._id,
      categoryId: doc.categoryId,
      name: doc.name,
      price: doc.price,
      originalPrice: doc.originalPrice,
      image: doc.image,
      detail: doc.detail,
      sizes: normalizeSizes(doc),
      colors: doc.colors,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } : null;
  },

  async filter(params: FilterProductsParams): Promise<Product[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const query: Record<string, unknown> = {};
    if (params.categoryId !== undefined) {
      const categoryIdNumber = Number(params.categoryId);
      if (!Number.isNaN(categoryIdNumber)) {
        query.categoryId = categoryIdNumber;
      }
    }
    if (params.search) {
      query.name = { $regex: params.search, $options: "i" };
    }
    const docs = await db.collection<ProductDocument>("products").find(query).sort({ _id: 1 }).toArray();
    return docs.map((d) => ({
      id: d._id,
      categoryId: d.categoryId,
      name: d.name,
      price: d.price,
      originalPrice: d.originalPrice,
      image: d.image,
      detail: d.detail,
      sizes: normalizeSizes(d),
      colors: d.colors,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  },

  async create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const id = await getNextProductId();
    const now = new Date();
    const doc: ProductDocument = {
      _id: id,
      categoryId: product.categoryId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image || "",
      detail: product.detail || "",
      sizes: product.sizes,
      colors: product.colors,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<ProductDocument>("products").insertOne(doc);
    return {
      id,
      categoryId: product.categoryId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image || "",
      detail: product.detail || "",
      sizes: product.sizes,
      colors: product.colors,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(id: number, product: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const updateObj: Partial<ProductDocument> = {
      ...product,
      updatedAt: new Date()
    };
    const result = await db.collection<ProductDocument>("products").findOneAndUpdate(
      { _id: id },
      { $set: updateObj },
      { returnDocument: "after" }
    );
    if (result) {
      return {
        id: result._id,
        categoryId: result.categoryId,
        name: result.name,
        price: result.price,
        originalPrice: result.originalPrice,
        image: result.image,
        detail: result.detail,
        sizes: normalizeSizes(result),
        colors: result.colors,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    }
    return null;
  },

  async delete(id: number): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection<ProductDocument>("products").deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  getNextId: getNextProductId,
};
