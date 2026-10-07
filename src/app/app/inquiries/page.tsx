import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { inquiries, workshops } from "@/db/schema";
import { InquiryCreateForm } from "@/components/inquiry-create-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function InquiriesPage() {
  const session = await auth();
  const orgId = session!.user.organizationId;

  const [list, workshopList] = await Promise.all([
    db.query.inquiries.findMany({
      where: eq(inquiries.organizationId, orgId),
      orderBy: [desc(inquiries.createdAt)],
      with: { workshop: true },
    }),
    db.query.workshops.findMany({ where: eq(workshops.organizationId, orgId) }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Обращения</h1>
      <InquiryCreateForm workshops={workshopList.map((w) => ({ id: w.id, name: w.name }))} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Филиал</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Клиент в CRM</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="text-sm">
                  {i.createdAt.toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell>{i.workshop?.name}</TableCell>
                <TableCell>
                  <div>{i.contactName}</div>
                  <div className="text-muted-foreground text-xs">{i.contactPhone}</div>
                </TableCell>
                <TableCell>
                  {i.clientId ? (
                    <Badge variant="secondary">Создан</Badge>
                  ) : (
                    <Badge variant="outline">Только лид</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!i.clientId ? (
                    <Link
                      href={`/app/inquiries/${i.id}/inspection`}
                      className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-muted"
                    >
                      Осмотр
                    </Link>
                  ) : (
                    <Link
                      href={`/app/clients/${i.clientId}`}
                      className="inline-flex h-8 items-center rounded-md px-3 text-sm hover:bg-muted"
                    >
                      Клиент
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
