import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { eventCreateSchema } from "@/lib/validations";

/**
 * GET: List events (filtered by role)
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Role-based filtering
    let where = {};
    if (user.role === "KEMENTERIAN" && user.kementerianId) {
      where = { kementerianId: user.kementerianId };
    } else if (user.role === "BENDAHARA") {
      where = {
        bendaharaAssignment: {
          some: { adminUserId: user.userId },
        },
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        kementerian: { select: { nama: true, kodeUnik: true } },
        _count: { select: { registrasi: true, hargaTier: true } },
      },
      orderBy: { tanggalMulai: "desc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("List events error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create event (SDM or Kementerian Admin)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !["SDM", "KEMENTERIAN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = eventCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Kementerian Admin can only create events for their own kementerian
    if (user.role === "KEMENTERIAN" && parsed.data.kementerianId !== user.kementerianId) {
      return NextResponse.json(
        { error: "Anda hanya bisa membuat event untuk kementerian Anda sendiri" },
        { status: 403 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await prisma.event.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug sudah dipakai oleh event lain" },
        { status: 409 }
      );
    }

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        tanggalMulai: new Date(parsed.data.tanggalMulai),
        tanggalSelesai: new Date(parsed.data.tanggalSelesai),
      },
      include: {
        kementerian: { select: { nama: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
