import { db } from "@/db";
import { orders, workshops, workshopResources } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, count } from "drizzle-orm";

export default async function WorkshopsPage() {
  const { session } = await requireStaff();
  const list = await db.query.workshops.findMany({
    where: eq(workshops.organizationId, session.organizationId),
  });

  const stats = await Promise.all(
    list.map(async (w) => {
      const [c] = await db
        .select({ c: count() })
        .from(orders)
        .where(eq(orders.workshopId, w.id));
      const resources = await db.query.workshopResources.findMany({
        where: eq(workshopResources.workshopId, w.id),
      });
      return { workshop: w, orders: c?.c ?? 0, resources };
    }),
  );

  return (
    <div>
      <h2 className="text-xl font-semibold">Мастерские сети</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {stats.map(({ workshop, orders: oc, resources }) => (
          <div key={workshop.id} className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold">{workshop.name}</h3>
            <p className="text-sm text-zinc-600">{workshop.address}</p>
            <p className="mt-2 text-sm">Заказов: {oc}</p>
            <ul className="mt-2 text-xs text-zinc-500">
              {resources.map((r) => (
                <li key={r.id}>
                  {r.name} ({r.kind})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
