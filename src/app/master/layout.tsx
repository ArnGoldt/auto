export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireMasterSession } from "@/lib/staff-data";
import { staffLogout } from "@/app/actions/auth";
import { BrandMark, Button } from "@/components/ui-shell";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMasterSession();

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--background)] pb-24">
      <header className="sticky top-0 z-20 border-b border-[var(--navy-800)] bg-[var(--navy-900)] text-white shadow-md">
        <div className="flex min-h-[3.75rem] items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                Мастер
              </p>
              <h1 className="truncate text-base font-bold">Мои работы</h1>
            </div>
          </div>
          <form action={staffLogout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="min-h-11 min-w-[4.5rem] text-slate-300 hover:text-white"
            >
              Выйти
            </Button>
          </form>
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(12_18_34_/0.08)]"
        aria-label="Навигация мастера"
      >
        <div className="mx-auto flex max-w-lg">
          <Link
            href="/master"
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[var(--navy-900)]"
          >
            <span className="text-lg leading-none" aria-hidden>
              📋
            </span>
            Назначения
          </Link>
        </div>
      </nav>
    </div>
  );
}
