import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { operations } from "@/db/schema";
import { operationStatusLabels } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";

export default async function MasterHomePage() {
  const session = await auth();
  const list = await db.query.operations.findMany({
    where: eq(operations.assigneeUserId, session!.user.id),
    with: {
      order: { with: { vehicle: true, workshop: true } },
      checklistItems: true,
    },
    orderBy: (op, { desc }) => [desc(op.updatedAt)],
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Мои назначения</h1>
      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Нет активных операций
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((op) => {
            const done = op.checklistItems.filter((i) => i.completed).length;
            const total = op.checklistItems.length;
            return (
              <li key={op.id}>
                <Link
                  href={`/master/operations/${op.id}`}
                  className="block border rounded-xl p-4 min-h-[72px] active:bg-muted transition-colors"
                >
                  <p className="font-medium">{op.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {op.order?.vehicle?.plate} · {op.order?.workshop?.name}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge>{operationStatusLabels[op.status]}</Badge>
                    <span className="text-xs text-muted-foreground self-center">
                      Чек-лист {done}/{total}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
