import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdUseCase, updateOrderUseCase, deleteOrderUseCase } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await getOrderByIdUseCase.execute({ id: orderId });
  if (!result.order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return NextResponse.json(result.order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const result = await updateOrderUseCase.execute({ id: orderId, payload: body });
  if (!result.order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return NextResponse.json(result.order);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await deleteOrderUseCase.execute({ id: orderId });
  if (!result.success) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
