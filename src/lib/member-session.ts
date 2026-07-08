import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface MemberSessionData {
  memberId: string;
  nama: string;
  noWa: string;
  statusKeanggotaan: string;
  statusApproval: string;
  isLoggedIn: boolean;
}

function getPassword(): string {
  const password = process.env.IRON_SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("IRON_SESSION_PASSWORD must be set and at least 32 characters.");
  }
  return password;
}

const sessionOptions = {
  get password() { return getPassword(); },
  cookieName: "member-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getMemberSession(): Promise<IronSession<MemberSessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<MemberSessionData>(cookieStore, sessionOptions);
  return session;
}

export async function createMemberSession(data: Omit<MemberSessionData, "isLoggedIn">): Promise<void> {
  const session = await getMemberSession();
  session.memberId = data.memberId;
  session.nama = data.nama;
  session.noWa = data.noWa;
  session.statusKeanggotaan = data.statusKeanggotaan;
  session.statusApproval = data.statusApproval;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroyMemberSession(): Promise<void> {
  const session = await getMemberSession();
  session.destroy();
}

export async function getAuthMember(): Promise<MemberSessionData | null> {
  const session = await getMemberSession();
  if (!session.isLoggedIn) return null;
  return {
    memberId: session.memberId,
    nama: session.nama,
    noWa: session.noWa,
    statusKeanggotaan: session.statusKeanggotaan,
    statusApproval: session.statusApproval,
    isLoggedIn: true,
  };
}
