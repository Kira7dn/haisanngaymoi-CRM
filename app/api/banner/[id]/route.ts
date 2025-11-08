import { NextRequest, NextResponse } from "next/server";
import { getBannerByIdUseCase, updateBannerUseCase, deleteBannerUseCase } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await getBannerByIdUseCase.execute({ id });
  if (!result.banner) return NextResponse.json({ message: "Banner not found" }, { status: 404 });
  return NextResponse.json(result.banner);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const result = await updateBannerUseCase.execute({ id, ...body });
  if (!result.banner) return NextResponse.json({ message: "Banner not found" }, { status: 404 });
  return NextResponse.json(result.banner);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await deleteBannerUseCase.execute({ id });
  if (!result.success) return NextResponse.json({ message: "Banner not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
