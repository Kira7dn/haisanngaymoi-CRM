import type { BannerService } from "@/core/application/interfaces/banner-service";
import type { Banner } from "@/core/domain/banner";

export interface GetBannersRequest {
  detailed?: boolean;
}

export interface GetBannersResponse {
  banners: Banner[] | string[];
}

export class GetBannersUseCase {
  constructor(private bannerService: BannerService) {}

  async execute(request: GetBannersRequest): Promise<GetBannersResponse> {
    const banners = await this.bannerService.getAll();
    if (request.detailed) {
      return { banners: banners.map(b => ({ id: b.id, url: b.url })) };
    } else {
      return { banners: banners.map(b => b.url) };
    }
  }
}
