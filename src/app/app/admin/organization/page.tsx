import { updateOrganization } from "@/app/actions/admin";
import { Button, Field, Input, PageTitle } from "@/components/ui-shell";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireNetworkAdmin } from "@/lib/staff-data";
import { eq } from "drizzle-orm";

export default async function AdminOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { session } = await requireNetworkAdmin();
  const sp = await searchParams;
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.organizationId),
  });
  if (!org) {
    return <p className="text-sm text-red-600">Организация не найдена.</p>;
  }

  return (
    <div>
      <PageTitle
        title="Организация"
        description="Отображаемое и юридическое название сети"
      />
      {sp.saved === "1" && (
        <p className="mb-4 rounded-lg bg-[var(--success-bg)] px-3 py-2 text-sm text-[var(--success)]">
          Сохранено
        </p>
      )}
      <form
        action={updateOrganization}
        className="max-w-lg space-y-1 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-card)]"
      >
        <Field label="Название сети">
          <Input name="name" required defaultValue={org.name} />
        </Field>
        <Field label="Юридическое наименование">
          <Input name="legalName" defaultValue={org.legalName ?? ""} />
        </Field>
        <Button type="submit">Сохранить</Button>
      </form>
    </div>
  );
}
