import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/**
 * POST: Check-in a registrant by checkinCode
 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { checkinCode } = body;

    if (!checkinCode || typeof checkinCode !== "string") {
      return NextResponse.json(
        { error: "checkinCode wajib diisi" },
        { status: 400 }
      );
    }

    const registrasi = await prisma.registrasi.findFirst({
      where: {
        eventId,
        checkinCode: checkinCode.trim(),
      },
      include: {
        member: { select: { id: true, nama: true, noWa: true } },
        peserta: {
          include: {
            member: { select: { nama: true } },
            tanggungan: { select: { nama: true } },
          },
        },
      },
    });

    if (!registrasi) {
      return NextResponse.json(
        { error: "Kode check-in tidak ditemukan" },
        { status: 404 }
      );
    }

    if (registrasi.checkedIn) {
      return NextResponse.json(
        {
          error: "Sudah check-in sebelumnya",
          checkedInAt: registrasi.checkedInAt,
          member: registrasi.member,
        },
        { status: 409 }
      );
    }

    await prisma.registrasi.update({
      where: { id: registrasi.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      member: registrasi.member,
      pesertaCount: registrasi.peserta.length,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
