import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, workshops, clients, inquiries } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AppDashboardPage() {
  const session = await auth();
  const orgId = session!.user.organizationId;

  const [orderRow, clientRow, inquiryRow, workshopList] = await Promise.all([
    db.select({ c: count() }).from(orders).where(eq(orders.organizationId, orgId)),
    db.select({ c: count() }).from(clients).where(eq(clients.organizationId, orgId)),
    db.select({ c: count() }).from(inquiries).where(eq(inquiries.organizationId, orgId)),
    db.query.workshops.findMany({ where: eq(workshops.organizationId, orgId) }),
  ]);
  const orderCount = orderRow[0]?.c ?? 0;
  const clientCount = clientRow[0]?.c ?? 0;
  const inquiryCount = inquiryRow[0]?.c ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Обзор сети</h1>
        <p className="text-muted-foreground text-sm">
          Все филиалы · {workshopList.length} мастерских
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Клиенты</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{clientCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Обращения</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{inquiryCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заказы</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{orderCount}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Филиалы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workshopList.map((w) => (
            <div key={w.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
              <span>{w.name}</span>
              <span className="text-muted-foreground">{w.address}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Link
        href="/app/inquiries"
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Перейти к обращениям
      </Link>
    </div>
  );
}
