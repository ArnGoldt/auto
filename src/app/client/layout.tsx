import Link from "next/link";
import { getClientSession } from "@/lib/session";
import { clientLogout } from "@/app/actions/auth";
import { Button, ClientChrome } from "@/components/ui-shell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();

  return (
    <ClientChrome
      headerRight={
        session ? (
          <form action={clientLogout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
            >
              Выйти
            </Button>
          </form>
        ) : (
          <Link
            href="/client/login"
            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-amber-400 hover:text-amber-300"
          >
            Войти
          </Link>
        )
      }
    >
      {children}
    </ClientChrome>
  );
}
