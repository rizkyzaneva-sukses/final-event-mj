import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeNoWa } from "@/lib/validations";

/**
 * POST: Reset password using OTP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noWa, otpCode, newPassword } = body;

    if (!noWa || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "No. WA, kode OTP, dan password baru wajib diisi" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    const normalized = normalizeNoWa(noWa);

    const member = await prisma.member.findUnique({
      where: { noWa: normalized },
    });

    if (!member || !member.otpCode || !member.otpExpiry) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid atau sudah kedaluwarsa" },
        { status: 400 }
      );
    }

    if (member.otpCode !== otpCode) {
      return NextResponse.json(
        { error: "Kode OTP salah" },
        { status: 400 }
      );
    }

    if (new Date() > member.otpExpiry) {
      return NextResponse.json(
        { error: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.member.update({
      where: { id: member.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
