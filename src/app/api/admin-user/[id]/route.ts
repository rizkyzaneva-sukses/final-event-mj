import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { adminUserUpdateSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH: Update admin user (SDM only)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Prevent self-deletion via role change
    if (id === user.userId) {
      return NextResponse.json(
        { error: "Tidak bisa mengedit akun sendiri" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.password) {
      updateData.passwordHash = await bcrypt.hash(parsed.data.password, 10);
      delete updateData.password;
    }

    const adminUser = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        kementerianId: true,
      },
    });

    return NextResponse.json({ user: adminUser });
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete admin user (SDM only)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user || user.role !== "SDM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Prevent self-deletion
    if (id === user.userId) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    // Check if user has any bendahara assignments
    const assignmentCount = await prisma.bendaharaAssignment.count({
      where: { adminUserId: id },
    });

    if (assignmentCount > 0) {
      await prisma.bendaharaAssignment.deleteMany({
        where: { adminUserId: id },
      });
    }

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete admin user error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
