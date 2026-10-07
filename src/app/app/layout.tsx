import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "staff") {
    redirect("/login");
  }
  if (session.user.role === "MASTER") {
    redirect("/master");
  }

  return (
    <div className="flex min-h-screen">
      <AppNav />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-6 py-3 flex items-center justify-between bg-background">
          <div>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {session.user.role} · все филиалы
            </p>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
