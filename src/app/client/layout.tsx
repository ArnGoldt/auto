import Link from "next/link";
import { getClientSession } from "@/lib/session";
import { clientLogout } from "@/app/actions/auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-semibold">Личный кабинет</h1>
          {session ? (
            <form action={clientLogout}>
              <button type="submit" className="text-sm text-blue-700">
                Выйти
              </button>
            </form>
          ) : (
            <Link href="/client/login" className="text-sm text-blue-700">
              Войти
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
