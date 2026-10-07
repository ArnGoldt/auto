import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderEvents } from "@/db/schema";
import { productionStatusLabels, salesStatusLabels } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";

export default async function ClientOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "client") {
    redirect("/client/login");
  }

  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { workshop: true, vehicle: true },
  });
  if (!order || order.clientId !== session.user.clientId) {
    notFound();
  }

  const events = await db.query.orderEvents.findMany({
    where: eq(orderEvents.orderId, id),
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  return (
    <div className="space-y-4 py-4">
      <Link href="/client" className="text-sm text-muted-foreground hover:underline">
        ← К заказам
      </Link>
      <h1 className="text-xl font-semibold">
        {order.vehicle?.make} {order.vehicle?.model}
      </h1>
      <p className="text-muted-foreground">{order.workshop?.name}</p>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline">{salesStatusLabels[order.salesStatus]}</Badge>
        <Badge>{productionStatusLabels[order.productionStatus]}</Badge>
      </div>
      <section>
        <h2 className="font-medium mb-2">Лента</h2>
        <ul className="space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="border-l-2 pl-3 border-muted">
              <p className="font-medium">{e.title}</p>
              {e.body && <p className="text-muted-foreground">{e.body}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {e.createdAt.toLocaleString("ru-RU")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
