import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const STAFF_COOKIE = "auto_staff_session";
const CLIENT_COOKIE = "auto_client_session";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set");
  }
  return new TextEncoder().encode(s);
}

export type StaffSession = {
  type: "staff";
  userId: string;
  organizationId: string;
  role: string;
  allBranches: boolean;
  workshopId: string | null;
};

export type ClientSession = {
  type: "client";
  clientAccountId: string;
  clientId: string;
  organizationId: string;
};

async function sign(payload: object) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setStaffSession(data: Omit<StaffSession, "type">) {
  const token = await sign({ type: "staff", ...data });
  const jar = await cookies();
  jar.set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function setClientSession(data: Omit<ClientSession, "type">) {
  const token = await sign({ type: "client", ...data });
  const jar = await cookies();
  jar.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearStaffSession() {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE);
}

export async function clearClientSession() {
  const jar = await cookies();
  jar.delete(CLIENT_COOKIE);
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.type !== "staff") return null;
    return payload as unknown as StaffSession;
  } catch {
    return null;
  }
}

export async function getClientSession(): Promise<ClientSession | null> {
  const jar = await cookies();
  const token = jar.get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.type !== "client") return null;
    return payload as unknown as ClientSession;
  } catch {
    return null;
  }
}
