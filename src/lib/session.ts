import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  role: "SDM" | "MENKEU" | "KEMENTERIAN" | "BENDAHARA";
  kementerianId?: string;
  nama: string;
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: "mj-finance-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export async function createSession(data: Omit<SessionData, "isLoggedIn">): Promise<void> {
  const session = await getSession();
  session.userId = data.userId;
  session.role = data.role;
  session.kementerianId = data.kementerianId;
  session.nama = data.nama;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

/**
 * Get session data for authorization checks.
 * Returns null if not logged in.
 */
export async function getAuthUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return {
    userId: session.userId,
    role: session.role,
    kementerianId: session.kementerianId,
    nama: session.nama,
    isLoggedIn: true,
  };
}
