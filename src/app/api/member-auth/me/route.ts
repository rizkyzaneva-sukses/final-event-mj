import { NextResponse } from "next/server";
import { getAuthMember } from "@/lib/member-session";

export async function GET() {
  try {
    const member = await getAuthMember();
    if (!member) {
      return NextResponse.json({ member: null });
    }
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ member: null });
  }
}
