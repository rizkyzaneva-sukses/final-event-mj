import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { kementerianSchema } from "@/lib/validations";

/**
 * GET: List all kementerian
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const kementerian = await prisma.kementerian.findMany({
      include: {
        _count: { select: { event: true, adminUser: true } },
      },
      orderBy: { kodeUnik: "asc" },
    });

    return NextResponse.json({ kementerian });
  } catch (error) {
    console.error("List kementerian error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create kementerian (SDM only)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = kementerianSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.kementerian.findUnique({
      where: { kodeUnik: parsed.data.kodeUnik },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Kode unik sudah dipakai" },
        { status: 409 }
      );
    }

    const kementerian = await prisma.kementerian.create({
      data: parsed.data,
    });

    return NextResponse.json({ kementerian }, { status: 201 });
  } catch (error) {
    console.error("Create kementerian error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
