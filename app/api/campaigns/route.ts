import { NextRequest, NextResponse } from "next/server"
import {
  getAllCampaignsUseCase,
  getCampaignsByStatusUseCase,
  createCampaignUseCase,
} from "./depends"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    if (status) {
      const useCase = await getCampaignsByStatusUseCase()
      const result = await useCase.execute({
        status: status as "upcoming" | "active" | "ended",
      })
      return NextResponse.json(result.campaigns)
    }

    const useCase = await getAllCampaignsUseCase()
    const result = await useCase.execute({})
    return NextResponse.json(result.campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const useCase = await createCampaignUseCase()
    const result = await useCase.execute(body)
    return NextResponse.json(result.campaign, { status: 201 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    const message = error instanceof Error ? error.message : "Failed to create campaign"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
