import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { memberUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * Admin: Get member detail with tanggungan and registration history
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        tanggungan: { orderBy: { createdAt: "asc" } },
        registrasi: {
          include: {
            event: { select: { id: true, nama: true, slug: true, tanggalMulai: true } },
            pembayaran: { select: { status: true, jumlahTagihan: true } },
            peserta: {
              include: {
                tanggungan: { select: { nama: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Get member error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * Admin: Update member data
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = memberUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const member = await prisma.member.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
