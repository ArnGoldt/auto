import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.accountType === "staff") {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {session?.user?.accountType === "client" && (
        <header className="border-b px-4 py-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">Личный кабинет</p>
          </div>
          <SignOutButton />
        </header>
      )}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  );
}
