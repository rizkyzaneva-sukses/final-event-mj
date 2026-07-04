import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { hargaTierSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * GET: List harga tiers for an event
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const tiers = await prisma.hargaTier.findMany({
      where: { eventId: id },
      orderBy: { urutan: "asc" },
    });

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error("List harga tier error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * POST: Add harga tier to an event (admin only)
 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || !["SDM", "KEMENTERIAN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Verify event exists and is berbayar
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    }
    if (!event.isBerbayar) {
      return NextResponse.json(
        { error: "Event gratis tidak memiliki harga tier" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = hargaTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tier = await prisma.hargaTier.create({
      data: {
        eventId: id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error) {
    console.error("Create harga tier error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
