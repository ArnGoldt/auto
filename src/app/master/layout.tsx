import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "staff") {
    redirect("/login");
  }
  if (session.user.role !== "MASTER" && session.user.role !== "ADMIN") {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-lg mx-auto border-x">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">Мастер</p>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t bg-background flex">
        <Link
          href="/master"
          className="flex-1 py-4 text-center text-sm font-medium min-h-[56px] flex items-center justify-center"
        >
          Назначения
        </Link>
      </nav>
    </div>
  );
}
