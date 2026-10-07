export const dynamic = "force-dynamic";

import { AppShell } from "@/components/ui-shell";
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
    { href: "/app/workshops", label: "Мастерские" },
    { href: "/app/director", label: "Показатели" },
  ];

  return (
    <AppShell
      title={`Менеджер · ${user?.fullName ?? ""}`}
      nav={nav}
      wide
    >
      <form action={staffLogout} className="mb-4 text-right">
        <button type="submit" className="text-sm text-zinc-500 hover:underline">
          Выйти
        </button>
      </form>
      {children}
    </AppShell>
  );
}
