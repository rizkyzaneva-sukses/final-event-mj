import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { hargaTierSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; tid: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || !["SDM", "KEMENTERIAN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, tid } = await params;

  // Verify event ownership for KEMENTERIAN
  if (user.role === "KEMENTERIAN") {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.kementerianId !== user.kementerianId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = await request.json();
    const parsed = hargaTierSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tier = await prisma.hargaTier.update({
      where: { id: tid },
      data: parsed.data,
    });

    return NextResponse.json({ tier });
  } catch (error) {
    console.error("Update harga tier error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || !["SDM", "KEMENTERIAN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, tid } = await params;

  // Verify event ownership for KEMENTERIAN
  if (user.role === "KEMENTERIAN") {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.kementerianId !== user.kementerianId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    await prisma.hargaTier.delete({ where: { id: tid } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete harga tier error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
