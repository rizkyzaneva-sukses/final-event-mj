import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
