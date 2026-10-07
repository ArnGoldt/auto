import { db } from "@/db";
import { clients, orders, vehicles, workshops } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui-shell";

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
      <h2 className="text-xl font-semibold">Заказы</h2>
      <ul className="mt-4 space-y-3">
        {rows.map(({ order, clientName, vehicle, workshopName }) => (
          <li key={order.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <Link href={`/app/orders/${order.id}`} className="font-medium text-blue-700">
                  {clientName} · {vehicle.make} {vehicle.model}
                </Link>
                <p className="text-sm text-zinc-600">{workshopName}</p>
              </div>
              <div className="flex gap-2">
                <Badge>продажа: {order.salesStage}</Badge>
                <Badge>цех: {order.productionStage}</Badge>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
