export type OrderStatus = "pending" | "shipping" | "completed";
export type PaymentStatus = "pending" | "success" | "failed";

export interface Delivery {
  alias: string;
  address: string;
  name: string;
  phone: string;
  stationId: number;
  image: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface OrderItem {
  product: Record<string, unknown>;
  quantity: number;
}

export interface Order {
  id: number;
  zaloUserId: string;
  checkoutSdkOrderId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt?: Date;
  items: OrderItem[];
  delivery: Delivery;
  total: number;
  note: string;
}
