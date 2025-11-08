import { NextRequest, NextResponse } from "next/server";
import { GetUserByIdUseCase } from "@/core/application/usecases/user/get-user-by-id";
import { userService } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const useCase = new GetUserByIdUseCase(userService);
  const result = await useCase.execute({ id: params.id });
  if (!result.user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  return NextResponse.json(result.user);
}
