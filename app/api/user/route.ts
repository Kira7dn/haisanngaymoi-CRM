import { NextRequest, NextResponse } from "next/server";
import { upsertUserUseCase } from "@/lib/container";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await upsertUserUseCase.execute(body);
  return NextResponse.json(result.user);
}
