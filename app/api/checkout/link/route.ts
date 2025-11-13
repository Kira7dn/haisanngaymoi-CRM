import { NextRequest, NextResponse } from "next/server";
import { linkOrderUseCase } from "@/lib/container";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, checkoutSdkOrderId, miniAppId } = body;

    const result = await linkOrderUseCase.execute({
      orderId,
      checkoutSdkOrderId,
      miniAppId
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[linkOrder] Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Match Express controller behavior: return 404 for "not found" errors
    if (errorMessage === "Không tìm thấy đơn hàng") {
      return NextResponse.json({ message: errorMessage }, { status: 404 });
    }

    // All other errors return 400
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
