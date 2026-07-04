import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { tanggunganUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; tid: string }> };

/**
 * PATCH: Update tanggungan (admin only)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tid } = await params;

  try {
    const body = await request.json();
    const parsed = tanggunganUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tanggungan = await prisma.tanggungan.update({
      where: { id: tid },
      data: {
        ...parsed.data,
        tanggalLahir: parsed.data.tanggalLahir || undefined,
      },
    });

    return NextResponse.json({ tanggungan });
  } catch (error) {
    console.error("Update tanggungan error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove tanggungan (admin only)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tid } = await params;

  try {
    await prisma.tanggungan.delete({ where: { id: tid } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete tanggungan error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
