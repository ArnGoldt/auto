export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireMasterSession } from "@/lib/staff-data";
import { staffLogout } from "@/app/actions/auth";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMasterSession();

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-zinc-100 pb-20">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Мастер</p>
            <h1 className="text-lg font-semibold">Мои работы</h1>
          </div>
          <form action={staffLogout}>
            <button type="submit" className="text-sm text-blue-700">
              Выйти
            </button>
          </form>
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex max-w-lg justify-around py-3 text-sm font-medium">
          <Link href="/master">Назначения</Link>
        </div>
      </nav>
    </div>
  );
}
