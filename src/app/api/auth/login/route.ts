import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    const rl = checkRateLimit(ip, { ...RATE_LIMITS.login, key: "login" });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.adminUser.findUnique({
      where: { email },
      include: { kementerian: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      role: user.role,
      kementerianId: user.kementerianId || undefined,
      nama: user.nama,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        kementerianId: user.kementerianId,
        kementerian: user.kementerian,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2021"
    ) {
      return NextResponse.json(
        { error: "Database belum siap. Coba lagi beberapa saat setelah deploy." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
