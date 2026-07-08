import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createMemberSession } from "@/lib/member-session";
import { normalizeNoWa } from "@/lib/validations";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, { ...RATE_LIMITS.login, key: "member-login" });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { noWa, password } = body;

    if (!noWa || !password) {
      return NextResponse.json(
        { error: "No. WA dan password wajib diisi" },
        { status: 400 }
      );
    }

    const normalized = normalizeNoWa(noWa);

    const member = await prisma.member.findUnique({
      where: { noWa: normalized },
    });

    if (!member) {
      return NextResponse.json(
        { error: "No. WA atau password salah" },
        { status: 401 }
      );
    }

    if (!member.passwordHash) {
      return NextResponse.json(
        { error: "Akun belum memiliki password. Silakan daftar ulang atau reset password." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "No. WA atau password salah" },
        { status: 401 }
      );
    }

    await createMemberSession({
      memberId: member.id,
      nama: member.nama,
      noWa: member.noWa,
      statusKeanggotaan: member.statusKeanggotaan,
      statusApproval: member.statusApproval,
    });

    return NextResponse.json({
      member: {
        id: member.id,
        nama: member.nama,
        noWa: member.noWa,
        statusKeanggotaan: member.statusKeanggotaan,
        statusApproval: member.statusApproval,
      },
    });
  } catch (error) {
    console.error("Member login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
