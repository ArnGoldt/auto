import { db } from "@/db";
import { clients, orders, vehicles, workshops } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge, Card, EmptyState, PageTitle } from "@/components/ui-shell";

export default async function OrdersPage() {
  const { session } = await requireStaff();
  const rows = await db
    .select({
      order: orders,
      clientName: clients.fullName,
      vehicle: vehicles,
      workshopName: workshops.name,
    })
    .from(orders)
    .innerJoin(clients, eq(orders.clientId, clients.id))
    .innerJoin(vehicles, eq(orders.vehicleId, vehicles.id))
    .innerJoin(workshops, eq(orders.workshopId, workshops.id))
    .where(eq(orders.organizationId, session.organizationId))
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <PageTitle
        title="Заказы"
        description={`${rows.length} заказов в организации`}
      />
      {rows.length === 0 ? (
        <EmptyState title="Заказов пока нет" />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ order, clientName, vehicle, workshopName }) => (
            <li key={order.id}>
              <Card className="transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/app/orders/${order.id}`}
                      className="font-semibold text-[var(--navy-900)] underline-offset-2 hover:text-[var(--accent-hover)] hover:underline"
                    >
                      {clientName} · {vehicle.make} {vehicle.model}
                    </Link>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {workshopName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">продажа: {order.salesStage}</Badge>
                    <Badge variant="accent">цех: {order.productionStage}</Badge>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
