import { describe, it, expect } from 'vitest';
import type { Order, OrderStatus, PaymentStatus, Delivery, OrderItem } from '@/core/domain/order';

describe('Order Domain', () => {
  it('should define valid order status types', () => {
    const pending: OrderStatus = 'pending';
    const shipping: OrderStatus = 'shipping';
    const completed: OrderStatus = 'completed';

    expect(pending).toBe('pending');
    expect(shipping).toBe('shipping');
    expect(completed).toBe('completed');
  });

  it('should define valid payment status types', () => {
    const pending: PaymentStatus = 'pending';
    const success: PaymentStatus = 'success';
    const failed: PaymentStatus = 'failed';

    expect(pending).toBe('pending');
    expect(success).toBe('success');
    expect(failed).toBe('failed');
  });

  it('should define a valid delivery object', () => {
    const delivery: Delivery = {
      alias: 'Home',
      address: '123 Main St, Cô Tô, Quảng Ninh',
      name: 'Nguyen Van A',
      phone: '0123456789',
      stationId: 1,
      image: 'https://example.com/station.jpg',
      location: {
        lat: 20.9927,
        lng: 107.7645,
      },
    };

    expect(delivery.alias).toBe('Home');
    expect(delivery.name).toBe('Nguyen Van A');
    expect(delivery.phone).toBe('0123456789');
    expect(delivery.stationId).toBe(1);
    expect(delivery.location.lat).toBe(20.9927);
    expect(delivery.location.lng).toBe(107.7645);
  });

  it('should define a valid order item', () => {
    const item: OrderItem = {
      product: {
        id: 1,
        name: 'Fresh Crab',
        price: 200000,
      },
      quantity: 2,
    };

    expect(item.quantity).toBe(2);
    expect(item.product).toHaveProperty('id');
    expect(item.product).toHaveProperty('name');
  });

  it('should define a valid complete order', () => {
    const order: Order = {
      id: 1,
      zaloUserId: 'user123',
      checkoutSdkOrderId: 'checkout_456',
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
      items: [
        {
          product: { id: 1, name: 'Crab', price: 200000 },
          quantity: 2,
        },
        {
          product: { id: 2, name: 'Shrimp', price: 150000 },
          quantity: 3,
        },
      ],
      delivery: {
        alias: 'Office',
        address: '456 Business St',
        name: 'Tran Thi B',
        phone: '0987654321',
        stationId: 2,
        image: 'https://example.com/station2.jpg',
        location: { lat: 21.0285, lng: 105.8542 },
      },
      total: 850000,
      note: 'Please deliver before 5pm',
    };

    expect(order.id).toBe(1);
    expect(order.zaloUserId).toBe('user123');
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('pending');
    expect(order.items).toHaveLength(2);
    expect(order.total).toBe(850000);
    expect(order.note).toBe('Please deliver before 5pm');
    expect(order.delivery.name).toBe('Tran Thi B');
  });

  it('should allow order without optional checkoutSdkOrderId', () => {
    const order: Order = {
      id: 2,
      zaloUserId: 'user456',
      status: 'completed',
      paymentStatus: 'success',
      createdAt: new Date(),
      items: [],
      delivery: {
        alias: 'Home',
        address: '789 Street',
        name: 'Test User',
        phone: '0111222333',
        stationId: 1,
        image: '',
        location: { lat: 0, lng: 0 },
      },
      total: 0,
      note: '',
    };

    expect(order.checkoutSdkOrderId).toBeUndefined();
    expect(order.status).toBe('completed');
  });

  it('should allow order without updatedAt', () => {
    const order: Order = {
      id: 3,
      zaloUserId: 'user789',
      status: 'shipping',
      paymentStatus: 'success',
      createdAt: new Date(),
      items: [],
      delivery: {
        alias: 'Home',
        address: '789 Street',
        name: 'Test User',
        phone: '0111222333',
        stationId: 1,
        image: '',
        location: { lat: 0, lng: 0 },
      },
      total: 0,
      note: '',
    };

    expect(order.updatedAt).toBeUndefined();
  });
});
