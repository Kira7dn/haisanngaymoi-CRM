import { describe, it, expect } from 'vitest';
import type { User } from '@/core/domain/user';

describe('User Domain', () => {
  it('should define a valid user with all required fields', () => {
    const user: User = {
      id: 'user_123',
      name: 'Nguyen Van A',
      avatar: 'https://example.com/avatar.jpg',
      phone: '0123456789',
      email: 'nguyenvana@example.com',
      address: '123 Main St, Cô Tô, Quảng Ninh',
    };

    expect(user.id).toBe('user_123');
    expect(user.name).toBe('Nguyen Van A');
    expect(user.avatar).toBe('https://example.com/avatar.jpg');
    expect(user.phone).toBe('0123456789');
    expect(user.email).toBe('nguyenvana@example.com');
    expect(user.address).toBe('123 Main St, Cô Tô, Quảng Ninh');
  });

  it('should define a user with timestamps', () => {
    const user: User = {
      id: 'user_456',
      name: 'Tran Thi B',
      avatar: 'https://example.com/avatar2.jpg',
      phone: '0987654321',
      email: 'tranthib@example.com',
      address: '456 Street, Hanoi',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow user without timestamps', () => {
    const user: User = {
      id: 'user_789',
      name: 'Le Van C',
      avatar: 'https://example.com/avatar3.jpg',
      phone: '0111222333',
      email: 'levanc@example.com',
      address: '789 Road, HCMC',
    };

    expect(user.createdAt).toBeUndefined();
    expect(user.updatedAt).toBeUndefined();
  });
});
