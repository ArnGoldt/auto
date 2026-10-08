import { listOrgWorkshops } from "@/lib/admin-queries";
import {
  Badge,
  Button,
  LinkButton,
  PageTitle,
} from "@/components/ui-shell";
import { requireNetworkAdmin } from "@/lib/staff-data";
import Link from "next/link";

export default async function AdminWorkshopsPage() {
  const { session } = await requireNetworkAdmin();
  const list = await listOrgWorkshops(session.organizationId);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Мастерские" description="Управление филиалами сети" />
        <LinkButton href="/app/admin/workshops/new">Добавить филиал</LinkButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((w) => (
          <div
            key={w.id}
            className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-[var(--navy-900)]">{w.name}</h3>
              {w.active ? (
                <Badge variant="success">Активен</Badge>
              ) : (
                <Badge variant="muted">Неактивен</Badge>
              )}
            </div>
            {w.address && (
              <p className="mt-2 text-sm text-[var(--muted)]">{w.address}</p>
            )}
            {w.phone && (
              <p className="mt-1 text-sm text-[var(--muted)]">{w.phone}</p>
            )}
            <Link href={`/app/admin/workshops/${w.id}`} className="mt-4 inline-block">
              <Button type="button" variant="secondary" size="sm">
                Изменить
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
