import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeNoWa } from "@/lib/validations";
import crypto from "crypto";

/**
 * POST: Request password reset — generates OTP and (optionally) sends via WAHA
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noWa } = body;

    if (!noWa) {
      return NextResponse.json(
        { error: "No. WA wajib diisi" },
        { status: 400 }
      );
    }

    const normalized = normalizeNoWa(noWa);

    const member = await prisma.member.findUnique({
      where: { noWa: normalized },
    });

    if (!member) {
      // Don't reveal if member exists
      return NextResponse.json({
        ok: true,
        message: "Jika nomor terdaftar, kode OTP sudah dikirim via WhatsApp.",
      });
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.member.update({
      where: { id: member.id },
      data: { otpCode, otpExpiry },
    });

    // TODO: Send OTP via WAHA
    // For now, log it (in production, call WAHA API)
    if (process.env.NODE_ENV === "development") {
      console.log(`[OTP] ${member.nama} (${normalized}): ${otpCode}`);
    }

    // WAHA integration example:
    // if (process.env.WAHA_URL) {
    //   await fetch(`${process.env.WAHA_URL}/api/send-text`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       chatId: `${normalized}@c.us`,
    //       text: `Kode OTP reset password Muda Juara: ${otpCode}\nBerlaku 10 menit.`,
    //     }),
    //   });
    // }

    return NextResponse.json({
      ok: true,
      message: "Jika nomor terdaftar, kode OTP sudah dikirim via WhatsApp.",
      ...(process.env.NODE_ENV === "development" ? { otp: otpCode } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
