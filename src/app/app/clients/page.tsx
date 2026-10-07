import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireStaff } from "@/lib/staff-data";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function ClientsPage() {
  const { session } = await requireStaff();
  const list = await db.query.clients.findMany({
    where: eq(clients.organizationId, session.organizationId),
    orderBy: [desc(clients.createdAt)],
  });

  return (
    <div>
      <h2 className="text-xl font-semibold">Клиенты сети</h2>
      <p className="text-sm text-zinc-600">Единая база по всем мастерским</p>
      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-2">ФИО</th>
              <th className="px-4 py-2">Телефон</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{c.fullName}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.email ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`/app/clients/${c.id}`} className="text-blue-700">
                    Карточка
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
