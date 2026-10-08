export const dynamic = "force-dynamic";

import { AppShell, Button } from "@/components/ui-shell";
import { requireStaff } from "@/lib/staff-data";
import { staffHomePath } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { staffLogout } from "@/app/actions/auth";

export default async function ManagerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user } = await requireStaff([
    "MANAGER",
    "NETWORK_ADMIN",
    "NETWORK_DIRECTOR",
    "BRANCH_DIRECTOR",
    "QC",
  ]);
  if (session.role === "MASTER") redirect(staffHomePath("MASTER"));

  const nav = [
    { href: "/app", label: "Обзор" },
    { href: "/app/clients", label: "Клиенты" },
    { href: "/app/inquiries", label: "Обращения" },
    { href: "/app/orders", label: "Заказы" },
    { href: "/app/promotions", label: "Акции" },
    { href: "/app/workshops", label: "Мастерские" },
    { href: "/app/director", label: "Показатели" },
  ];

  return (
    <AppShell
      title={user?.fullName ?? "Менеджер"}
      nav={nav}
      wide
      logoutSlot={
        <form action={staffLogout} className="mt-0.5">
          <Button type="submit" variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            Выйти
          </Button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}
