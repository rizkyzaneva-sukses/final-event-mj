import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/**
 * GET: List registrations for an event (admin only)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const registrations = await prisma.registrasi.findMany({
      where: { eventId: id },
      include: {
        member: { select: { id: true, nama: true, noWa: true, domisili: true } },
        peserta: {
          include: {
            member: { select: { nama: true } },
            tanggungan: { select: { nama: true, tanggalLahir: true, hubungan: true } },
          },
        },
        pembayaran: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      registrations: registrations.map((r) => ({
        id: r.id,
        statusOts: r.statusOts,
        createdAt: r.createdAt,
        checkinCode: r.checkinCode,
        checkedIn: r.checkedIn,
        checkedInAt: r.checkedInAt,
        member: r.member,
        peserta: r.peserta,
        pembayaran: r.pembayaran,
      })),
    });
  } catch (error) {
    console.error("List registrations error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
