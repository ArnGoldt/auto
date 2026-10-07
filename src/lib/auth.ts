import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  memberships,
  clientAccounts,
  clients,
} from "@/db/schema";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "staff",
      name: "Staff",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });
        if (!user || !user.active) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const membership = await db.query.memberships.findFirst({
          where: eq(memberships.userId, user.id),
        });
        if (!membership) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          accountType: "staff" as const,
          role: membership.role,
          organizationId: user.organizationId,
          allBranches: membership.allBranches,
        };
      },
    }),
    Credentials({
      id: "client",
      name: "Client",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const login = credentials?.login as string;
        const password = credentials?.password as string;
        if (!login || !password) return null;

        const account = await db.query.clientAccounts.findFirst({
          where: eq(clientAccounts.login, login),
        });
        if (!account || !account.enabled) return null;

        const ok = await bcrypt.compare(password, account.passwordHash);
        if (!ok) return null;

        const client = await db.query.clients.findFirst({
          where: eq(clients.id, account.clientId),
        });
        if (!client) return null;

        return {
          id: account.id,
          email: account.login,
          name: client.fullName,
          accountType: "client" as const,
          organizationId: client.organizationId,
          clientId: client.id,
        };
      },
    }),
  ],
});

export async function requireStaffSession() {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "staff") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireManagerSession() {
  const session = await requireStaffSession();
  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireMasterSession() {
  const session = await requireStaffSession();
  if (session.user.role !== "MASTER" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireClientSession() {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "client") {
    throw new Error("Unauthorized");
  }
  return session;
}
