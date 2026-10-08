import { createClientPortalAccess } from "@/app/actions/manager";
import { adjustClientLoyaltyPoints } from "@/app/actions/promotions";
import { db } from "@/db";
import {
  clientAccounts,
  clientLoyalty,
  clients,
  loyaltyTransactions,
  orders,
  vehicles,
} from "@/db/schema";
import { Button, Field, Input } from "@/components/ui-shell";
import { requireStaff } from "@/lib/staff-data";
import { desc, eq } from "drizzle-orm";
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
  const loyalty = await db.query.clientLoyalty.findFirst({
    where: eq(clientLoyalty.clientId, id),
  });
  const loyaltyHistory = await db.query.loyaltyTransactions.findMany({
    where: eq(loyaltyTransactions.clientId, id),
    orderBy: [desc(loyaltyTransactions.createdAt)],
    limit: 10,
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
        <h3 className="font-medium">Баллы лояльности</h3>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--navy-900)]">
          {loyalty?.pointsBalance ?? 0}
          <span className="ml-2 text-base font-normal text-zinc-500">баллов</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          1% от суммы заказа при выдаче авто · 100 баллов = 100 ₽ (скоро)
        </p>
        <ul className="mt-4 space-y-1 text-sm text-zinc-600">
          {loyaltyHistory.map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span>
                {t.reason}{" "}
                <span className="text-xs text-zinc-400">
                  {t.createdAt.toLocaleString("ru-RU")}
                </span>
              </span>
              <span className={t.delta >= 0 ? "text-emerald-700" : "text-red-600"}>
                {t.delta >= 0 ? "+" : ""}
                {t.delta}
              </span>
            </li>
          ))}
          {loyaltyHistory.length === 0 && (
            <li className="text-zinc-400">Пока нет операций</li>
          )}
        </ul>
        <form action={adjustClientLoyaltyPoints} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="clientId" value={client.id} />
          <Input
            name="delta"
            type="number"
            placeholder="+/- баллы"
            className="max-w-[120px]"
            required
          />
          <Input name="reason" placeholder="Комментарий" className="min-w-[200px]" />
          <Button type="submit" variant="secondary" size="sm">
            Корректировка
          </Button>
        </form>
      </section>

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
