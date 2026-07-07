import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { pembayaranVerifySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH: Verify/update payment status (MENKEU+ or assigned Bendahara only)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only MENKEU and SDM can verify payments globally
  // BENDAHARA role check could be added per-event if needed
  if (!["SDM", "MENKEU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = pembayaranVerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pembayaran = await prisma.pembayaran.update({
      where: { id },
      data: {
        status: parsed.data.status,
        verifiedBy: parsed.data.status === "TERVERIFIKASI" ? user.userId : null,
        verifiedAt: parsed.data.status === "TERVERIFIKASI" ? new Date() : null,
      },
    });

    return NextResponse.json({ pembayaran });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
