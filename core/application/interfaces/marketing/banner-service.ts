import type { Banner } from "@/core/domain/marketing/banner";

export interface LLMService {
  getAll(): Promise<Banner[]>;
  getById(id: number): Promise<Banner | null>;
  create(payload: BannerPayload): Promise<Banner>;
  update(payload: BannerPayload & { id: number }): Promise<Banner | null>;
  delete(id: number): Promise<boolean>;
}
