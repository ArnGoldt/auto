import {
  addEstimateVersion,
  assignOperation,
  createOperationWithChecklist,
  createSupplement,
} from "@/app/actions/manager";
import {
  applyPromotionToOrder,
  markOrderDelivered,
} from "@/app/actions/promotions";
import { approveQc } from "@/app/actions/qc";
import { db } from "@/db";
import {
  clients,
  estimateLines,
  estimateVersions,
  operations,
  orders,
  staffUsers,
  supplements,
  vehicles,
  workshops,
  memberships,
} from "@/db/schema";
import { Badge, Button, Field, Input, Textarea } from "@/components/ui-shell";
import { requireStaff } from "@/lib/staff-data";
import { formatRub } from "@/lib/utils";
import { estimateGrandTotalRub, estimateWorkSubtotalRub } from "@/lib/rules";
import { listApplicablePromotionsForOrder } from "@/lib/promotions-query";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) return <p>Заказ не найден</p>;

  const [client, vehicle, workshop] = await Promise.all([
    db.query.clients.findFirst({ where: eq(clients.id, order.clientId) }),
    db.query.vehicles.findFirst({ where: eq(vehicles.id, order.vehicleId) }),
    db.query.workshops.findFirst({ where: eq(workshops.id, order.workshopId) }),
  ]);

  const estimates = await db.query.estimateVersions.findMany({
    where: eq(estimateVersions.orderId, id),
    orderBy: [desc(estimateVersions.versionNumber)],
  });
  const latest = estimates[0];
  const lines = latest
    ? await db.query.estimateLines.findMany({
        where: eq(estimateLines.estimateVersionId, latest.id),
      })
    : [];

  const subtotal = estimateWorkSubtotalRub(lines);
  const total = estimateGrandTotalRub(lines);
  const activePromos = await listApplicablePromotionsForOrder(
    order.organizationId,
    order.workshopId,
  );
  const ops = await db.query.operations.findMany({
    where: eq(operations.orderId, id),
  });
  const supps = await db.query.supplements.findMany({
    where: eq(supplements.orderId, id),
  });

  const masters = await db
    .select({ user: staffUsers })
    .from(staffUsers)
    .innerJoin(memberships, eq(memberships.userId, staffUsers.id))
    .where(
      and(
        eq(memberships.organizationId, order.organizationId),
        eq(memberships.role, "MASTER"),
      ),
    );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          {client?.fullName} · {vehicle?.make} {vehicle?.model}
        </h2>
        <p className="text-zinc-600">
          {workshop?.name} · выдача{" "}
          {order.promisedDateCurrent?.toLocaleDateString("ru-RU")} (изначально{" "}
          {order.promisedDateOriginal?.toLocaleDateString("ru-RU")})
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>продажа: {order.salesStage}</Badge>
          <Badge>производство: {order.productionStage}</Badge>
          {order.productionStage !== "DELIVERED" && (
            <form action={markOrderDelivered}>
              <input type="hidden" name="orderId" value={id} />
              <Button type="submit" size="sm" variant="secondary">
                Выдать авто (начислить баллы)
              </Button>
            </form>
          )}
        </div>
        <Link href={`/app/clients/${order.clientId}`} className="mt-2 inline-block text-sm text-blue-700">
          Карточка клиента и доступ в ЛК →
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-medium">Смета {latest ? `(v${latest.versionNumber})` : ""}</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {lines.map((l) => (
            <li
              key={l.id}
              className={`flex justify-between gap-4 ${l.lineKind === "DISCOUNT" ? "text-emerald-700" : ""}`}
            >
              <span>
                {l.zone ? `${l.zone}: ` : ""}
                {l.operation}
              </span>
              <span>{formatRub(l.priceRub)}</span>
            </li>
          ))}
        </ul>
        {subtotal !== total && (
          <p className="mt-2 text-sm text-zinc-600">
            Работы: {formatRub(subtotal)} · скидка: {formatRub(total - subtotal)}
          </p>
        )}
        <p className="mt-2 font-semibold">Итого: {formatRub(total)}</p>
        <div className="mt-4 space-y-3 rounded-lg border border-dashed p-3">
          <p className="text-sm font-medium">Скидка / акция</p>
          <form action={applyPromotionToOrder} className="flex flex-wrap gap-2">
            <input type="hidden" name="orderId" value={id} />
            <select name="promotionId" className="rounded border px-2 py-1 text-sm">
              <option value="">Выберите акцию</option>
              {activePromos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.code ? ` (${p.code})` : ""}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">
              Применить
            </Button>
          </form>
          <form action={applyPromotionToOrder} className="flex flex-wrap gap-2">
            <input type="hidden" name="orderId" value={id} />
            <Input name="promoCode" placeholder="Промокод" className="max-w-[160px]" />
            <Button type="submit" variant="secondary" size="sm">
              По коду
            </Button>
          </form>
        </div>
        <form action={addEstimateVersion} className="mt-4 grid gap-2 md:grid-cols-4">
          <input type="hidden" name="orderId" value={id} />
          <Input name="zone" placeholder="Зона" required />
          <Input name="operation" placeholder="Операция" required />
          <Input name="priceRub" type="number" placeholder="Цена ₽" required />
          <Button type="submit" variant="secondary">
            + строка (новая версия)
          </Button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-medium">Дополнительные работы</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {supps.map((s) => (
            <li key={s.id} className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <span>{s.reason}</span>
              <span>
                {formatRub(s.priceDeltaRub)} · {s.status}
              </span>
            </li>
          ))}
        </ul>
        <form action={createSupplement} className="mt-4 grid gap-2 md:grid-cols-3">
          <input type="hidden" name="orderId" value={id} />
          <Input name="reason" placeholder="Причина" required />
          <Input name="priceDeltaRub" type="number" placeholder="+₽" required />
          <Input name="scheduleImpactDays" type="number" placeholder="Дней к сроку" />
          <Button type="submit" className="md:col-span-3">
            Предложить доп. работы клиенту
          </Button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-medium">Операции и назначение мастеров</h3>
        <ul className="mt-3 space-y-3">
          {ops.map((op) => (
            <li key={op.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{op.title}</p>
              <p className="text-zinc-600">{op.description}</p>
              <p className="mt-1">
                Статус: {op.status}
                {op.waitReason ? ` · ${op.waitReason}` : ""}
              </p>
              <form action={assignOperation} className="mt-2 flex flex-wrap gap-2">
                <input type="hidden" name="operationId" value={op.id} />
                <select
                  name="assigneeUserId"
                  className="rounded border px-2 py-1"
                  defaultValue={op.assigneeUserId ?? ""}
                >
                  <option value="">Выберите мастера</option>
                  {masters.map(({ user }) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="secondary">
                  Назначить
                </Button>
              </form>
              {op.status === "QC_REVIEW" && (
                <form action={approveQc} className="mt-2">
                  <input type="hidden" name="operationId" value={op.id} />
                  <Button type="submit">QC: принять операцию</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={createOperationWithChecklist} className="mt-4 grid gap-2 md:grid-cols-4">
          <input type="hidden" name="orderId" value={id} />
          <input type="hidden" name="workshopId" value={order.workshopId} />
          <Input name="title" placeholder="Название операции" required />
          <select name="kind" className="rounded border px-2">
            <option value="PAINT">Покраска</option>
            <option value="WELD">Сварка</option>
          </select>
          <select name="assigneeUserId" className="rounded border px-2">
            <option value="">Без назначения</option>
            {masters.map(({ user }) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
          <Button type="submit">Создать с чек-листом</Button>
        </form>
      </section>
    </div>
  );
}
