import type { OrderService } from "@/core/application/services/order-service";

export interface MacRequest {
  amount: number;
  desc: string;
  item: unknown;
  extradata?: string;
  method: string;
}

export interface MacResponse {
  mac: string;
}

export class MacRequestUseCase {
  constructor(private orderService: OrderService) {} // placeholder

  async execute(request: MacRequest): Promise<MacResponse> {
    // Logic tạo MAC như controller
    // Giả sử có secret key
    const params: Record<string, unknown> = { amount: request.amount, desc: request.desc, item: request.item, extradata: request.extradata, method: request.method };
    const dataMac = Object.keys(params)
      .filter((key) => params[key] !== undefined)
      .sort()
      .map((key) => {
        const value = params[key];
        return `${key}=${typeof value === "object" ? JSON.stringify(value) : value}`;
      })
      .join("&");
    // Tạo MAC với secret
    const mac = "placeholder"; // Implement HMAC
    return { mac };
  }
}
