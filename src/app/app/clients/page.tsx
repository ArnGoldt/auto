import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, orders } from "@/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage() {
  const session = await auth();
  const orgId = session!.user.organizationId;

  const list = await db.query.clients.findMany({
    where: eq(clients.organizationId, orgId),
    orderBy: [desc(clients.createdAt)],
    with: { account: true },
  });

  const allOrders = await db.query.orders.findMany({
    where: eq(orders.organizationId, orgId),
    with: { workshop: true },
  });

  const ordersByClient = new Map<string, typeof allOrders>();
  for (const o of allOrders) {
    const arr = ordersByClient.get(o.clientId) ?? [];
    arr.push(o);
    ordersByClient.set(o.clientId, arr);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Клиенты сети</h1>
      <p className="text-sm text-muted-foreground">
        Единая база по всем филиалам
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Заказы</TableHead>
              <TableHead>ЛК</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет клиентов
                </TableCell>
              </TableRow>
            ) : (
              list.map((c) => {
                const clientOrders = ordersByClient.get(c.id) ?? [];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/app/clients/${c.id}`} className="font-medium hover:underline">
                        {c.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{c.phone ?? "—"}</TableCell>
                    <TableCell>{c.email ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {clientOrders.map((o) => o.workshop?.name).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      {c.account ? (
                        <Badge variant="secondary">Есть доступ</Badge>
                      ) : (
                        <Badge variant="outline">Нет ЛК</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
