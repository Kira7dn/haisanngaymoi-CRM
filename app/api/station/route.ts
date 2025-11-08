import { NextRequest, NextResponse } from "next/server";
import { GetStationsUseCase } from "@/core/application/usecases/station/get-stations";
import { CreateStationUseCase } from "@/core/application/usecases/station/create-station";
import { stationService } from "@/lib/container";

export async function GET() {
  const useCase = new GetStationsUseCase(stationService);
  const result = await useCase.execute();
  return NextResponse.json(result.stations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const useCase = new CreateStationUseCase(stationService);
  const result = await useCase.execute(body);
  return NextResponse.json(result.station, { status: 201 });
}
