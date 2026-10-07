import { db } from "@/db";
import { inquiries, managerReminders, orders, workshops } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  PageTitle,
  StatCard,
} from "@/components/ui-shell";

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
      <PageTitle
        title="Обзор сети"
        description={`${allWorkshops.length} филиалов · показатели в реальном времени`}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Заказов в системе" value={openOrders[0]?.c ?? 0} accent="blue" />
        <StatCard label="Новых обращений" value={openLeads[0]?.c ?? 0} accent="amber" />
        <StatCard label="Активных напоминаний" value={reminders.length} accent="green" />
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Мастерские
        </h3>
        <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {allWorkshops.map((w) => (
            <li key={w.id}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <p className="font-semibold text-[var(--navy-900)]">{w.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  {w.address}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Ближайшие задачи
        </h3>
        {reminders.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Нет просроченных напоминаний"
              description="Новые задачи появятся здесь автоматически"
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {reminders.map((r) => (
              <li key={r.id}>
                <Card padding="sm" className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{r.kind}</span>
                  <Badge variant="warning">
                    до {r.dueAt.toLocaleString("ru-RU")}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm">
        <Link
          href="/app/inquiries"
          className="font-semibold text-[var(--navy-800)] underline-offset-2 hover:text-[var(--accent-hover)] hover:underline"
        >
          Перейти к обращениям →
        </Link>
      </p>
    </div>
  );
}
