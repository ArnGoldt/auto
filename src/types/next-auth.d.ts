import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    accountType: "staff" | "client";
    role?: string;
    organizationId: string;
    clientId?: string;
    allBranches?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      accountType: "staff" | "client";
      role?: string;
      organizationId: string;
      clientId?: string;
      allBranches?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountType?: "staff" | "client";
    role?: string;
    organizationId?: string;
    userId?: string;
    clientId?: string;
    allBranches?: boolean;
  }
}
