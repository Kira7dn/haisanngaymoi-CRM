import { NextRequest, NextResponse } from "next/server";
import { GetUserByIdUseCase } from "@/core/application/usecases/user/get-user-by-id";
import { UpsertUserUseCase } from "@/core/application/usecases/user/upsert-user";
import { userService } from "@/lib/container";

const getUserByIdUseCase = new GetUserByIdUseCase(userService);
const upsertUserUseCase = new UpsertUserUseCase(userService);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await getUserByIdUseCase.execute({ id: id }); // Use string ID
  if (!result.user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  return NextResponse.json(result.user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const result = await upsertUserUseCase.execute({ id: id, ...body }); // Use string ID
  if (!result.user) return NextResponse.json({ message: "User update failed" }, { status: 400 });
  return NextResponse.json(result.user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ message: "Delete operation not supported" }, { status: 405 });
}
