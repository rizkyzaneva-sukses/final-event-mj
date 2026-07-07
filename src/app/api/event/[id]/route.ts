import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { eventUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * GET: Event detail with all related data
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
      include: {
        kementerian: true,
        hargaTier: { orderBy: { urutan: "asc" } },
        bendaharaAssignment: {
          include: { adminUser: { select: { id: true, nama: true, email: true } } },
        },
        _count: { select: { registrasi: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    }

    // Access check
    if (user.role === "KEMENTERIAN" && event.kementerianId !== user.kementerianId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "BENDAHARA") {
      const isAssigned = event.bendaharaAssignment.some((ba) => ba.adminUserId === user.userId);
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update event (SDM or Kementerian Admin, with ownership check)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || !["SDM", "KEMENTERIAN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Verify event exists and check ownership for KEMENTERIAN
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    }
    if (user.role === "KEMENTERIAN" && existingEvent.kementerianId !== user.kementerianId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = eventUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build update data, converting date strings if present
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.tanggalMulai) updateData.tanggalMulai = new Date(parsed.data.tanggalMulai);
    if (parsed.data.tanggalSelesai) updateData.tanggalSelesai = new Date(parsed.data.tanggalSelesai);

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { kementerian: true },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete event (SDM only)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
