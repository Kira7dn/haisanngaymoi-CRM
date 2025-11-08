import { NextRequest, NextResponse } from "next/server";
import { UpsertUserUseCase } from "@/core/application/usecases/user/upsert-user";
import { userService } from "@/lib/container";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const useCase = new UpsertUserUseCase(userService);
  const result = await useCase.execute(body);
  return NextResponse.json(result.user);
}
