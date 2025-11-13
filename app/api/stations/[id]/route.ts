import { NextRequest, NextResponse } from "next/server";
import { getStationByIdUseCase, updateStationUseCase, deleteStationUseCase } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stationId = Number(id);
  if (isNaN(stationId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await getStationByIdUseCase.execute({ id: stationId });
  if (!result.station) return NextResponse.json({ message: "Station not found" }, { status: 404 });
  return NextResponse.json(result.station);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stationId = Number(id);
  if (isNaN(stationId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const result = await updateStationUseCase.execute({ id: stationId, ...body });
  if (!result.station) return NextResponse.json({ message: "Station not found" }, { status: 404 });
  return NextResponse.json(result.station);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stationId = Number(id);
  if (isNaN(stationId)) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  const result = await deleteStationUseCase.execute({ id: stationId });
  if (!result.success) return NextResponse.json({ message: "Station not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
