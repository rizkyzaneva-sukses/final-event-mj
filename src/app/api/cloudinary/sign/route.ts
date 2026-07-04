import { NextRequest, NextResponse } from "next/server";
import { getUploadParams } from "@/lib/cloudinary";

/**
 * POST: Generate Cloudinary signed upload params
 * Public endpoint — used by registration form
 */
export async function POST(request: NextRequest) {
  try {
    const { eventSlug, noWa, nama } = await request.json();

    if (!eventSlug || !noWa || !nama) {
      return NextResponse.json(
        { error: "eventSlug, noWa, dan nama wajib diisi" },
        { status: 400 }
      );
    }

    const params = getUploadParams(eventSlug, noWa, nama);
    return NextResponse.json(params);
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
