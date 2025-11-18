export interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  detail?: string;
  sizes?: SizeOption[];
  colors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SizeOption {
  label: string;
  price: number;
  originalPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice?: number;
  sizeLabel?: string;
}

export type Cart = CartItem[];

export interface Location {
  lat: number;
  lng: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
}

export interface Station {
  id: number;
  name: string;
  image: string;
  address: string;
  location: Location;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "completed" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type PaymentMethod = "cod" | "bank_transfer" | "zalopay" | "momo" | "vnpay" | "credit_card";
export type ShippingProvider = "ghn" | "ghtk" | "vnpost" | "self_delivery";

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Delivery {
  name: string;
  phone: string;
  address: string;
  location?: {
    lat: number;
    lon: number;
  };
  shippingProvider?: ShippingProvider;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  amount: number;
}

export interface Order {
  id: number;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  delivery: Delivery;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  payment: PaymentInfo;
  tags: string[];
  platformOrderId?: string;
  platformSource?: string;
  note?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface CreateOrderRequest {
  zaloUserId: string;
  items: CartItem[];
  total: number;
  delivery?: ShippingAddress;
  note?: string;
}
export interface CreateOrderResponse {
  orderId: string;
}