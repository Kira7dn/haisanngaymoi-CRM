import { NextRequest, NextResponse } from "next/server";
import { getStationsUseCase, createStationUseCase } from "@/lib/container";

export async function GET() {
  const result = await getStationsUseCase.execute();
  return NextResponse.json(result.stations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createStationUseCase.execute(body);
  return NextResponse.json(result.station, { status: 201 });
}
