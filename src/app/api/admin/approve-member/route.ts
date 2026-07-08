import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

/**
 * GET: List members pending approval (SDM only)
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const members = await prisma.member.findMany({
      where: { statusApproval: "PENDING" },
      select: {
        id: true,
        nama: true,
        noWa: true,
        domisili: true,
        email: true,
        angkatanMj: true,
        statusKeanggotaan: true,
        createdAt: true,
        _count: { select: { registrasi: true, tanggungan: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("List pending members error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Approve or reject a member (SDM only)
 */
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { memberId, action } = body;

    if (!memberId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "memberId dan action (approve/reject) wajib diisi" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: {
        statusApproval: newStatus,
        statusKeanggotaan: action === "approve" ? "MEMBER" : member.statusKeanggotaan,
      },
      select: {
        id: true,
        nama: true,
        noWa: true,
        statusApproval: true,
        statusKeanggotaan: true,
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Approve member error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
