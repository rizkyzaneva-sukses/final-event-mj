import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthMember } from "@/lib/member-session";

/**
 * GET: Get registration history for logged-in member
 */
export async function GET() {
  const member = await getAuthMember();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const registrasi = await prisma.registrasi.findMany({
      where: { memberId: member.memberId },
      include: {
        event: {
          select: {
            id: true,
            nama: true,
            slug: true,
            tanggalMulai: true,
            lokasi: true,
            isBerbayar: true,
          },
        },
        pembayaran: {
          select: {
            status: true,
            jumlahTagihan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      history: registrasi.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        checkedIn: r.checkedIn,
        checkedInAt: r.checkedInAt,
        event: r.event,
        pembayaran: r.pembayaran,
      })),
    });
  } catch (error) {
    console.error("Member history error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
