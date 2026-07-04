import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

/**
 * Public: Get event by slug for registration form
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        kementerian: { select: { nama: true, kodeUnik: true } },
        hargaTier: { orderBy: { urutan: "asc" } },
      },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { error: "Event tidak ditemukan atau sudah ditutup" },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get event by slug error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
