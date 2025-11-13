import type { OrderService, UpdateOrderPayload } from "@/core/application/interfaces/order-service";
import type { Order } from "@/core/domain/order";

export interface UpdateOrderRequest {
  id: number;
  payload: UpdateOrderPayload;
}

export interface UpdateOrderResponse {
  order: Order | null;
}

export class UpdateOrderUseCase {
  constructor(private orderService: OrderService) {}

  async execute(request: UpdateOrderRequest): Promise<UpdateOrderResponse> {
    const order = await this.orderService.update(request.id, request.payload);
    return { order };
  }
}
