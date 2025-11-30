import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { MongoClient } from 'mongodb';
import type { Product, SizeOption } from '@/core/domain/product';

let uri: string;
let client: MongoClient;
const TEST_PREFIX = `vitest_${process.pid}_`;

describe.sequential('productRepository (integration)', () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
      throw new Error('MONGODB_URI and MONGODB_DB must be set to run integration tests against Mongo Cloud');
    }
    uri = process.env.MONGODB_URI;
    client = new MongoClient(uri);
    await client.connect();
  }, 60000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should create a product with basic fields', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const product = await productRepository.create({
      categoryId: 1,
      name: TEST_PREFIX + 'Fresh Crab',
      price: 200000,
      originalPrice: 250000,
      image: 'https://example.com/crab.jpg',
      detail: 'Fresh crab from Cô Tô island',
    });

    expect(product.id).toBeDefined();
    expect(product.name).toBe(TEST_PREFIX + 'Fresh Crab');
    expect(product.price).toBe(200000);
    expect(product.categoryId).toBe(1);
    expect(product.createdAt).toBeInstanceOf(Date);
  });

  it('should create a product with sizes and colors', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const sizes: SizeOption[] = [
      { label: 'Small', price: 100000, originalPrice: 120000 },
      { label: 'Large', price: 200000, originalPrice: 250000 },
    ];

    const product = await productRepository.create({
      categoryId: 1,
      name: TEST_PREFIX + 'Premium Shrimp',
      price: 150000,
      sizes,
      colors: ['red', 'orange'],
    });

    expect(product.sizes).toBeDefined();
    expect(product.sizes).toHaveLength(2);
    expect(product.sizes?.[0].label).toBe('Small');
    expect(product.colors).toEqual(['red', 'orange']);
  });

  it('should get product by id', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const created = await productRepository.create({
      categoryId: 1,
      name: TEST_PREFIX + 'Test Product',
      price: 100000,
    });

    const fetched = await productRepository.getById(created.id);

    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.name).toBe(TEST_PREFIX + 'Test Product');
  });

  it('should return null when product not found', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const product = await productRepository.getById(9999);

    expect(product).toBeNull();
  });

  it('should update a product', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const created = await productRepository.create({
      categoryId: 1,
      name: TEST_PREFIX + 'Original Name',
      price: 100000,
    });

    const updated = await productRepository.update(created.id, {
      name: 'Updated Name',
      price: 150000,
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.price).toBe(150000);
    expect(updated?.updatedAt).toBeInstanceOf(Date);
  });

  it('should filter products by categoryId', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');
    const TAG = `${TEST_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2,7)}_`;
    await productRepository.create({ categoryId: 1, name: TAG + 'Product 1', price: 100000 });
    await productRepository.create({ categoryId: 1, name: TAG + 'Product 2', price: 200000 });
    await productRepository.create({ categoryId: 2, name: TAG + 'Product 3', price: 300000 });

    const products = await productRepository.filter({ categoryId: 1 });
    const mine = products.filter(p => p.name.startsWith(TAG));

    expect(mine).toHaveLength(2);
    expect(mine.every(p => p.categoryId === 1)).toBe(true);
  });

  it('should filter products by search keyword', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');
    const TAG = `${TEST_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2,7)}_`;

    await productRepository.create({ categoryId: 1, name: TAG + 'Fresh Crab', price: 200000 });
    await productRepository.create({ categoryId: 1, name: TAG + 'Dried Crab', price: 150000 });
    await productRepository.create({ categoryId: 1, name: TAG + 'Fresh Shrimp', price: 100000 });

    const products = await productRepository.filter({ search: 'crab' });
    const mine = products.filter(p => p.name.startsWith(TAG));

    expect(mine).toHaveLength(2);
    expect(mine.every(p => p.name.toLowerCase().includes('crab'))).toBe(true);
  });

  it('should filter products by both categoryId and search', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');
    const TAG = `${TEST_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2,7)}_`;

    await productRepository.create({ categoryId: 1, name: TAG + 'Fresh Crab', price: 200000 });
    await productRepository.create({ categoryId: 1, name: TAG + 'Dried Shrimp', price: 100000 });
    await productRepository.create({ categoryId: 2, name: TAG + 'Fresh Crab', price: 250000 });

    const products = await productRepository.filter({ categoryId: 1, search: 'crab' });
    const mine = products.filter(p => p.name.startsWith(TAG));

    expect(mine).toHaveLength(1);
    expect(mine[0].name).toBe(TAG + 'Fresh Crab');
    expect(mine[0].categoryId).toBe(1);
  });

  it('should delete a product', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const created = await productRepository.create({
      categoryId: 1,
      name: TEST_PREFIX + 'To Delete',
      price: 100000,
    });

    const deleted = await productRepository.delete(created.id);
    expect(deleted).toBe(true);

    const fetched = await productRepository.getById(created.id);
    expect(fetched).toBeNull();
  });

  it('should return false when deleting non-existent product', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const deleted = await productRepository.delete(9999);
    expect(deleted).toBe(false);
  });

  it('should handle string sizes and normalize them', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const db = client.db(process.env.MONGODB_DB!);
    type ProductDoc = {
      _id: number;
      categoryId: number;
      name: string;
      price: number;
      originalPrice: number;
      image: string;
      detail: string;
      sizes?: any;
      colors?: string[];
      createdAt: Date;
      updatedAt: Date;
    };
    const productsCol = db.collection<ProductDoc>('products');
    const nextId = await productRepository.getNextId();
    await productsCol.insertOne({
      _id: nextId,
      categoryId: 1,
      name: 'Test Product',
      price: 100000,
      originalPrice: 120000,
      image: '',
      detail: '',
      sizes: ['Small', 'Medium', 'Large'] as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const product = await productRepository.getById(nextId);

    expect(product?.sizes).toBeDefined();
    expect(product?.sizes).toHaveLength(3);
    expect(product?.sizes?.[0]).toEqual({
      label: 'Small',
      price: 100000,
      originalPrice: 120000,
    });
  });

  it('should auto-increment product IDs', async () => {
    const { productRepository } = await import('@/infrastructure/repositories/catalog/product-repo');

    const product1 = await productRepository.create({
      categoryId: 1,
      name: 'Product 1',
      price: 100000,
    });

    const product2 = await productRepository.create({
      categoryId: 1,
      name: 'Product 2',
      price: 200000,
    });

    expect(product2.id).toBeGreaterThan(product1.id);
  });
});
