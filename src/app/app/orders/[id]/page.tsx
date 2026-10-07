import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  formatRub,
  productionStatusLabels,
  salesStatusLabels,
  operationStatusLabels,
} from "@/lib/labels";
import { EstimateLineForm } from "@/components/estimate-line-form";
import { AssignOperationForm } from "@/components/assign-operation-form";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      client: true,
      vehicle: true,
      workshop: true,
      operations: { with: { checklistItems: true } },
      supplements: true,
      estimateVersions: { with: { lines: true } },
    },
  });
  if (!order || order.organizationId !== session!.user.organizationId) {
    notFound();
  }

  const latestEstimate = [...order.estimateVersions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
  const masterMemberships = await db.query.memberships.findMany({
    where: and(
      eq(memberships.organizationId, session!.user.organizationId),
      eq(memberships.role, "MASTER"),
    ),
    with: { user: true },
  });
  const masters = masterMemberships.map((m) => ({
    id: m.userId,
    fullName: m.user.fullName,
  }));

  const lines = latestEstimate?.lines ?? [];
  const assignedLineIds = new Set(
    order.operations.map((o) => o.estimateLineId).filter(Boolean),
  );
  const unassignedLines = lines.filter((l) => !assignedLineIds.has(l.id));

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href={`/app/clients/${order.clientId}`} className="text-sm text-muted-foreground hover:underline">
        ← К клиенту {order.client?.fullName}
      </Link>
      <div className="flex flex-wrap gap-2 items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {order.vehicle?.make} {order.vehicle?.model} · {order.vehicle?.plate}
          </h1>
          <p className="text-muted-foreground">{order.workshop?.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{salesStatusLabels[order.salesStatus]}</Badge>
          <Badge>{productionStatusLabels[order.productionStatus]}</Badge>
        </div>
      </div>

      {order.inspectionNotes && (
        <p className="text-sm border rounded-md p-3 bg-muted/40">{order.inspectionNotes}</p>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Смета (версия {latestEstimate?.versionNumber ?? "—"})</h2>
        {latestEstimate && (
          <>
            <p className="text-lg font-semibold">{formatRub(latestEstimate.totalAmount)}</p>
            <ul className="text-sm space-y-1 border rounded-md p-3">
              {lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-4">
                  <span>
                    {l.operationName}
                    {l.zone ? ` · ${l.zone}` : ""}
                  </span>
                  <span>{formatRub(l.price)}</span>
                </li>
              ))}
            </ul>
            <EstimateLineForm orderId={order.id} estimateVersionId={latestEstimate.id} />
          </>
        )}
      </section>

      <AssignOperationForm
        orderId={order.id}
        lines={unassignedLines.map((l) => ({
          id: l.id,
          operationName: l.operationName,
          zone: l.zone,
        }))}
        masters={masters}
      />

      <section className="space-y-2">
        <h2 className="font-medium">Операции производства</h2>
        {order.operations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока не назначено</p>
        ) : (
          <ul className="space-y-2">
            {order.operations.map((op) => {
              const done = op.checklistItems.filter((i) => i.completed).length;
              const total = op.checklistItems.length;
              return (
                <li key={op.id} className="border rounded-md p-3 text-sm">
                  <div className="font-medium">{op.name}</div>
                  <div className="text-muted-foreground flex gap-2 mt-1">
                    <Badge variant="secondary">{operationStatusLabels[op.status]}</Badge>
                    <span>
                      Чек-лист: {done}/{total}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Доп. работы</h2>
        <ul className="space-y-2">
          {order.supplements.map((s) => (
            <li key={s.id} className="border rounded-md p-3 text-sm flex justify-between">
              <span>{s.title}</span>
              <span>
                {formatRub(s.amount)} · <Badge variant="outline">{s.status}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
