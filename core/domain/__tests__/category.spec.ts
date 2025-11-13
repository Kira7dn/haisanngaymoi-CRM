import { describe, it, expect } from 'vitest';
import type { Category } from '@/core/domain/category';

describe('Category Domain', () => {
  it('should define a valid category with required fields', () => {
    const category: Category = {
      id: 1,
      name: 'Seafood',
      image: 'https://example.com/seafood.jpg',
    };

    expect(category.id).toBe(1);
    expect(category.name).toBe('Seafood');
    expect(category.image).toBe('https://example.com/seafood.jpg');
  });

  it('should define a category with timestamps', () => {
    const category: Category = {
      id: 2,
      name: 'Fresh Fish',
      image: 'https://example.com/fish.jpg',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };

    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow category without timestamps', () => {
    const category: Category = {
      id: 3,
      name: 'Shellfish',
      image: 'https://example.com/shellfish.jpg',
    };

    expect(category.createdAt).toBeUndefined();
    expect(category.updatedAt).toBeUndefined();
  });
});
