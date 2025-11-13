import { NextRequest, NextResponse } from "next/server";
import { getBannersUseCase, createBannerUseCase } from "@/lib/container";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  const result = await getBannersUseCase.execute({ detailed });
  return NextResponse.json(result.banners);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createBannerUseCase.execute(body);
  return NextResponse.json(result.banner, { status: 201 });
}
