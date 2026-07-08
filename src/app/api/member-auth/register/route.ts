import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createMemberSession } from "@/lib/member-session";
import { normalizeNoWa } from "@/lib/validations";

/**
 * POST: Register a new member account (set password)
 * If member already exists by noWa, sets password for them.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noWa, nama, password, domisili, email, angkatanMj } = body;

    if (!noWa || !nama || !password) {
      return NextResponse.json(
        { error: "No. WA, nama, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const normalized = normalizeNoWa(noWa);
    const passwordHash = await bcrypt.hash(password, 10);

    let member = await prisma.member.findUnique({
      where: { noWa: normalized },
    });

    if (member) {
      // Member exists — set/update password
      if (member.passwordHash) {
        return NextResponse.json(
          { error: "Akun ini sudah memiliki password. Silakan login atau gunakan lupa password." },
          { status: 409 }
        );
      }

      member = await prisma.member.update({
        where: { id: member.id },
        data: {
          passwordHash,
          nama: nama || member.nama,
          domisili: domisili || member.domisili,
          email: email || member.email,
          angkatanMj: angkatanMj || member.angkatanMj,
        },
      });
    } else {
      // New member
      member = await prisma.member.create({
        data: {
          nama,
          noWa: normalized,
          passwordHash,
          domisili: domisili || "",
          email: email || null,
          angkatanMj: angkatanMj || null,
          statusKeanggotaan: "UMUM",
          statusApproval: "PENDING",
        },
      });
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
    }, { status: 201 });
  } catch (error) {
    console.error("Member register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
