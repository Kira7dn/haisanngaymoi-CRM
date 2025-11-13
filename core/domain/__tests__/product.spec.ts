import { describe, it, expect } from 'vitest';
import type { Product, SizeOption } from '@/core/domain/product';

describe('Product Domain', () => {
  it('should define a valid product with required fields', () => {
    const product: Product = {
      id: 1,
      categoryId: 1,
      name: 'Fresh Seafood',
      price: 100000,
    };

    expect(product.id).toBe(1);
    expect(product.categoryId).toBe(1);
    expect(product.name).toBe('Fresh Seafood');
    expect(product.price).toBe(100000);
  });

  it('should define a product with all optional fields', () => {
    const sizes: SizeOption[] = [
      { label: 'Small', price: 80000, originalPrice: 100000 },
      { label: 'Medium', price: 120000, originalPrice: 150000 },
    ];

    const product: Product = {
      id: 2,
      categoryId: 1,
      name: 'Premium Crab',
      price: 200000,
      originalPrice: 250000,
      image: 'https://example.com/crab.jpg',
      detail: 'Fresh premium crab from Cô Tô island',
      sizes,
      colors: ['red', 'brown'],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };

    expect(product.originalPrice).toBe(250000);
    expect(product.image).toBe('https://example.com/crab.jpg');
    expect(product.detail).toBe('Fresh premium crab from Cô Tô island');
    expect(product.sizes).toHaveLength(2);
    expect(product.colors).toEqual(['red', 'brown']);
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.updatedAt).toBeInstanceOf(Date);
  });

  it('should define valid size options', () => {
    const size: SizeOption = {
      label: 'Large',
      price: 150000,
      originalPrice: 180000,
    };

    expect(size.label).toBe('Large');
    expect(size.price).toBe(150000);
    expect(size.originalPrice).toBe(180000);
  });

  it('should allow size option without originalPrice', () => {
    const size: SizeOption = {
      label: 'XL',
      price: 200000,
    };

    expect(size.label).toBe('XL');
    expect(size.price).toBe(200000);
    expect(size.originalPrice).toBeUndefined();
  });
});
