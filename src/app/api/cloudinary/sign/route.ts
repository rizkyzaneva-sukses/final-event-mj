import { NextRequest, NextResponse } from "next/server";
import { getUploadParams } from "@/lib/cloudinary";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST: Generate Cloudinary signed upload params
 * Public endpoint — rate-limited to prevent abuse
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, { ...RATE_LIMITS.cloudinary, key: "cloudinary" });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const { eventSlug, noWa, nama } = await request.json();

    if (!eventSlug || !noWa || !nama) {
      return NextResponse.json(
        { error: "eventSlug, noWa, dan nama wajib diisi" },
        { status: 400 }
      );
    }

    // Basic input sanitization
    const sanitizedSlug = eventSlug.replace(/[^a-z0-9-]/g, "").slice(0, 100);
    const sanitizedNoWa = noWa.replace(/[^0-9+]/g, "").slice(0, 20);
    const sanitizedNama = nama.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 50);

    if (!sanitizedSlug || !sanitizedNoWa || !sanitizedNama) {
      return NextResponse.json(
        { error: "Parameter tidak valid" },
        { status: 400 }
      );
    }

    const params = getUploadParams(sanitizedSlug, sanitizedNoWa, sanitizedNama);
    return NextResponse.json(params);
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
