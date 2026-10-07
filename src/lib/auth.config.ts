import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      if (path.startsWith("/app") || path.startsWith("/master")) {
        if (!isLoggedIn) return false;
        const accountType = (auth?.user as { accountType?: string })?.accountType;
        if (accountType === "client") return Response.redirect(new URL("/client", nextUrl));
        if (path.startsWith("/master")) {
          const role = (auth?.user as { role?: string })?.role;
          if (role !== "MASTER" && role !== "ADMIN") {
            return Response.redirect(new URL("/app", nextUrl));
          }
        }
        if (path.startsWith("/app")) {
          const role = (auth?.user as { role?: string })?.role;
          if (role === "MASTER") {
            return Response.redirect(new URL("/master", nextUrl));
          }
        }
      }

      if (path.startsWith("/client") && !path.startsWith("/client/login")) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/client/login", nextUrl));
        }
        const accountType = (auth?.user as { accountType?: string })?.accountType;
        if (accountType !== "client") return Response.redirect(new URL("/app", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.accountType = user.accountType;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.userId = user.id;
        token.clientId = user.clientId;
        token.allBranches = user.allBranches;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.accountType = token.accountType as "staff" | "client";
        session.user.role = token.role as string | undefined;
        session.user.organizationId = token.organizationId as string;
        session.user.clientId = token.clientId as string | undefined;
        session.user.allBranches = token.allBranches as boolean | undefined;
      }
      return session;
    },
  },
  providers: [],
};
