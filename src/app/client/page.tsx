import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, supplements } from "@/db/schema";
import {
  formatRub,
  productionStatusLabels,
  salesStatusLabels,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { ApproveSupplementButton } from "@/components/approve-supplement-button";

export default async function ClientHomePage() {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "client") {
    redirect("/client/login");
  }

  const clientId = session.user.clientId!;
  const clientOrders = await db.query.orders.findMany({
    where: eq(orders.clientId, clientId),
    with: { workshop: true, vehicle: true, supplements: true },
    orderBy: (o, { desc }) => [desc(o.updatedAt)],
  });

  const pendingSupplements = clientOrders.flatMap((o) =>
    o.supplements
      .filter((s) => s.status === "pending_client" || s.status === "blocked")
      .map((s) => ({ ...s, orderId: o.id })),
  );

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold">Статус ремонта</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Подтверждённые события · без SMS · согласование не является ЭП
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Что сейчас</p>
          <p className="font-medium mt-1">
            {clientOrders[0]
              ? productionStatusLabels[clientOrders[0].productionStatus]
              : "Нет активных заказов"}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Нужно решение</p>
          <p className="font-medium mt-1">
            {pendingSupplements.length
              ? `${pendingSupplements.length} доп. работ`
              : "Ничего"}
          </p>
        </div>
      </section>

      {pendingSupplements.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Согласование доп. работ</h2>
          {pendingSupplements.map((s) => (
            <div key={s.id} className="border rounded-lg p-4 space-y-2">
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <p>{formatRub(s.amount)}</p>
              <ApproveSupplementButton supplementId={s.id} />
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Мои заказы</h2>
        {clientOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">Заказов пока нет</p>
        ) : (
          clientOrders.map((o) => (
            <Link
              key={o.id}
              href={`/client/orders/${o.id}`}
              className="block border rounded-lg p-4 hover:bg-muted/40"
            >
              <p className="font-medium">
                {o.vehicle?.make} {o.vehicle?.model} · {o.vehicle?.plate}
              </p>
              <p className="text-sm text-muted-foreground">{o.workshop?.name}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline">{salesStatusLabels[o.salesStatus]}</Badge>
                <Badge>{productionStatusLabels[o.productionStatus]}</Badge>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
