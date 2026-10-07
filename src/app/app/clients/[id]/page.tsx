import { createClientPortalAccess } from "@/app/actions/manager";
import { db } from "@/db";
import { clientAccounts, clients, orders, vehicles } from "@/db/schema";
import { Button, Field, Input } from "@/components/ui-shell";
import { requireStaff } from "@/lib/staff-data";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, id),
  });
  if (!client) return <p>Клиент не найден</p>;

  const cars = await db.query.vehicles.findMany({
    where: eq(vehicles.clientId, id),
  });
  const clientOrders = await db.query.orders.findMany({
    where: eq(orders.clientId, id),
  });
  const account = await db.query.clientAccounts.findFirst({
    where: eq(clientAccounts.clientId, id),
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">{client.fullName}</h2>
        <p className="text-zinc-600">
          {client.phone} · {client.email ?? "email не указан"}
        </p>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-medium">Автомобили</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {cars.map((v) => (
            <li key={v.id}>
              {v.make} {v.model} {v.plate ? `· ${v.plate}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-medium">Заказы</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {clientOrders.map((o) => (
            <li key={o.id}>
              <Link href={`/app/orders/${o.id}`} className="text-blue-700">
                Заказ · {o.productionStage} · {o.promisedDateCurrent?.toLocaleDateString("ru-RU")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-medium">Доступ в личный кабинет</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Логин и пароль создаёт менеджер и передаёт клиенту вне системы.
          {account ? ` Текущий логин: ${account.login}` : " Учётная запись не создана."}
        </p>
        <form action={createClientPortalAccess} className="mt-4 max-w-md space-y-2">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label="Логин">
            <Input name="login" required defaultValue={account?.login ?? `client_${client.phone.slice(-4)}`} />
          </Field>
          <Field label="Пароль">
            <Input name="password" type="text" required defaultValue="client1234" />
          </Field>
          <Button type="submit">Сохранить доступ</Button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          Согласования в ЛК не являются электронной подписью (не ЭП).
        </p>
      </section>
    </div>
  );
}
