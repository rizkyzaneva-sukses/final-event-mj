import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pembayaranUploadSchema } from "@/lib/validations";

/**
 * POST: Upload payment proof (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = pembayaranUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { registrasiId, buktiTransferUrl, noReferensi } = parsed.data;

    if (!buktiTransferUrl && !noReferensi) {
      return NextResponse.json(
        { error: "Upload bukti transfer atau isi No. Referensi" },
        { status: 400 }
      );
    }

    const pembayaran = await prisma.pembayaran.findUnique({
      where: { registrasiId },
    });

    if (!pembayaran) {
      return NextResponse.json(
        { error: "Data pembayaran tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.pembayaran.update({
      where: { id: pembayaran.id },
      data: {
        buktiTransferUrl: buktiTransferUrl || pembayaran.buktiTransferUrl,
        noReferensi: noReferensi || pembayaran.noReferensi,
        status: "BELUM_DIVERIFIKASI",
      },
    });

    return NextResponse.json({ pembayaran: updated });
  } catch (error) {
    console.error("Upload payment proof error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
