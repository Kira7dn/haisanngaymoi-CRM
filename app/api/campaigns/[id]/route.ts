import { NextRequest, NextResponse } from "next/server"
import {
  getCampaignByIdUseCase,
  updateCampaignUseCase,
  deleteCampaignUseCase,
} from "../depends"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const useCase = await getCampaignByIdUseCase()
    const result = await useCase.execute({ id: parseInt(id) })

    if (!result.campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(result.campaign)
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const useCase = await updateCampaignUseCase()
    const result = await useCase.execute({
      id: parseInt(id),
      payload: body,
    })

    if (!result.campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(result.campaign)
  } catch (error) {
    console.error("Error updating campaign:", error)
    const message = error instanceof Error ? error.message : "Failed to update campaign"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const useCase = await deleteCampaignUseCase()
    const result = await useCase.execute({ id: parseInt(id) })

    if (!result.success) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 })
  }
}
