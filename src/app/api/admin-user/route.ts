import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { adminUserCreateSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

/**
 * GET: List admin users (SDM only)
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        kementerianId: true,
        kementerian: { select: { nama: true } },
        _count: { select: { bendaharaAssignment: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("List admin users error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create admin user (SDM only)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = adminUserCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const adminUser = await prisma.adminUser.create({
      data: {
        nama: parsed.data.nama,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        kementerianId: parsed.data.kementerianId || null,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        kementerianId: true,
      },
    });

    return NextResponse.json({ user: adminUser }, { status: 201 });
  } catch (error) {
    console.error("Create admin user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
