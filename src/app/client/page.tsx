export const dynamic = "force-dynamic";

import { decideSupplement } from "@/app/actions/client-portal";
import { db } from "@/db";
import {
  clients,
  estimateLines,
  estimateVersions,
  orderEvents,
  orders,
  supplements,
  vehicles,
  workshops,
} from "@/db/schema";
import { getClientSession } from "@/lib/session";
import { formatRub } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button, Badge } from "@/components/ui-shell";

export default async function ClientHomePage() {
  const session = await getClientSession();
  if (!session) redirect("/client/login");

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, session.clientId),
  });

  const clientOrders = await db.query.orders.findMany({
    where: eq(orders.clientId, session.clientId),
    orderBy: [desc(orders.createdAt)],
  });

  const orderViews = await Promise.all(
    clientOrders.map(async (order) => {
      const [vehicle, workshop, events, pendingSupps, est] = await Promise.all([
        db.query.vehicles.findFirst({ where: eq(vehicles.id, order.vehicleId) }),
        db.query.workshops.findFirst({ where: eq(workshops.id, order.workshopId) }),
        db.query.orderEvents.findMany({
          where: eq(orderEvents.orderId, order.id),
          orderBy: [desc(orderEvents.createdAt)],
        }),
        db.query.supplements.findMany({
          where: eq(supplements.orderId, order.id),
        }),
        db.query.estimateVersions.findFirst({
          where: eq(estimateVersions.orderId, order.id),
          orderBy: [desc(estimateVersions.versionNumber)],
        }),
      ]);
      const lines = est
        ? await db.query.estimateLines.findMany({
            where: eq(estimateLines.estimateVersionId, est.id),
          })
        : [];
      const total = lines.reduce((s, l) => s + l.priceRub, 0);
      return {
        order,
        vehicle,
        workshop,
        events: events.filter((e) => e.visibleToClient),
        pendingSupps: pendingSupps.filter((s) => s.status === "PENDING_CLIENT"),
        total,
      };
    }),
  );

  const primary = orderViews[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Здравствуйте, {client?.fullName}</h2>
        <p className="text-sm text-zinc-600">Ваши ремонты в сети мастерских</p>
      </div>

      {!primary && (
        <p className="rounded-xl border bg-white p-6 text-zinc-600">
          Пока нет активных заказов
        </p>
      )}

      {orderViews.map(
        ({ order, vehicle, workshop, events, pendingSupps, total }) => (
          <section key={order.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">
              {vehicle?.make} {vehicle?.model} · {workshop?.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Badge>сейчас: {order.productionStage}</Badge>
              <Badge>
                выдача: {order.promisedDateCurrent?.toLocaleDateString("ru-RU") ?? "—"}
              </Badge>
              <Badge>к оплате (смета): {formatRub(total)}</Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                <p className="font-medium">Что сделано / лента</p>
                <ul className="mt-2 space-y-1 text-zinc-700">
                  {events.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      {e.title}{" "}
                      <span className="text-xs text-zinc-500">
                        {e.createdAt.toLocaleString("ru-RU")}
                      </span>
                    </li>
                  ))}
                  {events.length === 0 && <li>Ожидайте подтверждённых событий</li>}
                </ul>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                <p className="font-medium">Нужно ваше решение</p>
                {pendingSupps.length === 0 && (
                  <p className="mt-2 text-zinc-600">Нет ожидающих согласований</p>
                )}
                {pendingSupps.map((s) => (
                  <div key={s.id} className="mt-2 rounded border bg-white p-3">
                    <p>{s.reason}</p>
                    <p className="font-medium">{formatRub(s.priceDeltaRub)}</p>
                    <div className="mt-2 flex gap-2">
                      <form action={decideSupplement}>
                        <input type="hidden" name="supplementId" value={s.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <Button type="submit" className="py-2 text-xs">
                          Согласовать
                        </Button>
                      </form>
                      <form action={decideSupplement}>
                        <input type="hidden" name="supplementId" value={s.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <Button type="submit" variant="secondary" className="py-2 text-xs">
                          Отклонить
                        </Button>
                      </form>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">Не ЭП — фиксируется факт нажатия</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ),
      )}
    </div>
  );
}
