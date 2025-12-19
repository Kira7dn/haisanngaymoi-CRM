import type { Product } from "@/core/domain/catalog/product";

export interface ProductPayload extends Partial<Product> { }

export interface FilterProductsParams {
  categoryId?: number | string;
  search?: string;
}

export interface ProductService {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  filter(params: FilterProductsParams): Promise<Product[]>;
  create(payload: ProductPayload): Promise<Product>;
  update(payload: ProductPayload & { id: string }): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}
