import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/**
 * GET: Get event QR data for check-in (admin only)
 * Returns event info + URL that participants scan
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        slug: true,
        tanggalMulai: true,
        lokasi: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    }

    // The check-in URL that participants will scan
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const checkinUrl = `${baseUrl}/daftar/${event.slug}/checkin`;

    // Count check-ins
    const [totalRegistrations, checkedInCount] = await Promise.all([
      prisma.registrasi.count({ where: { eventId: id } }),
      prisma.registrasi.count({ where: { eventId: id, checkedIn: true } }),
    ]);

    return NextResponse.json({
      event: {
        id: event.id,
        nama: event.nama,
        slug: event.slug,
        tanggalMulai: event.tanggalMulai,
        lokasi: event.lokasi,
      },
      checkinUrl,
      stats: {
        total: totalRegistrations,
        checkedIn: checkedInCount,
        remaining: totalRegistrations - checkedInCount,
      },
    });
  } catch (error) {
    console.error("Get QR error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
