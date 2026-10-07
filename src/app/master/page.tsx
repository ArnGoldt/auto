import { db } from "@/db";
import { clients, operations, orders, vehicles } from "@/db/schema";
import { requireMasterSession } from "@/lib/staff-data";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  operationBadgeVariant,
} from "@/components/ui-shell";

export default async function MasterHomePage() {
  const session = await requireMasterSession();

  const rows = await db
    .select({
      op: operations,
      order: orders,
      clientName: clients.fullName,
      vehicle: vehicles,
    })
    .from(operations)
    .innerJoin(orders, eq(operations.orderId, orders.id))
    .innerJoin(clients, eq(orders.clientId, clients.id))
    .innerJoin(vehicles, eq(orders.vehicleId, vehicles.id))
    .where(
      and(
        eq(operations.assigneeUserId, session.userId),
        eq(operations.status, "ASSIGNED"),
      ),
    )
    .orderBy(desc(operations.createdAt));

  const inProgress = await db.query.operations.findMany({
    where: and(
      eq(operations.assigneeUserId, session.userId),
      eq(operations.status, "IN_PROGRESS"),
    ),
  });

  const hasAny = rows.length > 0 || inProgress.length > 0;

  return (
    <div>
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        Откройте с телефона — чек-листы и фото прямо в цеху
      </p>
      {!hasAny ? (
        <div className="mt-4">
          <EmptyState
            title="Нет назначений"
            description="Новые работы появятся, когда менеджер назначит задачу"
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {inProgress.map((op) => (
            <li key={op.id}>
              <Link
                href={`/master/operations/${op.id}`}
                className="block min-h-[5rem] rounded-[var(--radius-xl)] border-2 border-[var(--accent)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] active:scale-[0.98] transition-transform"
              >
                <p className="font-bold text-[var(--navy-900)]">{op.title}</p>
                <div className="mt-2">
                  <Badge variant={operationBadgeVariant(op.status)}>
                    В работе
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
          {rows.map(({ op, clientName, vehicle }) => (
            <li key={op.id}>
              <Link
                href={`/master/operations/${op.id}`}
                className="block min-h-[5rem] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] active:scale-[0.98] transition-transform"
              >
                <p className="font-bold text-[var(--navy-900)]">{op.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {vehicle.make} {vehicle.model} · {clientName}
                </p>
                <div className="mt-2">
                  <Badge variant={operationBadgeVariant(op.status)}>
                    Назначено
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
