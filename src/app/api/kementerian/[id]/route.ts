import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { kementerianSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH: Update kementerian (SDM only)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = kementerianSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const kementerian = await prisma.kementerian.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ kementerian });
  } catch (error) {
    console.error("Update kementerian error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete kementerian (SDM only)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.kementerian.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete kementerian error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
