import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { tanggunganCreateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * GET: List tanggungan for a member (admin only, or during active registration via registrasiId cookie)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tanggungan = await prisma.tanggungan.findMany({
      where: { memberId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ tanggungan });
  } catch (error) {
    console.error("List tanggungan error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * POST: Add tanggungan to a member (admin only — during registration handled by /api/registrasi)
 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = tanggunganCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    const tanggungan = await prisma.tanggungan.create({
      data: {
        memberId: id,
        nama: parsed.data.nama,
        tanggalLahir: parsed.data.tanggalLahir || null,
        hubungan: parsed.data.hubungan,
      },
    });

    return NextResponse.json({ tanggungan }, { status: 201 });
  } catch (error) {
    console.error("Create tanggungan error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
