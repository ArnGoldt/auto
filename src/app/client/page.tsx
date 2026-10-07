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
import { Button, Badge, Card, EmptyState } from "@/components/ui-shell";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--navy-900)]">
          Здравствуйте, {client?.fullName}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ваши ремонты в сети мастерских
        </p>
      </div>

      {orderViews.length === 0 && (
        <EmptyState
          title="Пока нет активных заказов"
          description="Когда мастерская оформит заказ, статус появится здесь"
        />
      )}

      {orderViews.map(
        ({ order, vehicle, workshop, events, pendingSupps, total }) => (
          <Card key={order.id} padding="lg">
            <h3 className="text-lg font-bold text-[var(--navy-900)]">
              {vehicle?.make} {vehicle?.model}
              <span className="font-normal text-[var(--muted)]">
                {" "}
                · {workshop?.name}
              </span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="accent">сейчас: {order.productionStage}</Badge>
              <Badge variant="info">
                выдача:{" "}
                {order.promisedDateCurrent?.toLocaleDateString("ru-RU") ?? "—"}
              </Badge>
              <Badge variant="success">к оплате: {formatRub(total)}</Badge>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] bg-[var(--surface-muted)] p-4 text-sm">
                <p className="font-semibold text-[var(--navy-900)]">
                  Что сделано / лента
                </p>
                <ul className="mt-3 space-y-2 text-[var(--muted-foreground)]">
                  {events.slice(0, 5).map((e) => (
                    <li key={e.id} className="border-b border-[var(--border-subtle)] pb-2 last:border-0">
                      {e.title}{" "}
                      <span className="text-xs text-[var(--muted)]">
                        {e.createdAt.toLocaleString("ru-RU")}
                      </span>
                    </li>
                  ))}
                  {events.length === 0 && (
                    <li className="text-[var(--muted)]">
                      Ожидайте подтверждённых событий
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-[var(--radius-lg)] bg-[var(--surface-muted)] p-4 text-sm">
                <p className="font-semibold text-[var(--navy-900)]">
                  Нужно ваше решение
                </p>
                {pendingSupps.length === 0 && (
                  <p className="mt-3 text-[var(--muted)]">
                    Нет ожидающих согласований
                  </p>
                )}
                {pendingSupps.map((s) => (
                  <div
                    key={s.id}
                    className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3"
                  >
                    <p className="text-[var(--navy-800)]">{s.reason}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-[var(--navy-900)]">
                      {formatRub(s.priceDeltaRub)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={decideSupplement}>
                        <input type="hidden" name="supplementId" value={s.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <Button type="submit" size="sm">
                          Согласовать
                        </Button>
                      </form>
                      <form action={decideSupplement}>
                        <input type="hidden" name="supplementId" value={s.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <Button type="submit" variant="secondary" size="sm">
                          Отклонить
                        </Button>
                      </form>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Не ЭП — фиксируется факт нажатия
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ),
      )}
    </div>
  );
}
