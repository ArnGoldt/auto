import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { attachments, operations } from "@/db/schema";
import { MasterOperationClient } from "@/components/master-operation-client";

export default async function MasterOperationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const op = await db.query.operations.findFirst({
    where: and(
      eq(operations.id, id),
      eq(operations.assigneeUserId, session!.user.id),
    ),
    with: {
      order: { with: { vehicle: true } },
      checklistItems: true,
    },
  });
  if (!op) notFound();

  const photoCounts = new Map<string, number>();
  for (const item of op.checklistItems) {
    const photos = await db.query.attachments.findMany({
      where: eq(attachments.checklistItemId, item.id),
    });
    photoCounts.set(item.id, photos.length);
  }

  return (
    <div className="space-y-4">
      <Link href="/master" className="text-sm text-muted-foreground inline-block min-h-[44px] leading-[44px]">
        ← Назад
      </Link>
      <h1 className="text-xl font-semibold">{op.name}</h1>
      <p className="text-muted-foreground">
        {op.order?.vehicle?.make} {op.order?.vehicle?.model} · {op.order?.vehicle?.plate}
      </p>
      {op.zone && <p className="text-sm">Зона: {op.zone}</p>}
      <MasterOperationClient
        operationId={op.id}
        status={op.status}
        items={op.checklistItems.map((i) => ({
          id: i.id,
          label: i.label,
          required: i.required,
          requiresPhoto: i.requiresPhoto,
          completed: i.completed,
          photoCount: photoCounts.get(i.id) ?? 0,
        }))}
      />
    </div>
  );
}
