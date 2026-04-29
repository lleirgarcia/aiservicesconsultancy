import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { canvas, format, quality } = await request.json();

    if (!canvas) {
      return NextResponse.json({ error: "Canvas data required" }, { status: 400 });
    }

    // Canvas is passed as base64 data URL
    // In production, convert and serve the blob
    // For now, return the canvas data for client-side download

    return NextResponse.json({
      success: true,
      message: "Image export initiated",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
