import { NextRequest, NextResponse } from "next/server";
import { GetCategoriesUseCase } from "@/core/application/usecases/category/get-categories";
import { CreateCategoryUseCase } from "@/core/application/usecases/category/create-category";
import { categoryService } from "@/lib/container";

export async function GET() {
  const useCase = new GetCategoriesUseCase(categoryService);
  const result = await useCase.execute();
  return NextResponse.json(result.categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const useCase = new CreateCategoryUseCase(categoryService);
  const result = await useCase.execute(body);
  return NextResponse.json(result.category, { status: 201 });
}
