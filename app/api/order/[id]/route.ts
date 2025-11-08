import { NextRequest, NextResponse } from "next/server";
import { GetOrderByIdUseCase } from "@/core/application/usecases/order/get-order-by-id";
import { UpdateOrderUseCase } from "@/core/application/usecases/order/update-order";
import { DeleteOrderUseCase } from "@/core/application/usecases/order/delete-order";
import { orderService } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const useCase = new GetOrderByIdUseCase(orderService);
  const result = await useCase.execute({ id });
  if (!result.order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return NextResponse.json(result.order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const useCase = new UpdateOrderUseCase(orderService);
  const result = await useCase.execute({ id, payload: body });
  if (!result.order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return NextResponse.json(result.order);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const useCase = new DeleteOrderUseCase(orderService);
  const result = await useCase.execute({ id });
  if (!result.success) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
