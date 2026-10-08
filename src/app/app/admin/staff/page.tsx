import { listOrgStaff } from "@/lib/admin-queries";
import {
  Badge,
  Button,
  LinkButton,
  PageTitle,
} from "@/components/ui-shell";
import { requireNetworkAdmin } from "@/lib/staff-data";
import { staffRoleLabel } from "@/lib/roles";
import Link from "next/link";

export default async function AdminStaffListPage() {
  const { session } = await requireNetworkAdmin();
  const staff = await listOrgStaff(session.organizationId);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          title="Сотрудники"
          description="Все учётные записи организации"
        />
        <LinkButton href="/app/admin/staff/new">Добавить сотрудника</LinkButton>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-[var(--surface-muted)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">ФИО</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Филиал</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--navy-900)]">
                  {row.fullName}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{row.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="accent">{staffRoleLabel(row.role)}</Badge>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {row.allBranches
                    ? "Все филиалы"
                    : (row.workshopName ?? "—")}
                </td>
                <td className="px-4 py-3">
                  {row.active ? (
                    <Badge variant="success">Активен</Badge>
                  ) : (
                    <Badge variant="muted">Отключён</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/app/admin/staff/${row.id}`}>
                    <Button type="button" variant="secondary" size="sm">
                      Изменить
                    </Button>
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
