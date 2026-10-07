import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { CreateClientAccountForm } from "@/components/create-client-account-form";
import { Badge } from "@/components/ui/badge";
import { productionStatusLabels, salesStatusLabels } from "@/lib/labels";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      account: true,
      vehicles: true,
      orders: { with: { workshop: true } },
    },
  });
  if (!client || client.organizationId !== session!.user.organizationId) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/app/clients" className="text-sm text-muted-foreground hover:underline">
        ← К списку
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{client.fullName}</h1>
        <p className="text-muted-foreground">
          {client.phone} · {client.email ?? "email не указан"}
        </p>
      </div>

      {!client.account ? (
        <CreateClientAccountForm clientId={client.id} />
      ) : (
        <div className="border rounded-lg p-4 text-sm">
          <p className="font-medium">Личный кабинет</p>
          <p>Логин: <code>{client.account.login}</code></p>
          <Badge className="mt-2" variant={client.account.enabled ? "secondary" : "destructive"}>
            {client.account.enabled ? "Активен" : "Отключён"}
          </Badge>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="font-medium">Автомобили</h2>
        <ul className="text-sm space-y-1">
          {client.vehicles.map((v) => (
            <li key={v.id}>
              {v.make} {v.model} {v.year} · {v.plate}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Заказы во всех филиалах</h2>
        <ul className="space-y-2">
          {client.orders.map((o) => (
            <li key={o.id} className="border rounded-md p-3 text-sm">
              <Link href={`/app/orders/${o.id}`} className="font-medium hover:underline">
                {o.workshop?.name}
              </Link>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Badge variant="outline">{salesStatusLabels[o.salesStatus]}</Badge>
                <Badge>{productionStatusLabels[o.productionStatus]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
