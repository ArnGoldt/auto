import { db } from "@/db";
import { inquiries, managerReminders, orders, workshops } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";

export default async function AppDashboardPage() {
  const { session } = await requireStaff();
  const allWorkshops = await db.query.workshops.findMany({
    where: eq(workshops.organizationId, session.organizationId),
  });

  const openOrders = await db.select({ c: count() }).from(orders);
  const openLeads = await db
    .select({ c: count() })
    .from(inquiries)
    .where(eq(inquiries.stage, "NEW"));

  const reminders = await db.query.managerReminders.findMany({
    where: and(
      eq(managerReminders.organizationId, session.organizationId),
      eq(managerReminders.resolved, false),
    ),
    limit: 5,
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Сеть мастерских</h2>
        <p className="text-sm text-zinc-600">
          Обзор по всем филиалам ({allWorkshops.length})
        </p>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {allWorkshops.map((w) => (
            <li key={w.id} className="rounded-xl border bg-white p-4">
              <p className="font-medium">{w.name}</p>
              <p className="text-sm text-zinc-600">{w.address}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Заказов в системе</p>
          <p className="text-2xl font-semibold">{openOrders[0]?.c ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Новых обращений</p>
          <p className="text-2xl font-semibold">{openLeads[0]?.c ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Напоминания</p>
          <p className="text-2xl font-semibold">{reminders.length}</p>
        </div>
      </section>

      <section>
        <h3 className="font-medium">Ближайшие задачи менеджера</h3>
        <ul className="mt-2 space-y-2">
          {reminders.map((r) => (
            <li key={r.id} className="rounded-lg border bg-white px-3 py-2 text-sm">
              {r.kind} · до {r.dueAt.toLocaleString("ru-RU")}
            </li>
          ))}
          {reminders.length === 0 && (
            <li className="text-sm text-zinc-500">Нет просроченных напоминаний</li>
          )}
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/app/inquiries" className="text-blue-700 hover:underline">
          Перейти к обращениям →
        </Link>
      </p>
    </div>
  );
}
