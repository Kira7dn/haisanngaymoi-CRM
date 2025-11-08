import { NextRequest, NextResponse } from "next/server";
import { GetOrdersUseCase } from "@/core/application/usecases/order/get-orders";
import { CreateOrderUseCase } from "@/core/application/usecases/order/create-order";
import { orderService } from "@/lib/container";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const zaloUserId = url.searchParams.get("zaloUserId") || undefined;
  const useCase = new GetOrdersUseCase(orderService);
  const result = await useCase.execute({ status, zaloUserId });
  return NextResponse.json(result.orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const useCase = new CreateOrderUseCase(orderService);
  const result = await useCase.execute(body);
  return NextResponse.json(result.order, { status: 201 });
}
