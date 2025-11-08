import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // macRequest
  return NextResponse.json({ message: "MAC request" });
}
