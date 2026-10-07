import { db } from "@/db";
import { inquiries, workshops } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui-shell";

export default async function InquiriesPage() {
  const { session } = await requireStaff();
  const list = await db
    .select({
      inquiry: inquiries,
      workshopName: workshops.name,
    })
    .from(inquiries)
    .innerJoin(workshops, eq(inquiries.workshopId, workshops.id))
    .where(eq(inquiries.organizationId, session.organizationId))
    .orderBy(desc(inquiries.createdAt));

  return (
    <div>
      <h2 className="text-xl font-semibold">Обращения (лиды)</h2>
      <p className="text-sm text-zinc-600">Воронка продаж по всем филиалам</p>
      <ul className="mt-4 space-y-3">
        {list.map(({ inquiry, workshopName }) => (
          <li key={inquiry.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{inquiry.contactName ?? "Без имени"}</p>
                <p className="text-sm text-zinc-600">
                  {workshopName} · {inquiry.contactPhone}
                </p>
              </div>
              <Badge>{inquiry.stage}</Badge>
            </div>
            <p className="mt-2 text-sm text-zinc-700">{inquiry.description}</p>
            <Link
              href={`/app/inquiries/${inquiry.id}/inspect`}
              className="mt-3 inline-block text-sm text-blue-700"
            >
              Осмотр и приёмка →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
