import { db } from "@/db";
import {
  inquiries,
  orders,
  supplements,
  workshops,
} from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, count, and } from "drizzle-orm";

export default async function DirectorPage() {
  const { session } = await requireStaff();
  const branches = await db.query.workshops.findMany({
    where: eq(workshops.organizationId, session.organizationId),
  });

  const branchStats = await Promise.all(
    branches.map(async (b) => {
      const [orderCount] = await db
        .select({ c: count() })
        .from(orders)
        .where(eq(orders.workshopId, b.id));
      const [leads] = await db
        .select({ c: count() })
        .from(inquiries)
        .where(
          and(
            eq(inquiries.workshopId, b.id),
            eq(inquiries.stage, "NEW"),
          ),
        );
      return { branch: b, orders: orderCount?.c ?? 0, leads: leads?.c ?? 0 };
    }),
  );

  const [pendingSupplements] = await db
    .select({ c: count() })
    .from(supplements)
    .where(eq(supplements.status, "PENDING_CLIENT"));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Показатели сети</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {branchStats.map(({ branch, orders: o, leads }) => (
          <div key={branch.id} className="rounded-xl border bg-white p-4">
            <h3 className="font-medium">{branch.name}</h3>
            <p className="mt-2 text-sm">Активных заказов: {o}</p>
            <p className="text-sm">Новых лидов: {leads}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-4">
        <p className="text-sm text-zinc-600">Доп. работ на согласовании у клиентов</p>
        <p className="text-2xl font-semibold">{pendingSupplements?.c ?? 0}</p>
      </div>
    </div>
  );
}
