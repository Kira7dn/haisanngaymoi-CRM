export interface SizeOption {
  label: string;
  price: number;
  originalPrice?: number;
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
  createdAt?: Date;
  updatedAt?: Date;
}
