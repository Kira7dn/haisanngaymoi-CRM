import { NextRequest, NextResponse } from "next/server";
import { getProductByIdUseCase, updateProductUseCase, deleteProductUseCase } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    const result = await getProductByIdUseCase.execute({ id });
    if (!result.product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    return NextResponse.json(result.product);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    const body = await request.json();
    const result = await updateProductUseCase.execute({ id, ...body });
    if (!result.product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    return NextResponse.json(result.product);
  } catch (error) {
    return NextResponse.json({ message: "Error updating product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    const result = await deleteProductUseCase.execute({ id });
    if (!result.success) return NextResponse.json({ message: "Product not found" }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting product" }, { status: 500 });
  }
}
