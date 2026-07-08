import { NextResponse } from "next/server";
import { destroyMemberSession } from "@/lib/member-session";

export async function POST() {
  try {
    await destroyMemberSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Member logout error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
