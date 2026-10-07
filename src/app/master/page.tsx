import { db } from "@/db";
import { clients, operations, orders, vehicles } from "@/db/schema";
import { requireMasterSession } from "@/lib/staff-data";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui-shell";

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

  const all = [...inProgress.map((op) => ({ op, partial: true })), ...rows.map((r) => ({ ...r, partial: false }))];

  return (
    <div>
      <p className="text-sm text-zinc-600">
        Откройте с телефона — чек-листы и фото
      </p>
      <ul className="mt-4 space-y-3">
        {all.length === 0 && (
          <li className="rounded-xl border bg-white p-6 text-center text-zinc-500">
            Нет назначений
          </li>
        )}
        {rows.map(({ op, clientName, vehicle }) => (
          <li key={op.id}>
            <Link
              href={`/master/operations/${op.id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm active:scale-[0.99]"
            >
              <p className="font-semibold">{op.title}</p>
              <p className="text-sm text-zinc-600">
                {vehicle.make} {vehicle.model} · {clientName}
              </p>
              <div className="mt-2">
                <Badge>{op.status}</Badge>
              </div>
            </Link>
          </li>
        ))}
        {inProgress.map((op) => (
          <li key={op.id}>
            <Link
              href={`/master/operations/${op.id}`}
              className="block rounded-xl border-2 border-blue-600 bg-white p-4"
            >
              <p className="font-semibold">{op.title}</p>
              <Badge>IN_PROGRESS</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
