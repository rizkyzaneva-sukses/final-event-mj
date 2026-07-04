import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeNoWa } from "@/lib/validations";

/**
 * Public endpoint: Lookup member by No. WA
 * Used by registration form to auto-fill data
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
        noWa: member.noWa,
        domisili: member.domisili,
        email: member.email,
        angkatanMj: member.angkatanMj,
        statusKeanggotaan: member.statusKeanggotaan,
        tanggungan: member.tanggungan.map((t) => ({
          id: t.id,
          nama: t.nama,
          tanggalLahir: t.tanggalLahir,
          hubungan: t.hubungan,
        })),
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
