import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeNoWa } from "@/lib/validations";

/**
 * Public endpoint: Lookup member by No. WA
 * Returns only data needed for auto-filling the registration form
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawNoWa = searchParams.get("noWa");

    if (!rawNoWa) {
      return NextResponse.json(
        { error: "Parameter noWa wajib diisi" },
        { status: 400 }
      );
    }

    const noWa = normalizeNoWa(rawNoWa);

    const member = await prisma.member.findUnique({
      where: { noWa },
      include: {
        tanggungan: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            nama: true,
            hubungan: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ found: false, member: null });
    }

    return NextResponse.json({
      found: true,
      member: {
        id: member.id,
        nama: member.nama,
        domisili: member.domisili,
        email: member.email,
        angkatanMj: member.angkatanMj,
        statusKeanggotaan: member.statusKeanggotaan,
        tanggungan: member.tanggungan,
      },
    });
  } catch (error) {
    console.error("Member lookup error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
